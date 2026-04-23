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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pro mode dispatch: fail-closed to demo
    const { data: __cfg, error: __cfgErr } = await supabase
      .from("platform_config")
      .select("pro_mode")
      .eq("id", 1)
      .maybeSingle();
    const proMode: "demo" | "live" =
      !__cfgErr && __cfg?.pro_mode === "live" ? "live" : "demo";

    if (proMode === "demo") {
      return new Response(JSON.stringify({
        demo: true,
        skipped: true,
        message: "Verification not required in demo mode",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First check our own DB — the webhook may have already processed it
    const { data: tx } = await supabase
      .from('transactions')
      .select('id, status, poll_id, option_id, voter_fingerprint, amount, reference')
      .eq('reference', reference)
      .maybeSingle();

    if (!tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If webhook already processed it successfully
    if (tx.status === 'success') {
      // Check if vote was already recorded
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id, user_id')
        .eq('poll_id', tx.poll_id)
        .eq('voter_fingerprint', tx.voter_fingerprint)
        .maybeSingle();

      if (existingVote) {
        // Update the existing vote with stake info from the successful payment
        await supabase
          .from('votes')
          .update({
            is_staked: true,
            stake_amount: tx.amount,
            payment_reference: tx.reference || tx.id,
          })
          .eq('id', existingVote.id);

        return new Response(JSON.stringify({ success: true, message: 'Payment confirmed and vote updated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Webhook updated transaction but didn't record vote yet — do it now
      await recordVote(supabase, tx);
      return new Response(JSON.stringify({ success: true, message: 'Payment confirmed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (tx.status === 'failed') {
      return new Response(JSON.stringify({ error: 'Payment failed', status: 'failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Still pending — verify with Paystack directly
    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ status: 'pending', message: 'Waiting for payment confirmation...' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try transaction verify first (works for card payments)
    let verifyData = await verifyWithPaystack(paystackSecretKey, reference);

    console.log('Paystack verify response:', JSON.stringify({
      status: verifyData?.status,
      txStatus: verifyData?.data?.status,
      gateway: verifyData?.data?.gateway_response,
    }));

    if (verifyData?.data?.status === 'success') {
      // Payment confirmed — update transaction and record vote
      await supabase
        .from('transactions')
        .update({ status: 'success' })
        .eq('reference', reference);

      const metadata = verifyData?.data?.metadata;
      const userId = metadata?.user_id || null;
      await recordVote(supabase, tx, userId);

      return new Response(JSON.stringify({
        success: true,
        poll_id: tx.poll_id,
        option_id: tx.option_id,
        amount: tx.amount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For M-PESA, status could be "pay_offline", "send_otp", "pending", etc.
    const txStatus = verifyData?.data?.status;
    if (txStatus === 'pay_offline' || txStatus === 'send_otp' || txStatus === 'pending' || txStatus === 'open') {
      return new Response(JSON.stringify({
        status: 'pending',
        message: 'Payment is still being processed. Check your phone for the M-PESA prompt.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (txStatus === 'failed' || txStatus === 'abandoned') {
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('reference', reference);

      return new Response(JSON.stringify({
        error: 'Payment failed',
        status: 'failed',
        details: verifyData?.data?.gateway_response,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unknown status — keep polling
    return new Response(JSON.stringify({
      status: 'pending',
      message: 'Still processing...',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Verify stake error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Verification failed. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyWithPaystack(secretKey: string, reference: string) {
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    return await verifyRes.json();
  } catch (e) {
    console.error('Paystack verify API error:', (e as Error).message);
    return null;
  }
}

async function recordVote(supabase: any, tx: any, userId?: string | null) {
  // Check by fingerprint first (existing logic)
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id, user_id')
    .eq('poll_id', tx.poll_id)
    .eq('voter_fingerprint', tx.voter_fingerprint)
    .maybeSingle();

  if (existingVote) {
    // Always update existing vote with stake info
    const updateData: Record<string, any> = {
      is_staked: true,
      stake_amount: tx.amount,
      payment_reference: tx.reference || tx.id,
    };
    // Also set user_id if it's missing
    if (!existingVote.user_id && userId) {
      updateData.user_id = userId;
    }
    await supabase.from('votes').update(updateData).eq('id', existingVote.id);
    // Still increment stake amount on the poll option
    await supabase.rpc('increment_stake_amount', { p_option_id: tx.option_id, p_amount: tx.amount });
    return;
  }

  // Also check by user_id if available (catches case where fingerprint changed)
  if (userId) {
    const { data: userVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', tx.poll_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (userVote) {
      await supabase
        .from('votes')
        .update({ is_staked: true, stake_amount: tx.amount, payment_reference: tx.reference || tx.id })
        .eq('id', userVote.id);
      return;
    }
  }

  // No existing vote — create new one with user_id
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('voter_fingerprint', tx.voter_fingerprint)
      .maybeSingle();
    resolvedUserId = profile?.user_id || null;
  }

  const { error: voteError } = await supabase.from('votes').insert({
    poll_id: tx.poll_id,
    option_id: tx.option_id,
    voter_fingerprint: tx.voter_fingerprint,
    is_staked: true,
    stake_amount: tx.amount,
    payment_reference: tx.reference || tx.id,
    user_id: resolvedUserId,
  });

  if (voteError) {
    console.error('Vote insert error:', voteError);
    return;
  }

  await supabase.rpc('increment_vote_count', { p_option_id: tx.option_id });
  await supabase.rpc('increment_stake_amount', { p_option_id: tx.option_id, p_amount: tx.amount });
}
