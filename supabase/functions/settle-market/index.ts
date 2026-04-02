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

    // Simple admin key check (should be replaced with proper auth in production)
    const expectedKey = Deno.env.get('ADMIN_SECRET_KEY') || 'econsult-admin-2026';
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the poll
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

    // Get the winning option label
    const winningOption = poll.poll_options.find((o: any) => o.id === winning_option_id);
    if (!winningOption) {
      return new Response(JSON.stringify({ error: 'Invalid winning option' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all staked votes for this poll
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('poll_id', poll_id)
      .eq('is_staked', true);

    if (votesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch votes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const winners = votes?.filter(v => v.option_id === winning_option_id) || [];
    const losers = votes?.filter(v => v.option_id !== winning_option_id) || [];

    // Calculate total pool and payouts
    // Each share pays $1 if correct
    // Winner payout = number of shares they bought (stake_amount / share_price_at_entry)
    // But since we store stake_amount (total cost), and each share = $1 payout:
    // shares_bought = stake_amount / share_price
    // payout = shares_bought * $1 = shares_bought
    // For simplicity with our model: payout = stake_amount / implied_probability
    // But we actually have: shares = stake / price, payout = shares * $1
    
    const totalPool = votes?.reduce((s, v) => s + (v.stake_amount || 0), 0) || 0;
    const winnerPool = winners.reduce((s, v) => s + (v.stake_amount || 0), 0);
    
    // Polymarket model: each $1 share costs the implied probability price
    // Winners get $1 per share, losers get nothing
    // The total option votes determine the price at entry
    const totalVotes = poll.poll_options.reduce((s: number, o: any) => s + o.total_votes_count, 0);
    const winningVotes = winningOption.total_votes_count;
    const impliedPrice = totalVotes > 0 ? winningVotes / totalVotes : 0.5;

    // Create payout records for winners
    const payoutRecords = [];
    for (const winner of winners) {
      const stakeAmount = winner.stake_amount || 0;
      // shares = cost / price_per_share
      const sharesOwned = impliedPrice > 0 ? stakeAmount / impliedPrice : stakeAmount;
      // payout = shares * $1
      const payoutAmount = sharesOwned;

      const platformFeeRate = 0.035;
      const grossPayout = Math.round(payoutAmount * 100) / 100;
      const platformFee = Math.round(grossPayout * platformFeeRate * 100) / 100;
      const netPayout = Math.round((grossPayout - platformFee) * 100) / 100;

      payoutRecords.push({
        voter_fingerprint: winner.voter_fingerprint,
        poll_id,
        amount: netPayout,
        status: 'pending',
        reference: `payout_${poll_id.slice(0, 8)}_${winner.voter_fingerprint.slice(0, 8)}_${Date.now()}`,
      });
    }

    // Insert payouts
    if (payoutRecords.length > 0) {
      const { error: payoutError } = await supabase
        .from('payouts')
        .insert(payoutRecords);

      if (payoutError) {
        console.error('Payout insert error:', payoutError);
        return new Response(JSON.stringify({ error: 'Failed to create payout records' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update poll as settled
    await supabase
      .from('polls')
      .update({
        status: 'settled',
        outcome: winningOption.label,
        winning_option_id,
        settled_at: new Date().toISOString(),
        settled_by: 'super_admin',
      })
      .eq('id', poll_id);

    // Audit log
    await supabase.from('admin_audit_log').insert({
      action: 'settle_market',
      entity_type: 'poll',
      entity_id: poll_id,
      details: {
        winning_option: winningOption.label,
        winning_option_id,
        total_pool: totalPool,
        winner_count: winners.length,
        loser_count: losers.length,
        implied_price: impliedPrice,
        total_payouts: payoutRecords.reduce((s, p) => s + p.amount, 0),
      },
      performed_by: 'super_admin',
    });

    // Build notifications — use user_id from votes first, fingerprint as fallback
    const notifs: any[] = [];

    for (const vote of (votes || [])) {
      const isWinner = vote.option_id === winning_option_id;
      let notifUserId = vote.user_id;

      // If vote has no user_id, try looking up via fingerprint
      if (!notifUserId) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('voter_fingerprint', vote.voter_fingerprint)
          .maybeSingle();
        notifUserId = profile?.user_id;
      }

      if (notifUserId) {
        notifs.push({
          user_id: notifUserId,
          type: isWinner ? 'position_won' : 'position_lost',
          title: isWinner
            ? `Correct! "${poll.title}" → ${winningOption.label}`
            : `Resolved: "${poll.title}" → ${winningOption.label}`,
          body: isWinner ? 'Check your dashboard for payout details.' : 'Keep forecasting to improve your accuracy.',
          poll_id,
          link: '/forecast-arena/' + poll.slug,
        });
      }
    }

    if (notifs.length > 0) {
      // Deduplicate by user_id
      const seen = new Set<string>();
      const uniqueNotifs = notifs.filter(n => {
        if (seen.has(n.user_id)) return false;
        seen.add(n.user_id);
        return true;
      });
      await supabase.from('notifications').insert(uniqueNotifs);
    }

    return new Response(JSON.stringify({
      success: true,
      summary: {
        poll_title: poll.title,
        winning_option: winningOption.label,
        total_pool: totalPool,
        winners: winners.length,
        losers: losers.length,
        total_payouts: payoutRecords.reduce((s, p) => s + p.amount, 0),
        payout_records: payoutRecords.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Settlement error:', error.message);
    return new Response(JSON.stringify({ error: 'Settlement failed: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
