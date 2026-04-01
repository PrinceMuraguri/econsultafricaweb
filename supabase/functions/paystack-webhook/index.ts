const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: 'Webhook configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify Paystack webhook signature
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(paystackSecretKey),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const computedHash = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (computedHash !== signature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event, 'reference:', event.data?.reference);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event.event === 'charge.success') {
      const { reference, metadata, amount, status } = event.data;

      if (status !== 'success') {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── WALLET DEPOSIT ──
      if (metadata?.type === 'wallet_deposit') {
        const userId = metadata.user_id;
        const amountUsd = metadata.amount_usd || (amount / 100 / 129);

        if (!userId) {
          console.error('wallet_deposit missing user_id in metadata');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Idempotency: check if this reference was already credited
        const { data: existingWtx } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('reference', reference)
          .maybeSingle();

        if (existingWtx) {
          console.log('Wallet deposit already processed:', reference);
          return new Response(JSON.stringify({ received: true, already_processed: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Upsert wallet — create if doesn't exist, add to balance if it does
        const { data: existingWallet } = await supabase
          .from('wallets')
          .select('id, balance_usd')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingWallet) {
          await supabase
            .from('wallets')
            .update({
              balance_usd: Number(existingWallet.balance_usd || 0) + Number(amountUsd),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('wallets')
            .insert({
              user_id: userId,
              balance_usd: Number(amountUsd),
              updated_at: new Date().toISOString(),
            });
        }

        // Log the transaction
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          type: 'deposit',
          amount: Number(amountUsd),
          description: `Wallet top-up via Paystack (${reference})`,
          reference,
          status: 'completed',
        });

        console.log(`Wallet deposit: ${userId} credited $${amountUsd}`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── FORECAST STAKE (existing logic) ──
      // Idempotency: check if already processed
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('reference', reference)
        .maybeSingle();

      if (!existingTx) {
        console.log('No matching transaction for reference:', reference);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (existingTx.status === 'success') {
        console.log('Transaction already processed:', reference);
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'success' })
        .eq('reference', reference);

      // Only process forecast stake metadata
      if (metadata?.type === 'forecast_stake') {
        const { poll_id, option_id, voter_fingerprint, amount_usd } = metadata;
        const stakeAmountUsd = amount_usd || (amount / 100 / 129);

        const { data: existingVote } = await supabase
          .from('votes')
          .select('id')
          .eq('poll_id', poll_id)
          .eq('voter_fingerprint', voter_fingerprint)
          .maybeSingle();

        if (!existingVote) {
          const { error: voteError } = await supabase.from('votes').insert({
            poll_id,
            option_id,
            voter_fingerprint,
            is_staked: true,
            stake_amount: stakeAmountUsd,
            payment_reference: reference,
          });

          if (voteError) {
            console.error('Vote insert error:', voteError);
          } else {
            await supabase.rpc('increment_vote_count', { p_option_id: option_id });
            await supabase.rpc('increment_stake_amount', { p_option_id: option_id, p_amount: stakeAmountUsd });
          }
        }
      }

      console.log('Webhook processed successfully for:', reference);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
