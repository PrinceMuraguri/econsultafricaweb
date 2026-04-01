const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { poll_id, admin_key } = await req.json();

    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY');
    if (!expectedKey) {
      return new Response(JSON.stringify({ error: 'Admin key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (admin_key !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!poll_id) {
      return new Response(JSON.stringify({ error: 'poll_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Paystack not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending payouts for this poll
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('poll_id', poll_id)
      .eq('status', 'pending');

    if (payoutsError || !payouts?.length) {
      return new Response(JSON.stringify({ error: 'No pending payouts found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batchId = `batch_${poll_id.slice(0, 8)}_${Date.now()}`;
    const results: any[] = [];

    for (const payout of payouts) {
      try {
        // Get voter profile for recipient details
        const { data: profile } = await supabase
          .from('voter_profiles')
          .select('*')
          .eq('voter_fingerprint', payout.voter_fingerprint)
          .maybeSingle();

        if (!profile) {
          results.push({ payout_id: payout.id, status: 'failed', error: 'No profile found' });
          await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
          continue;
        }

        // Check for existing recipient or create one
        let recipientCode: string;

        const { data: existingRecipient } = await supabase
          .from('transfer_recipients')
          .select('recipient_code')
          .eq('voter_fingerprint', payout.voter_fingerprint)
          .eq('recipient_type', 'mobile_money')
          .maybeSingle();

        if (existingRecipient) {
          recipientCode = existingRecipient.recipient_code;
        } else {
          // Create Paystack transfer recipient for mobile money
          let phone = profile.phone_number.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
          if (!phone.startsWith('254')) phone = '254' + phone;

          const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'mobile_money',
              name: profile.full_name,
              email: profile.email,
              account_number: phone,
              bank_code: 'MPESA',
              currency: 'KES',
            }),
          });

          const recipientData = await recipientRes.json();

          if (!recipientData.status) {
            results.push({ payout_id: payout.id, status: 'failed', error: recipientData.message });
            await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
            continue;
          }

          recipientCode = recipientData.data.recipient_code;

          // Save recipient for future use
          await supabase.from('transfer_recipients').insert({
            voter_fingerprint: payout.voter_fingerprint,
            recipient_code: recipientCode,
            recipient_type: 'mobile_money',
            name: profile.full_name,
            email: profile.email,
            phone,
            bank_code: 'MPESA',
            account_number: phone,
            currency: 'KES',
          });
        }

        // Initiate transfer
        const amountInCents = Math.round(payout.amount * 100);
        const transferRes = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: amountInCents,
            recipient: recipientCode,
            reason: `Forecast Arena payout - ${payout.reference}`,
            reference: payout.reference,
            currency: 'KES',
          }),
        });

        const transferData = await transferRes.json();

        if (!transferData.status) {
          results.push({ payout_id: payout.id, status: 'failed', error: transferData.message });
          await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);

          // Log transfer attempt
          await supabase.from('payout_transfers').insert({
            payout_id: payout.id,
            voter_fingerprint: payout.voter_fingerprint,
            recipient_code: recipientCode,
            amount: payout.amount,
            currency: 'KES',
            status: 'failed',
            batch_id: batchId,
            error_message: transferData.message,
          });
          continue;
        }

        const transferCode = transferData.data.transfer_code;

        // Update payout
        await supabase.from('payouts').update({
          status: 'processing',
          transfer_code: transferCode,
          payout_method: 'mpesa',
        }).eq('id', payout.id);

        // Track transfer
        await supabase.from('payout_transfers').insert({
          payout_id: payout.id,
          voter_fingerprint: payout.voter_fingerprint,
          recipient_code: recipientCode,
          transfer_code: transferCode,
          amount: payout.amount,
          currency: 'KES',
          status: 'processing',
          batch_id: batchId,
          paystack_reference: payout.reference,
        });

        results.push({ payout_id: payout.id, status: 'processing', transfer_code: transferCode });
      } catch (err: any) {
        results.push({ payout_id: payout.id, status: 'failed', error: err.message });
        await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
      }
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      action: 'run_payouts',
      entity_type: 'poll',
      entity_id: poll_id,
      details: {
        batch_id: batchId,
        total_payouts: payouts.length,
        successful: results.filter(r => r.status === 'processing').length,
        failed: results.filter(r => r.status === 'failed').length,
      },
      performed_by: 'super_admin',
    });

    return new Response(JSON.stringify({
      success: true,
      batch_id: batchId,
      results,
      summary: {
        total: payouts.length,
        processing: results.filter(r => r.status === 'processing').length,
        failed: results.filter(r => r.status === 'failed').length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Payout error:', error.message);
    return new Response(JSON.stringify({ error: 'Payout processing failed: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
