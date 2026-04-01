
-- Allow public read for admin dashboard (admin validates via secret key in the app)
CREATE POLICY "Public can read all positions" ON public.positions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Public can read all trades" ON public.trades
  FOR SELECT TO anon USING (true);
