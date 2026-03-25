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
    const { reference } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Reference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Payment configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      // For M-PESA, status might be "pay_offline" (pending STK push)
      const txStatus = verifyData.data?.status;
      if (txStatus === 'pay_offline' || txStatus === 'pending') {
        return new Response(JSON.stringify({ 
          status: 'pending', 
          message: 'Payment is still being processed. Check your phone for the M-PESA prompt.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Payment not verified', details: verifyData.data?.gateway_response }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = verifyData.data.metadata;
    const { poll_id, option_id, voter_fingerprint } = metadata;
    const amount = verifyData.data.amount / 100;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'success' })
      .eq('reference', reference);

    // Check if vote already exists (idempotency)
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('voter_fingerprint', voter_fingerprint)
      .maybeSingle();

    if (existingVote) {
      return new Response(JSON.stringify({ success: true, message: 'Vote already recorded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the staked vote
    const { error: voteError } = await supabase.from('votes').insert({
      poll_id,
      option_id,
      voter_fingerprint,
      is_staked: true,
      stake_amount: amount,
      payment_reference: reference,
    });

    if (voteError) {
      console.error('Vote insert error:', voteError);
      return new Response(JSON.stringify({ error: 'Vote recording failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment counts
    await supabase.rpc('increment_vote_count', { p_option_id: option_id });
    await supabase.rpc('increment_stake_amount', { p_option_id: option_id, p_amount: amount });

    return new Response(JSON.stringify({
      success: true,
      poll_id,
      option_id,
      amount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Verify stake error:', error.message);
    return new Response(JSON.stringify({ error: 'Verification failed. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
