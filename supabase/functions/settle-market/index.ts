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
    const { poll_id, winning_option_id, admin_key } = await req.json();

    // Admin key check
    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY');
    if (!expectedKey) {
      console.error('ADMIN_SECRET_KEY env var is not set — settlement refused');
      return new Response(JSON.stringify({ error: 'Server misconfiguration: admin key not set' }), {
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

    if (!poll_id || !winning_option_id) {
      return new Response(JSON.stringify({ error: 'poll_id and winning_option_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── 1. Fetch poll ──────────────────────────────────────────────────────────
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*, poll_options!poll_options_poll_id_fkey(*)')
      .eq('id', poll_id)
      .single();

    if (pollError || !poll) {
      return new Response(JSON.stringify({ error: 'Poll not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (poll.settled_at) {
      return new Response(JSON.stringify({ error: 'Poll already settled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const winningOption = poll.poll_options.find((o: any) => o.id === winning_option_id);
    if (!winningOption) {
      return new Response(JSON.stringify({ error: 'Invalid winning option' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 2. Cancel all open listings for this poll ─────────────────────────────
    const { data: openListings } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('poll_id', poll_id)
      .eq('status', 'active');

    let listingsCancelled = 0;
    for (const listing of openListings || []) {
      const { error: cancelErr } = await supabase.rpc('cancel_listing_atomic', {
        p_listing_id: listing.id,
        p_seller_id:  listing.seller_id,
      });
      if (cancelErr) {
        console.error(`Failed to cancel listing ${listing.id}:`, cancelErr.message);
      } else {
        listingsCancelled++;
      }
    }
    console.log(`Cancelled ${listingsCancelled} open listing(s) before settlement`);

    // ── 3. Fetch ALL votes (staked AND non-staked) for notifications ─────────
    const { data: allVotesRaw, error: allVotesErr } = await supabase
      .from('votes')
      .select('user_id, voter_fingerprint, option_id, stake_amount, is_staked')
      .eq('poll_id', poll_id);

    if (allVotesErr) {
      return new Response(JSON.stringify({ error: 'Failed to fetch votes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allVotes = allVotesRaw || [];
    const stakedVotes = allVotes.filter(v => v.is_staked);
    const totalPool = stakedVotes.reduce((s, v) => s + (Number(v.stake_amount) || 0), 0);
    const stakedLosers = stakedVotes.filter(v => v.option_id !== winning_option_id);
    console.log(`Total pool: $${totalPool.toFixed(2)}, staked losers: ${stakedLosers.length}, total voters: ${allVotes.length}`);

    // ── 4. Get current position holders for the winning option ────────────────
    const { data: winnerPositions, error: posErr } = await supabase
      .from('positions')
      .select('user_id, shares')
      .eq('poll_id', poll_id)
      .eq('option_id', winning_option_id);

    if (posErr) {
      return new Response(JSON.stringify({ error: 'Failed to fetch winner positions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalWinningShares = (winnerPositions || []).reduce(
      (s, p) => s + Number(p.shares), 0
    );
    console.log(`Winning positions: ${winnerPositions?.length}, total shares: ${totalWinningShares.toFixed(4)}`);

    const platformFeeRate = 0.035;
    const siteUrl = 'https://econsultafricaweb.lovable.app';

    // ── Helper: resolve user email from user_id ──────────────────────────────
    const resolveUserEmail = async (userId: string): Promise<string | null> => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('voter_fingerprint')
        .eq('user_id', userId)
        .single();

      if (profile?.voter_fingerprint) {
        const { data: vp } = await supabase
          .from('voter_profiles')
          .select('email')
          .eq('voter_fingerprint', profile.voter_fingerprint)
          .single();
        if (vp?.email) return vp.email;
      }

      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      return user?.email ?? null;
    };

    // ── Helper: resolve email from voter_fingerprint ─────────────────────────
    const resolveEmailFromFingerprint = async (fingerprint: string): Promise<string | null> => {
      const { data: vp } = await supabase
        .from('voter_profiles')
        .select('email')
        .eq('voter_fingerprint', fingerprint)
        .single();
      return vp?.email ?? null;
    };

    // ── Helper: resolve user's first name ────────────────────────────────────
    const resolveUserName = async (userId: string | null, fingerprint: string): Promise<string | null> => {
      if (userId) {
        const { data: up } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', userId)
          .single();
        if (up?.full_name) return up.full_name.split(' ')[0];
      }
      const { data: vp } = await supabase
        .from('voter_profiles')
        .select('full_name')
        .eq('voter_fingerprint', fingerprint)
        .single();
      if (vp?.full_name) return vp.full_name.split(' ')[0];
      return null;
    };

    // ── 5. Payouts (only if there are winning positions) ─────────────────────
    const payoutRecords: any[] = [];

    if (totalWinningShares > 0 && (winnerPositions || []).length > 0) {
      const grossPerShare = Math.min(1.0, totalPool / totalWinningShares);
      console.log(`Gross/share: $${grossPerShare.toFixed(4)}`);

      for (const pos of winnerPositions || []) {
        const grossPayout = parseFloat((Number(pos.shares) * grossPerShare).toFixed(2));
        const feePayout   = parseFloat((grossPayout * platformFeeRate).toFixed(2));
        const netPayout   = parseFloat((grossPayout - feePayout).toFixed(2));

        if (netPayout <= 0) continue;

        // Credit wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance_usd')
          .eq('user_id', pos.user_id)
          .single();

        if (wallet) {
          await supabase.from('wallets').update({
            balance_usd: Number(wallet.balance_usd) + netPayout,
            updated_at:  new Date().toISOString(),
          }).eq('id', wallet.id);

          await supabase.from('wallet_transactions').insert({
            user_id:     pos.user_id,
            type:        'payout',
            amount:      netPayout,
            description: `Settlement payout — ${winningOption.label} ✓`,
            reference:   `payout_${poll_id.slice(0, 8)}_${pos.user_id.slice(0, 8)}_${Date.now()}`,
          });
        }

        const voteRow = allVotes.find(v => v.user_id === pos.user_id);
        payoutRecords.push({
          voter_fingerprint: voteRow?.voter_fingerprint ?? `pos_${pos.user_id.slice(0, 8)}`,
          user_id:  pos.user_id,
          poll_id,
          amount:   netPayout,
          status:   'pending',
          reference: `payout_${poll_id.slice(0, 8)}_${pos.user_id.slice(0, 8)}_${Date.now()}`,
        });
      }
    }

    // ── 6. Persist payout records ──────────────────────────────────────────────
    if (payoutRecords.length > 0) {
      const { error: payoutError } = await supabase.from('payouts').insert(payoutRecords);
      if (payoutError) {
        console.error('Payout insert error:', payoutError.message);
      }
    }

    // ── 7. Settle the poll ─────────────────────────────────────────────────────
    await supabase.from('polls').update({
      status:           'settled',
      outcome:          winningOption.label,
      winning_option_id,
      settled_at:       new Date().toISOString(),
      settled_by:       'super_admin',
    }).eq('id', poll_id);

    // ── 8. Notifications for ALL voters (staked and non-staked) ───────────────
    const notifs: any[] = [];
    const emailPromises: Promise<any>[] = [];

    // Deduplicate voters by user_id (prefer the one with user_id set)
    const voterMap = new Map<string, typeof allVotes[0]>();
    for (const v of allVotes) {
      const key = v.user_id || `fp_${v.voter_fingerprint}`;
      if (!voterMap.has(key)) voterMap.set(key, v);
    }

    for (const [key, vote] of voterMap) {
      const isWinner = vote.option_id === winning_option_id;
      const isStaked = vote.is_staked && Number(vote.stake_amount) > 0;
      const stakeAmt = Number(vote.stake_amount) || 0;

      // Find payout amount if this user won with a stake
      const payoutEntry = isWinner && vote.user_id
        ? payoutRecords.find(p => p.user_id === vote.user_id)
        : null;

      const voterOptionLabel = poll.poll_options.find((o: any) => o.id === vote.option_id)?.label ?? 'Unknown';

      // In-app notification (only for logged-in users) — 4 variants
      if (vote.user_id) {
        const pollLine = `Poll: ${poll.title}`;
        const predLine = `Your prediction: ${voterOptionLabel}`;
        const correctLine = `Correct answer: ${winningOption.label}`;
        const pollBlock = `${pollLine}\n${predLine}\n${correctLine}`;

        if (isWinner && isStaked && payoutEntry) {
          notifs.push({
            user_id: vote.user_id,
            type:    'position_won',
            title:   `You got it right — and it paid off. 🎯`,
            body:    `${pollBlock}\nYou staked $${stakeAmt.toFixed(2)} and earned $${payoutEntry.amount.toFixed(2)}. Navigate to your dashboard to view or withdraw earnings.\nKeep building your edge on the Forecast Arena.`,
            poll_id,
            link:    '/my-dashboard',
          });
        } else if (isWinner) {
          notifs.push({
            user_id: vote.user_id,
            type:    'position_won',
            title:   `Nice call. You got it right. 🎯`,
            body:    `${pollBlock}\nYour forecast matched the outcome. Keep going — consistency is your edge. Take another position on the Forecast Arena.`,
            poll_id,
            link:    '/forecast-arena',
          });
        } else if (!isWinner && isStaked) {
          notifs.push({
            user_id: vote.user_id,
            type:    'position_lost',
            title:   `Missed this one. 📊`,
            body:    `${pollBlock}\nYou staked $${stakeAmt.toFixed(2)} → Outcome didn't go your way.\nRefine your thinking and take another shot. Take another position on the Forecast Arena.`,
            poll_id,
            link:    '/forecast-arena',
          });
        } else {
          notifs.push({
            user_id: vote.user_id,
            type:    'position_lost',
            title:   `Missed this one. 📊`,
            body:    `${pollBlock}\nEvery call sharpens your edge. Stay consistent. Take another position on the Forecast Arena.`,
            poll_id,
            link:    '/forecast-arena',
          });
        }
      }

      // Email notifications
      const resolveEmail = async (): Promise<string | null> => {
        if (vote.user_id) return resolveUserEmail(vote.user_id);
        return resolveEmailFromFingerprint(vote.voter_fingerprint);
      };

      const voterOptionLabel = poll.poll_options.find((o: any) => o.id === vote.option_id)?.label ?? 'Unknown';

      if (isWinner) {
        emailPromises.push(
          (async () => {
            const email = await resolveEmail();
            if (!email) return;
            const firstName = await resolveUserName(vote.user_id, vote.voter_fingerprint);
            const netGain = payoutEntry ? (payoutEntry.amount - stakeAmt) : 0;
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'settlement-winner',
                recipientEmail: email,
                idempotencyKey: `settlement-winner-${poll_id}-${key}`,
                templateData: {
                  pollTitle:     poll.title,
                  winningOption: winningOption.label,
                  userOption:    voterOptionLabel,
                  payoutAmount:  payoutEntry ? `$${payoutEntry.amount.toFixed(2)}` : '$0.00',
                  stakeAmount:   `$${stakeAmt.toFixed(2)}`,
                  netGain:       `$${netGain.toFixed(2)}`,
                  pollUrl:       `${siteUrl}/forecast-arena/${poll.slug}`,
                  arenaUrl:      `${siteUrl}/forecast-arena`,
                  userName:      firstName,
                  isStaked,
                },
              },
            });
          })().catch(e => console.error('Winner email error:', e.message))
        );
      } else {
        emailPromises.push(
          (async () => {
            const email = await resolveEmail();
            if (!email) return;
            const firstName = await resolveUserName(vote.user_id, vote.voter_fingerprint);
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'settlement-loser',
                recipientEmail: email,
                idempotencyKey: `settlement-loser-${poll_id}-${key}`,
                templateData: {
                  pollTitle:     poll.title,
                  winningOption: winningOption.label,
                  userOption:    voterOptionLabel,
                  stakeAmount:   `$${stakeAmt.toFixed(2)}`,
                  arenaUrl:      `${siteUrl}/forecast-arena`,
                  userName:      firstName,
                  isStaked,
                },
              },
            });
          })().catch(e => console.error('Loser email error:', e.message))
        );
      }
    }

    // ── 9. Insert notifications (deduplicated by user_id) ─────────────────────
    if (notifs.length > 0) {
      const seen = new Set<string>();
      const uniqueNotifs = notifs.filter(n => {
        if (seen.has(n.user_id)) return false;
        seen.add(n.user_id);
        return true;
      });
      const { error: notifErr } = await supabase.from('notifications').insert(uniqueNotifs);
      if (notifErr) console.error('Notification insert error:', notifErr.message);
      else console.log(`Inserted ${uniqueNotifs.length} notification(s)`);
    }

    // ── 10. Audit log (ALWAYS runs) ───────────────────────────────────────────
    const grossPerShare = totalWinningShares > 0
      ? Math.min(1.0, totalPool / totalWinningShares)
      : 0;

    await supabase.from('admin_audit_log').insert({
      action:      'settle_market',
      entity_type: 'poll',
      entity_id:   poll_id,
      details: {
        winning_option:         winningOption.label,
        winning_option_id,
        total_pool:             totalPool,
        total_winning_shares:   totalWinningShares,
        gross_per_share:        grossPerShare,
        platform_fee_rate:      platformFeeRate,
        winner_positions:       (winnerPositions || []).length,
        staked_loser_votes:     stakedLosers.length,
        total_voters:           allVotes.length,
        listings_cancelled:     listingsCancelled,
        total_net_payouts:      payoutRecords.reduce((s, p) => s + p.amount, 0),
        settlement_method:      'positions_based',
        notifications_sent:     notifs.length,
      },
      performed_by: 'super_admin',
    });

    // Await emails — do NOT fire-and-forget; Deno kills background work after response
    let emailsSent = 0;
    let emailsFailed = 0;
    if (emailPromises.length > 0) {
      const results = await Promise.allSettled(emailPromises);
      emailsSent   = results.filter(r => r.status === 'fulfilled').length;
      emailsFailed = results.filter(r => r.status === 'rejected').length;
      console.log(`Settlement emails: ${emailsSent} sent, ${emailsFailed} failed`);
    }

    return new Response(JSON.stringify({
      success: true,
      summary: {
        poll_title:           poll.title,
        winning_option:       winningOption.label,
        total_pool:           totalPool,
        total_winning_shares: totalWinningShares,
        gross_per_share:      grossPerShare,
        winners_with_payout:  payoutRecords.length,
        total_voters:         allVotes.length,
        notifications_sent:   notifs.length,
        emails_queued:        emailPromises.length,
        losers:               allVotes.filter(v => v.option_id !== winning_option_id).length,
        listings_cancelled:   listingsCancelled,
        total_payouts:        payoutRecords.reduce((s, p) => s + p.amount, 0),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Settlement error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Settlement failed: ' + (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
