// Re-fires the settlement email branch for a poll that has already been settled.
// Does NOT touch wallets, payouts, listings, AI scoring, notifications or poll status.
// Idempotent: uses the same `settlement-(winner|loser)-{poll_id}-{voterKey}` keys
// as settle-market, so duplicate invocations are no-ops at the email API layer.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getProMode } from '../_shared/pro-mode.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { poll_id, admin_key } = await req.json();

    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY');
    if (!expectedKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: admin key not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (admin_key !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!poll_id) {
      return new Response(JSON.stringify({ error: 'poll_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const proMode = await getProMode(supabase);
    const isDemo = proMode === 'demo';
    const siteUrl = 'https://econsultafricaweb.lovable.app';

    const { data: poll, error: pollErr } = await supabase
      .from('polls')
      .select('*, poll_options!poll_options_poll_id_fkey(*)')
      .eq('id', poll_id)
      .single();
    if (pollErr || !poll) {
      return new Response(JSON.stringify({ error: 'Poll not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (poll.status !== 'settled' || !poll.winning_option_id) {
      return new Response(JSON.stringify({ error: 'Poll is not settled — use settle-market first' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const winningOption = poll.poll_options.find((o: any) => o.id === poll.winning_option_id);

    // Per-winner payout amount lookup (live or demo)
    const payoutMap = new Map<string, number>();
    if (isDemo) {
      const { data: dp } = await supabase
        .from('demo_positions')
        .select('user_id, shares')
        .eq('poll_id', poll_id)
        .eq('option_id', poll.winning_option_id);
      for (const p of dp || []) {
        payoutMap.set(p.user_id, Number((Number(p.shares) * 1.0).toFixed(2)));
      }
    } else {
      const { data: payouts } = await supabase
        .from('payouts')
        .select('user_id, amount')
        .eq('poll_id', poll_id);
      for (const p of payouts || []) {
        if (p.user_id) payoutMap.set(p.user_id, Number(p.amount));
      }
    }

    const { data: allVotesRaw } = await supabase
      .from('votes')
      .select('user_id, voter_fingerprint, option_id, stake_amount, is_staked')
      .eq('poll_id', poll_id);

    const allVotes = allVotesRaw || [];
    const voterMap = new Map<string, typeof allVotes[0]>();
    for (const v of allVotes) {
      const key = v.user_id || `fp_${v.voter_fingerprint}`;
      if (!voterMap.has(key)) voterMap.set(key, v);
    }

    const resolveUserEmail = async (userId: string): Promise<string | null> => {
      const { data: profile } = await supabase
        .from('user_profiles').select('voter_fingerprint').eq('user_id', userId).single();
      if (profile?.voter_fingerprint) {
        const { data: vp } = await supabase
          .from('voter_profiles').select('email')
          .eq('voter_fingerprint', profile.voter_fingerprint).single();
        if (vp?.email) return vp.email;
      }
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      return user?.email ?? null;
    };
    const resolveEmailFromFingerprint = async (fp: string): Promise<string | null> => {
      const { data: vp } = await supabase
        .from('voter_profiles').select('email').eq('voter_fingerprint', fp).single();
      return vp?.email ?? null;
    };
    const resolveUserName = async (userId: string | null, fp: string): Promise<string | null> => {
      if (userId) {
        const { data: up } = await supabase
          .from('user_profiles').select('full_name').eq('user_id', userId).single();
        if (up?.full_name) return up.full_name.split(' ')[0];
      }
      const { data: vp } = await supabase
        .from('voter_profiles').select('full_name').eq('voter_fingerprint', fp).single();
      return vp?.full_name ? vp.full_name.split(' ')[0] : null;
    };

    const promises: Promise<any>[] = [];
    let queued = 0;

    for (const [key, vote] of voterMap) {
      const isWinner = vote.option_id === poll.winning_option_id;
      const isStaked = vote.is_staked && Number(vote.stake_amount) > 0;
      const stakeAmt = Number(vote.stake_amount) || 0;
      const payoutAmt = isWinner && vote.user_id ? (payoutMap.get(vote.user_id) ?? 0) : 0;
      const voterOptionLabel = poll.poll_options.find((o: any) => o.id === vote.option_id)?.label ?? 'Unknown';

      const resolveEmail = async () => vote.user_id
        ? resolveUserEmail(vote.user_id)
        : resolveEmailFromFingerprint(vote.voter_fingerprint);

      promises.push((async () => {
        const email = await resolveEmail();
        if (!email) return;
        const firstName = await resolveUserName(vote.user_id, vote.voter_fingerprint);

        if (isWinner) {
          const netGain = payoutAmt - stakeAmt;
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'settlement-winner',
              recipientEmail: email,
              idempotencyKey: `settlement-winner-${poll_id}-${key}`,
              templateData: {
                pollTitle: poll.title,
                winningOption: winningOption.label,
                userOption: voterOptionLabel,
                payoutAmount: `$${payoutAmt.toFixed(2)}`,
                stakeAmount: `$${stakeAmt.toFixed(2)}`,
                netGain: `$${netGain.toFixed(2)}`,
                pollUrl: `${siteUrl}/forecast-arena-pro/${poll.slug}`,
                arenaUrl: `${siteUrl}/forecast-arena-pro`,
                userName: firstName,
                isStaked,
                isDemo,
              },
            },
          });
        } else {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'settlement-loser',
              recipientEmail: email,
              idempotencyKey: `settlement-loser-${poll_id}-${key}`,
              templateData: {
                pollTitle: poll.title,
                winningOption: winningOption.label,
                userOption: voterOptionLabel,
                stakeAmount: `$${stakeAmt.toFixed(2)}`,
                arenaUrl: `${siteUrl}/forecast-arena-pro`,
                userName: firstName,
                isStaked,
                isDemo,
              },
            },
          });
        }
      })().catch(e => console.error('Resend email error:', e.message)));
      queued++;
    }

    const results = await Promise.allSettled(promises);
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    await supabase.from('admin_audit_log').insert({
      action: 'resend_settlement_emails',
      entity_type: 'poll',
      entity_id: poll_id,
      details: {
        mode: proMode,
        winning_option: winningOption.label,
        voters_processed: voterMap.size,
        emails_queued: queued,
        emails_sent: sent,
        emails_failed: failed,
      },
      performed_by: 'super_admin',
    });

    return new Response(JSON.stringify({
      success: true,
      summary: {
        mode: proMode,
        poll_title: poll.title,
        voters_processed: voterMap.size,
        emails_queued: queued,
        emails_sent: sent,
        emails_failed: failed,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Resend error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Resend failed: ' + (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
