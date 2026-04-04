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
        const { poll_id, option_id, voter_fingerprint, amount_usd, user_id: metaUserId, entry_price } = metadata;
        
        let stakeAmountUsd: number;
        if (amount_usd) {
          stakeAmountUsd = Number(amount_usd);
        } else {
          const conv = await localSubunitsToUsd(amount, txCurrency);
          stakeAmountUsd = conv.amountUsd;
        }

        // Resolve user_id: from metadata, or look up from user_profiles
        let resolvedUserId = metaUserId || null;
        if (!resolvedUserId) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('voter_fingerprint', voter_fingerprint)
            .maybeSingle();
          resolvedUserId = profile?.user_id || null;
        }

        // Check for existing vote by fingerprint
        const { data: existingVote } = await supabase
          .from('votes')
          .select('id, user_id')
          .eq('poll_id', poll_id)
          .eq('voter_fingerprint', voter_fingerprint)
          .maybeSingle();

        if (existingVote) {
          // Update existing vote with stake info
          const updateData: Record<string, any> = {
            is_staked: true,
            stake_amount: stakeAmountUsd,
            payment_reference: reference,
            entry_price: entry_price ? Number(entry_price) : null,
          };
          if (!existingVote.user_id && resolvedUserId) {
            updateData.user_id = resolvedUserId;
          }
          await supabase.from('votes').update(updateData).eq('id', existingVote.id);
          await supabase.rpc('increment_stake_amount', { p_option_id: option_id, p_amount: stakeAmountUsd });
        } else {
          // Also check by user_id (fingerprint may have changed)
          let foundByUserId = false;
          if (resolvedUserId) {
            const { data: userVote } = await supabase
              .from('votes')
              .select('id')
              .eq('poll_id', poll_id)
              .eq('user_id', resolvedUserId)
              .maybeSingle();
            if (userVote) {
              await supabase.from('votes').update({
                is_staked: true,
                stake_amount: stakeAmountUsd,
                payment_reference: reference,
                entry_price: entry_price ? Number(entry_price) : null,
              }).eq('id', userVote.id);
              await supabase.rpc('increment_stake_amount', { p_option_id: option_id, p_amount: stakeAmountUsd });
              foundByUserId = true;
            }
          }

          if (!foundByUserId) {
            // No existing vote at all — create new one
            const { error: voteError } = await supabase.from('votes').insert({
              poll_id,
              option_id,
              voter_fingerprint,
              is_staked: true,
              stake_amount: stakeAmountUsd,
              payment_reference: reference,
              user_id: resolvedUserId,
              entry_price: entry_price ? Number(entry_price) : null,
            });
            if (voteError) {
              console.error('Vote insert error:', voteError);
            } else {
              await supabase.rpc('increment_vote_count', { p_option_id: option_id });
              await supabase.rpc('increment_stake_amount', { p_option_id: option_id, p_amount: stakeAmountUsd });
            }
          }
        }
      }

      // ── SYNC TO POSITIONS TABLE (unified AMM ledger) ──
      // Writing to positions lets Paystack stakers sell via the AMM (sell-shares).
      // Settlement still reads votes.is_staked, which remains the source of truth for payouts.
      if (metadata?.type === 'forecast_stake' && resolvedUserId) {
        const { poll_id: pId, option_id: oId, entry_price: ep } = metadata;
        const entryPriceNum = ep ? Number(ep) : 0;
        const sharesFromStake = entryPriceNum > 0
          ? parseFloat((stakeAmountUsd / entryPriceNum).toFixed(4))
          : parseFloat((stakeAmountUsd / 0.5).toFixed(4));

        if (sharesFromStake > 0) {
          const { data: existingPos } = await supabase
            .from('positions')
            .select('id, shares, total_cost')
            .eq('user_id', resolvedUserId)
            .eq('poll_id', pId)
            .eq('option_id', oId)
            .maybeSingle();

          if (existingPos) {
            const newShares = parseFloat((Number(existingPos.shares) + sharesFromStake).toFixed(4));
            const newTotalCost = parseFloat((Number(existingPos.total_cost) + stakeAmountUsd).toFixed(2));
            await supabase.from('positions').update({
              shares: newShares,
              avg_price: parseFloat((newTotalCost / newShares).toFixed(4)),
              total_cost: newTotalCost,
              updated_at: new Date().toISOString(),
            }).eq('id', existingPos.id);
          } else {
            await supabase.from('positions').insert({
              user_id: resolvedUserId,
              poll_id: pId,
              option_id: oId,
              shares: sharesFromStake,
              avg_price: entryPriceNum > 0 ? entryPriceNum : parseFloat((stakeAmountUsd / sharesFromStake).toFixed(4)),
              total_cost: parseFloat(stakeAmountUsd.toFixed(2)),
            });
          }
          console.log(`Positions synced: user=${resolvedUserId} shares=${sharesFromStake} poll=${pId}`);
        }
      }

      // ── SEND VOTE CONFIRMATION EMAIL ──
      if (metadata?.type === 'forecast_stake') {
        const { poll_id, option_id, amount_usd, user_id: metaUserId, voter_fingerprint, entry_price } = metadata;
        try {
          // Resolve user email
          let userEmail: string | null = null;
          let userName: string | null = null;
          const resolvedUid = metaUserId || (() => {
            // already resolved above, but we may not have it in scope — re-derive
            return null;
          })();
          if (resolvedUid) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('full_name, username')
              .eq('user_id', resolvedUid)
              .maybeSingle();
            userName = profile?.full_name?.split(' ')[0] || profile?.username || null;
            const { data: authUser } = await supabase.auth.admin.getUserById(resolvedUid);
            userEmail = authUser?.user?.email || null;
          }
          if (!userEmail && voter_fingerprint) {
            const { data: vProfile } = await supabase
              .from('user_profiles')
              .select('user_id, full_name, username')
              .eq('voter_fingerprint', voter_fingerprint)
              .maybeSingle();
            if (vProfile?.user_id) {
              const { data: authUser } = await supabase.auth.admin.getUserById(vProfile.user_id);
              userEmail = authUser?.user?.email || null;
              userName = vProfile.full_name?.split(' ')[0] || vProfile.username || null;
            }
          }

          if (userEmail) {
            // Fetch poll + option details
            const { data: pollData } = await supabase
              .from('polls')
              .select('title, close_at')
              .eq('id', poll_id)
              .maybeSingle();
            const { data: optionData } = await supabase
              .from('poll_options')
              .select('label')
              .eq('id', option_id)
              .maybeSingle();

            const stakeUsd = amount_usd ? Number(amount_usd) : 0;
            const ep = entry_price ? Number(entry_price) : null;
            const resDate = pollData?.close_at
              ? new Date(pollData.close_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'TBD';
            // Expected return = stake / entry_price * (1 - 0.035)
            const expectedReturn = stakeUsd > 0 && ep && ep > 0
              ? `~$${(stakeUsd / ep * 0.965).toFixed(2)}`
              : undefined;

            await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                templateName: 'forecast-vote-confirmation',
                recipientEmail: userEmail,
                templateData: {
                  pollTitle: pollData?.title || 'Forecast Question',
                  selectedOption: optionData?.label || 'Your choice',
                  resolutionDate: resDate,
                  capitalCommitted: stakeUsd > 0 ? `$${stakeUsd.toFixed(2)}` : undefined,
                  expectedReturn,
                  pollUrl: `${Deno.env.get('SITE_URL') || 'https://econsult.africa'}/forecast-arena`,
                  userName,
                  isStaked: stakeUsd > 0,
                },
              }),
            }).catch(e => console.log('Vote confirmation email failed (non-blocking):', e.message));
          }
        } catch (emailErr) {
          console.log('Vote confirmation email error (non-blocking):', (emailErr as Error).message);
        }
      }

      console.log('Webhook processed successfully for:', reference);
    }

    // ── TRANSFER EVENTS (withdrawals + payouts) ──
    if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const { reference, transfer_code, reason, status: transferStatus } = event.data;
      const recipient = event.data.recipient;

      console.log(`Transfer event: ${event.event}, ref: ${reference}, status: ${transferStatus}`);

      const newStatus = event.event === 'transfer.success' ? 'completed'
        : event.event === 'transfer.reversed' ? 'reversed'
        : 'failed';

      // Handle user withdrawals (withdraw_ prefix)
      if (reference?.startsWith('withdraw_')) {
        await supabase
          .from('wallet_transactions')
          .update({ status: newStatus })
          .eq('reference', reference);

        if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
          const { data: wtx } = await supabase
            .from('wallet_transactions')
            .select('user_id, amount')
            .eq('reference', reference)
            .maybeSingle();

          if (wtx) {
            const { data: wallet } = await supabase
              .from('wallets')
              .select('id, balance_usd')
              .eq('user_id', wtx.user_id)
              .maybeSingle();

            if (wallet) {
              await supabase.from('wallets').update({
                balance_usd: Number(wallet.balance_usd) + Math.abs(wtx.amount),
                updated_at: new Date().toISOString(),
              }).eq('id', wallet.id);
            }

            await supabase.from('notifications').insert({
              user_id: wtx.user_id,
              type: 'withdrawal_failed',
              title: 'Withdrawal failed — funds returned',
              body: `Your withdrawal of $${Math.abs(wtx.amount).toFixed(2)} could not be completed. The funds have been returned to your wallet.`,
              link: '/my-dashboard',
            });
          }
        }

        if (event.event === 'transfer.success') {
          const { data: wtx } = await supabase
            .from('wallet_transactions')
            .select('user_id, amount')
            .eq('reference', reference)
            .maybeSingle();

          if (wtx) {
            await supabase.from('notifications').insert({
              user_id: wtx.user_id,
              type: 'withdrawal_completed',
              title: '✅ Withdrawal sent!',
              body: `$${Math.abs(wtx.amount).toFixed(2)} has been sent to your M-Pesa.`,
              link: '/my-dashboard',
            });
          }
        }

        console.log('Withdrawal transfer event processed:', reference, newStatus);
      }

      // Handle payout transfers (payout_ prefix or any non-withdraw transfer)
      if (reference && !reference.startsWith('withdraw_')) {
        // Update payout record
        const { error: payoutErr } = await supabase
          .from('payouts')
          .update({
            status: newStatus,
            settled_at: new Date().toISOString(),
          })
          .eq('reference', reference);

        if (payoutErr) {
          console.error('Payout update error:', payoutErr);
        }

        // Update payout_transfers record
        if (transfer_code) {
          await supabase
            .from('payout_transfers')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('transfer_code', transfer_code);
        }

        // If transfer succeeded, log audit wallet transaction
        if (event.event === 'transfer.success') {
          const { data: payout } = await supabase
            .from('payouts')
            .select('voter_fingerprint, amount, poll_id')
            .eq('reference', reference)
            .maybeSingle();

          if (payout) {
            const { data: vote } = await supabase
              .from('votes')
              .select('user_id')
              .eq('poll_id', payout.poll_id)
              .eq('voter_fingerprint', payout.voter_fingerprint)
              .eq('is_staked', true)
              .maybeSingle();

            if (vote?.user_id) {
              await supabase.from('wallet_transactions').insert({
                user_id: vote.user_id,
                type: 'payout_mpesa',
                amount: payout.amount,
                description: `Forecast payout sent to M-Pesa (${reference})`,
                reference: reference,
                status: 'completed',
              });
            }
          }
        }

        // If transfer failed, notify user
        if (event.event === 'transfer.failed') {
          const { data: payout } = await supabase
            .from('payouts')
            .select('voter_fingerprint, poll_id')
            .eq('reference', reference)
            .maybeSingle();

          if (payout) {
            const { data: vote } = await supabase
              .from('votes')
              .select('user_id')
              .eq('poll_id', payout.poll_id)
              .eq('voter_fingerprint', payout.voter_fingerprint)
              .maybeSingle();

            if (vote?.user_id) {
              await supabase.from('notifications').insert({
                user_id: vote.user_id,
                type: 'payout_failed',
                title: 'Payout transfer failed',
                body: 'Your M-Pesa payout could not be completed. Our team will retry or credit your wallet. Contact support if needed.',
                poll_id: payout.poll_id,
                link: '/my-dashboard',
              });
            }
          }
        }

        console.log('Payout transfer event processed:', reference, newStatus);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
