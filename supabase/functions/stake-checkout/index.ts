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
    const { email, amount, poll_id, option_id, voter_fingerprint, phone, callback_url } = await req.json();

    if (!email || !amount || !poll_id || !option_id || !voter_fingerprint) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount < 0.01) {
      return new Response(JSON.stringify({ error: 'Minimum stake is $0.01' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Payment configuration error. Please contact support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already voted on this poll
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('voter_fingerprint', voter_fingerprint)
      .maybeSingle();

    if (existingVote) {
      return new Response(JSON.stringify({ error: 'You have already voted on this poll' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate platform fee (3.5%)
    const platformFee = Math.round(amount * 0.035 * 100) / 100;
    const netStake = Math.round((amount - platformFee) * 100) / 100;
    const totalVotes = await getTotalVotes(supabase, poll_id);
    const optionVotes = await getOptionVotes(supabase, option_id);
    const impliedProbability = totalVotes > 0 ? optionVotes / totalVotes : 0.5;

    const reference = `stake_${poll_id.slice(0, 8)}_${Date.now()}`;
    const useMpesa = !!phone;
    const amountInCents = Math.round(amount * 100);

    // Create pending transaction with extended fields
    const { error: txError } = await supabase.from('transactions').insert({
      voter_fingerprint,
      poll_id,
      option_id,
      amount,
      currency: 'KES',
      channel: useMpesa ? 'mpesa' : 'paystack',
      status: 'pending',
      reference,
    });

    if (txError) {
      console.error('Transaction insert error:', txError);
      return new Response(JSON.stringify({ error: 'Could not create transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (useMpesa) {
      // M-PESA STK Push via Paystack Charge API
      // Format phone: strip spaces/dashes, ensure it starts with +254
      let formattedPhone = phone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
      // Remove leading 0 and prepend 254
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.slice(1);
      }
      // If it doesn't start with country code, prepend 254
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }
      // Paystack expects +254... format for M-PESA
      formattedPhone = '+' + formattedPhone;
      console.log('Formatted phone for M-PESA:', formattedPhone);

      const chargeResponse = await fetch('https://api.paystack.co/charge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInCents,
          currency: 'KES',
          reference,
          mobile_money: {
            phone: formattedPhone,
            provider: 'mpesa',
          },
          metadata: {
            type: 'forecast_stake',
            poll_id,
            option_id,
            voter_fingerprint,
            platform_fee: platformFee,
            net_stake: netStake,
            implied_probability: impliedProbability,
          },
        }),
      });

      const chargeData = await chargeResponse.json();
      console.log('Paystack M-PESA charge full response:', JSON.stringify(chargeData));

      if (!chargeData.status) {
        return new Response(JSON.stringify({ error: chargeData.message || 'M-PESA charge failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // M-PESA returns status "pay_offline" — STK push sent to phone
      return new Response(JSON.stringify({
        payment_method: 'mpesa',
        status: chargeData.data.status,
        reference: chargeData.data.reference,
        display_text: chargeData.data.display_text || 'Check your phone for the M-PESA prompt',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Standard Paystack redirect checkout
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInCents,
          currency: 'KES',
          reference,
          callback_url: callback_url || undefined,
          metadata: {
            type: 'forecast_stake',
            poll_id,
            option_id,
            voter_fingerprint,
            platform_fee: platformFee,
            net_stake: netStake,
            implied_probability: impliedProbability,
          },
        }),
      });

      const data = await response.json();

      if (!data.status) {
        return new Response(JSON.stringify({ error: data.message || 'Failed to initialize payment' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        payment_method: 'card',
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Stake checkout error:', error.message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getTotalVotes(supabase: any, pollId: string): Promise<number> {
  const { data } = await supabase
    .from('poll_options')
    .select('total_votes_count')
    .eq('poll_id', pollId);
  return data?.reduce((s: number, o: any) => s + o.total_votes_count, 0) || 0;
}

async function getOptionVotes(supabase: any, optionId: string): Promise<number> {
  const { data } = await supabase
    .from('poll_options')
    .select('total_votes_count')
    .eq('id', optionId)
    .single();
  return data?.total_votes_count || 0;
}
