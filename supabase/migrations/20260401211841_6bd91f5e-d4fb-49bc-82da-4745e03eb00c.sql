-- Allow service_role to insert wallets (for new users with no wallet row)
CREATE POLICY "Service role can insert wallets"
ON public.wallets
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service_role to update wallets (to credit deposit amounts)
CREATE POLICY "Service role can update wallets"
ON public.wallets
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role to read wallets
CREATE POLICY "Service role can read wallets"
ON public.wallets
FOR SELECT
TO service_role
USING (true);

-- Allow service_role to insert wallet_transactions
CREATE POLICY "Service role can insert wallet transactions"
ON public.wallet_transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service_role to read wallet_transactions (for idempotency checks)
CREATE POLICY "Service role can read wallet transactions"
ON public.wallet_transactions
FOR SELECT
TO service_role
USING (true);