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

    // Admin key check — requires ADMIN_SECRET_KEY env var; no hardcoded fallback
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
    // This returns escrowed shares to sellers' positions and restores votes.stake_amount
    // so the pool calculation below is accurate and no shares are orphaned.
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

    // ── 3. Compute total pool from votes (all staked amounts, after escrow restored) ──
    const { data: allVotes, error: votesError } = await supabase
      .from('votes')
      .select('user_id, voter_fingerprint, option_id, stake_amount, is_staked')
      .eq('poll_id', poll_id)
      .eq('is_staked', true);

    if (votesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch votes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalPool = (allVotes || []).reduce((s, v) => s + (Number(v.stake_amount) || 0), 0);
    const losers    = (allVotes || []).filter(v => v.option_id !== winning_option_id);
    console.log(`Total pool: $${totalPool.toFixed(2)}, losers: ${losers.length}`);

    // ── 4. Get current position holders for the winning option ────────────────
    // Using positions (not votes) ensures secondary market buyers who hold shares
    // at settlement are paid, and sellers who listed/sold their shares are not.
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

    if (totalWinningShares === 0 || (winnerPositions || []).length === 0) {
      // No winning position holders — mark settled with no payouts
      await supabase.from('polls').update({
        status: 'settled',
        outcome: winningOption.label,
        winning_option_id,
        settled_at: new Date().toISOString(),
        settled_by: 'super_admin',
      }).eq('id', poll_id);

      return new Response(JSON.stringify({
        success: true,
        summary: {
          poll_title: poll.title,
          winning_option: winningOption.label,
          total_pool: totalPool,
          winners: 0,
          losers: losers.length,
          total_payouts: 0,
          note: 'No position holders on winning side — pool retained',
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const platformFeeRate = 0.035;

    // Gross per share = min($1.00, pool / total_winning_shares)
    // scaleFactor < 1 when losing stakes don't fully cover winners (e.g. everyone bet correctly)
    const grossPerShare = Math.min(1.0, totalPool / totalWinningShares);
    const scaleFactor   = grossPerShare; // already capped at 1.0
    console.log(`Gross/share: $${grossPerShare.toFixed(4)}, scale: ${scaleFactor.toFixed(4)}`);

    // ── 5. Build payout records and credit wallets ────────────────────────────
    const payoutRecords: any[]  = [];
    const notifs: any[]         = [];
    const emailPromises: Promise<any>[] = [];
    const siteUrl = 'https://econsultafricaweb.lovable.app';

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

      // Find voter_fingerprint from votes (null for secondary buyers — that is fine)
      const voteRow = (allVotes || []).find(v => v.user_id === pos.user_id);

      payoutRecords.push({
        voter_fingerprint: voteRow?.voter_fingerprint ?? `pos_${pos.user_id.slice(0, 8)}`,
        user_id:  pos.user_id,
        poll_id,
        amount:   netPayout,
        status:   'pending',
        reference: `payout_${poll_id.slice(0, 8)}_${pos.user_id.slice(0, 8)}_${Date.now()}`,
      });

      // In-app notification
      notifs.push({
        user_id: pos.user_id,
        type:    'position_won',
        title:   `Correct! "${poll.title}" → ${winningOption.label}`,
        body:    `Your payout of $${netPayout.toFixed(2)} has been credited to your wallet.`,
        poll_id,
        link:    '/forecast-arena/' + poll.slug,
      });

      // Winner email (fire-and-forget)
      emailPromises.push(
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'settlement-winner',
            recipientEmail: undefined, // fetched below
            idempotencyKey: `settlement-winner-${poll_id}-${pos.user_id}`,
            templateData: {
              pollTitle:    poll.title,
              winningOption: winningOption.label,
              payoutAmount:  `$${netPayout.toFixed(2)}`,
              pollUrl:       `${siteUrl}/forecast-arena/${poll.slug}`,
            },
          },
        }).catch(e => console.error('Winner email error:', e.message))
      );
    }

    // Loser notifications (from votes table — original stakers only)
    for (const vote of losers) {
      if (!vote.user_id) continue;
      notifs.push({
        user_id: vote.user_id,
        type:    'position_lost',
        title:   `Resolved: "${poll.title}" → ${winningOption.label}`,
        body:    'Your forecast did not match. Keep forecasting to improve your accuracy.',
        poll_id,
        link:    '/forecast-arena/' + poll.slug,
      });
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

    // ── 8. Notifications (deduplicated) ───────────────────────────────────────
    if (notifs.length > 0) {
      const seen = new Set<string>();
      const uniqueNotifs = notifs.filter(n => {
        if (seen.has(n.user_id)) return false;
        seen.add(n.user_id);
        return true;
      });
      await supabase.from('notifications').insert(uniqueNotifs);
    }

    // ── 9. Audit log ──────────────────────────────────────────────────────────
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
        scale_factor:           scaleFactor,
        platform_fee_rate:      platformFeeRate,
        winner_positions:       (winnerPositions || []).length,
        loser_votes:            losers.length,
        listings_cancelled:     listingsCancelled,
        total_net_payouts:      payoutRecords.reduce((s, p) => s + p.amount, 0),
        settlement_method:      'positions_based',
      },
      performed_by: 'super_admin',
    });

    // Fire emails in background
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).then(results => {
        const sent   = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Settlement emails: ${sent} sent, ${failed} failed`);
      });
    }

    return new Response(JSON.stringify({
      success: true,
      summary: {
        poll_title:          poll.title,
        winning_option:      winningOption.label,
        total_pool:          totalPool,
        total_winning_shares: totalWinningShares,
        gross_per_share:     grossPerShare,
        winners:             payoutRecords.length,
        losers:              losers.length,
        listings_cancelled:  listingsCancelled,
        total_payouts:       payoutRecords.reduce((s, p) => s + p.amount, 0),
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
