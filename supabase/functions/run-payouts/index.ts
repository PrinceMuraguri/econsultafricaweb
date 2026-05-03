const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FALLBACK_USD_KES_RATE = 129;

async function getUsdToKesRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.KES;
      if (rate && rate > 50 && rate < 300) return rate;
    }
  } catch (e) {
    console.log('FX fallback:', (e as Error).message);
  }
  return FALLBACK_USD_KES_RATE;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { poll_id, admin_key, payout_mode = 'wallet' } = await req.json();

    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY') || 'econsult-admin-2026';
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const proMode = await getProMode(supabase);

    if (proMode === "demo") {
      return new Response(JSON.stringify({
        error: "Payouts are disabled in demo mode",
        demo: true,
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // --- Wallet payout mode (default) ---
    if (payout_mode === 'wallet') {
      for (const payout of payouts) {
        try {
          // Find user_id from the vote
          const { data: vote } = await supabase
            .from('votes')
            .select('user_id')
            .eq('poll_id', payout.poll_id)
            .eq('voter_fingerprint', payout.voter_fingerprint)
            .eq('is_staked', true)
            .maybeSingle();

          let userId = vote?.user_id;
          if (!userId) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('voter_fingerprint', payout.voter_fingerprint)
              .maybeSingle();
            userId = profile?.user_id;
          }

          if (!userId) {
            console.log('No user_id found for payout', payout.id, '— skipping wallet credit');
            results.push({ payout_id: payout.id, status: 'failed', error: 'No user account linked — cannot credit wallet' });
            await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
            continue;
          }

          // Get or create wallet
          const { data: wallet } = await supabase
            .from('wallets')
            .select('id, balance_usd')
            .eq('user_id', userId)
            .maybeSingle();

          if (wallet) {
            await supabase.from('wallets').update({
              balance_usd: Number(wallet.balance_usd) + payout.amount,
              updated_at: new Date().toISOString(),
            }).eq('id', wallet.id);
          } else {
            await supabase.from('wallets').insert({
              user_id: userId,
              balance_usd: payout.amount,
              updated_at: new Date().toISOString(),
            });
          }

          // Log wallet transaction
          await supabase.from('wallet_transactions').insert({
            user_id: userId,
            type: 'payout',
            amount: payout.amount,
            description: `Forecast payout — correct prediction (${payout.reference})`,
            reference: payout.reference,
            status: 'completed',
          });

          // Mark payout as completed
          await supabase.from('payouts').update({
            status: 'completed',
            payout_method: 'wallet',
            settled_at: new Date().toISOString(),
          }).eq('id', payout.id);

          // Send notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'payout_completed',
            title: '💰 Payout credited to your wallet!',
            body: `$${payout.amount.toFixed(2)} has been added to your wallet for your correct forecast.`,
            poll_id: payout.poll_id,
            link: '/my-dashboard',
          });

          console.log(`Wallet payout: ${userId} credited $${payout.amount} for payout ${payout.id}`);
          results.push({ payout_id: payout.id, status: 'completed', method: 'wallet', amount: payout.amount });
        } catch (err: any) {
          console.error('Wallet payout error for', payout.id, ':', err.message, err.stack);
          results.push({ payout_id: payout.id, status: 'failed', error: err.message });
          await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
        }
      }
    } else {
      // --- M-Pesa payout mode ---
      const paystackSecretKey = (Deno.env.get('PAYSTACK_SECRET_KEY') ?? Deno.env.get('Paystack_KEY') ?? '').trim();
      if (!paystackSecretKey) {
        return new Response(JSON.stringify({ error: 'Paystack not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch correct M-Pesa bank code from Paystack
      let mpesaBankCode = 'MPESA';
      try {
        const banksRes = await fetch('https://api.paystack.co/bank?currency=KES&type=mobile_money', {
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
        });
        const banksData = await banksRes.json();
        console.log('Available KES mobile money providers:', JSON.stringify(banksData.data?.map((b: any) => ({ name: b.name, code: b.code })) || []));
        const mpesa = banksData.data?.find((b: any) => b.name.toLowerCase().includes('m-pesa') || b.name.toLowerCase().includes('mpesa'));
        if (mpesa) {
          mpesaBankCode = mpesa.code;
          console.log('Using M-Pesa bank code:', mpesaBankCode);
        }
      } catch (e) {
        console.log('Bank list fetch failed, using default:', mpesaBankCode);
      }

      for (const payout of payouts) {
        try {
          // Step 1: Try voter_profiles (legacy)
          const { data: voterProfile } = await supabase
            .from('voter_profiles')
            .select('*')
            .eq('voter_fingerprint', payout.voter_fingerprint)
            .maybeSingle();

          let profile: { full_name: string; email: string; phone_number: string } | null = voterProfile;

          // Step 2: Fallback to user_profiles + auth
          if (!profile) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('full_name, phone, user_id')
              .eq('voter_fingerprint', payout.voter_fingerprint)
              .maybeSingle();

            if (userProfile) {
              const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userProfile.user_id);
              profile = {
                full_name: userProfile.full_name,
                email: authUser?.email ?? '',
                phone_number: userProfile.phone ?? '',
              };
              console.log('Profile found via user_profiles fallback for fingerprint:', payout.voter_fingerprint);
            }
          }

          // Step 3: Fallback to vote record → user_id → user_profiles
          if (!profile) {
            const { data: vote } = await supabase
              .from('votes')
              .select('user_id')
              .eq('poll_id', payout.poll_id)
              .eq('voter_fingerprint', payout.voter_fingerprint)
              .eq('is_staked', true)
              .maybeSingle();

            if (vote?.user_id) {
              const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('full_name, phone')
                .eq('user_id', vote.user_id)
                .maybeSingle();
              const { data: { user: authUser } } = await supabase.auth.admin.getUserById(vote.user_id);
              if (userProfile || authUser) {
                profile = {
                  full_name: userProfile?.full_name ?? authUser?.email ?? 'User',
                  email: authUser?.email ?? '',
                  phone_number: userProfile?.phone ?? '',
                };
                console.log('Profile found via vote→user fallback for fingerprint:', payout.voter_fingerprint);
              }
            }
          }

          console.log('Profile lookup result:', profile ? 'found' : 'not found', 'fingerprint:', payout.voter_fingerprint);

          if (!profile || !profile.phone_number) {
            results.push({ payout_id: payout.id, status: 'failed', error: !profile ? 'No profile found' : 'No phone number on file — cannot send M-Pesa' });
            await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
            continue;
          }

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
            let phone = profile.phone_number.replace(/\s+/g, '').replace(/^\+/, '');
            if (phone.startsWith('254')) {
              phone = '0' + phone.slice(3);
            }
            console.log('Formatted phone for M-Pesa:', phone, 'original:', profile.phone_number);
            console.log('Creating recipient with phone:', phone, 'bank_code:', mpesaBankCode);

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
                bank_code: mpesaBankCode,
                currency: 'KES',
              }),
            });

            const recipientData = await recipientRes.json();
            console.log('Recipient creation response:', JSON.stringify(recipientData));
            if (!recipientData.status) {
              results.push({ payout_id: payout.id, status: 'failed', error: recipientData.message });
              await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
              continue;
            }

            recipientCode = recipientData.data.recipient_code;

            await supabase.from('transfer_recipients').insert({
              voter_fingerprint: payout.voter_fingerprint,
              recipient_code: recipientCode,
              recipient_type: 'mobile_money',
              name: profile.full_name,
              email: profile.email,
              phone,
              bank_code: mpesaBankCode,
              account_number: phone,
              currency: 'KES',
            });
          }

          const fxRate = await getUsdToKesRate();
          const amountKes = payout.amount * fxRate;
          const amountInCents = Math.round(amountKes * 100);

          console.log(`Payout ${payout.id}: $${payout.amount} USD → KES ${amountKes.toFixed(2)} (rate: ${fxRate}), cents: ${amountInCents}`);
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

          let transferData: any;
          try {
            transferData = await transferRes.json();
          } catch (jsonErr) {
            const rawText = await transferRes.text().catch(() => '(could not read body)');
            console.error(`Paystack transfer returned non-JSON (HTTP ${transferRes.status}):`, rawText);
            results.push({ payout_id: payout.id, status: 'failed', error: `Paystack returned HTTP ${transferRes.status} with non-JSON body` });
            await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
            continue;
          }
          console.log(`Transfer API response (HTTP ${transferRes.status}):`, JSON.stringify(transferData));

          if (transferRes.status !== 200 && transferRes.status !== 201) {
            const errMsg = transferData?.message || `Paystack HTTP ${transferRes.status}`;
            console.error('Paystack transfer failed:', errMsg, JSON.stringify(transferData));
            results.push({ payout_id: payout.id, status: 'failed', error: errMsg });
            await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
            await supabase.from('payout_transfers').insert({
              payout_id: payout.id,
              voter_fingerprint: payout.voter_fingerprint,
              recipient_code: recipientCode,
              amount: payout.amount,
              currency: 'KES',
              status: 'failed',
              batch_id: batchId,
              error_message: errMsg,
            });
            continue;
          }

          if (!transferData.status) {
            results.push({ payout_id: payout.id, status: 'failed', error: transferData.message });
            await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
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

          await supabase.from('payouts').update({
            status: 'processing',
            transfer_code: transferCode,
            payout_method: 'mpesa',
          }).eq('id', payout.id);

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
          console.error('Payout processing error for', payout.id, ':', err.message, err.stack);
          results.push({ payout_id: payout.id, status: 'failed', error: err.message });
          await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
        }
      }
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      action: 'run_payouts',
      entity_type: 'poll',
      entity_id: poll_id,
      details: {
        batch_id: batchId,
        payout_mode,
        total_payouts: payouts.length,
        completed: results.filter(r => r.status === 'completed').length,
        processing: results.filter(r => r.status === 'processing').length,
        failed: results.filter(r => r.status === 'failed').length,
      },
      performed_by: 'super_admin',
    });

    return new Response(JSON.stringify({
      success: true,
      batch_id: batchId,
      payout_mode,
      results,
      summary: {
        total: payouts.length,
        completed: results.filter(r => r.status === 'completed').length,
        processing: results.filter(r => r.status === 'processing').length,
        failed: results.filter(r => r.status === 'failed').length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Payout error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Payout processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
