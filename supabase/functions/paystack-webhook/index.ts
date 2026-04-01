const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const FALLBACK_RATES: Record<string, number> = { KES: 129, NGN: 1600, UGX: 3700, TZS: 2700, ZAR: 18, GHS: 15, RWF: 1350 };

/** Fetch live USD → target currency rate; falls back to hardcoded defaults. */
async function getUsdRate(currency: string): Promise<number> {
  const cur = currency.toUpperCase();
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.[cur];
      if (rate && rate > 0) return rate;
    }
  } catch (e) {
    console.log('FX fallback:', (e as Error).message);
  }
  return FALLBACK_RATES[cur] || 129;
}

/** Convert a local-currency amount (in subunits, e.g. kobo) back to USD. */
async function localSubunitsToUsd(subunits: number, currency: string): Promise<{ amountUsd: number; rate: number }> {
  const rate = await getUsdRate(currency);
  const localAmount = subunits / 100;
  const amountUsd = Math.round((localAmount / rate) * 100) / 100;
  return { amountUsd, rate };
}

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
      const { reference, metadata, amount, status, currency } = event.data;
      // currency comes from Paystack event (e.g. "KES", "NGN")
      const txCurrency = (currency || metadata?.charge_currency || 'KES').toUpperCase();

      if (status !== 'success') {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── WALLET DEPOSIT ──
      if (metadata?.type === 'wallet_deposit') {
        const userId = metadata.user_id;

        if (!userId) {
          console.error('wallet_deposit missing user_id in metadata');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Use amount_usd from checkout metadata if available; otherwise convert live
        let amountUsd: number;
        let fxRate: number;
        if (metadata.amount_usd) {
          amountUsd = Number(metadata.amount_usd);
          fxRate = metadata.exchange_rate || (await getUsdRate(txCurrency));
        } else {
          const conv = await localSubunitsToUsd(amount, txCurrency);
          amountUsd = conv.amountUsd;
          fxRate = conv.rate;
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

        // Upsert wallet
        const { data: existingWallet } = await supabase
          .from('wallets')
          .select('id, balance_usd')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingWallet) {
          await supabase
            .from('wallets')
            .update({
              balance_usd: Number(existingWallet.balance_usd || 0) + amountUsd,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('wallets')
            .insert({
              user_id: userId,
              balance_usd: amountUsd,
              updated_at: new Date().toISOString(),
            });
        }

        // Log with exchange rate for audit
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          type: 'deposit',
          amount: amountUsd,
          description: `Wallet top-up via Paystack (${reference}) — ${txCurrency} @ ${fxRate}`,
          reference,
          status: 'completed',
          exchange_rate: fxRate,
        });

        console.log(`Wallet deposit: ${userId} credited $${amountUsd} (${txCurrency} rate: ${fxRate})`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── FORECAST STAKE ──
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

      await supabase
        .from('transactions')
        .update({ status: 'success' })
        .eq('reference', reference);

      if (metadata?.type === 'forecast_stake') {
        const { poll_id, option_id, voter_fingerprint, amount_usd } = metadata;
        // Use amount_usd from metadata if available; otherwise live-convert
        let stakeAmountUsd: number;
        if (amount_usd) {
          stakeAmountUsd = Number(amount_usd);
        } else {
          const conv = await localSubunitsToUsd(amount, txCurrency);
          stakeAmountUsd = conv.amountUsd;
        }

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
    console.error('Webhook error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
