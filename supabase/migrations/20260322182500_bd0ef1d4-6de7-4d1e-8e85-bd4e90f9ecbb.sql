
UPDATE public.poll_options SET total_votes_count = 0, total_stake_amount = 0;
DELETE FROM public.votes;
DELETE FROM public.transactions;
DELETE FROM public.payouts;
