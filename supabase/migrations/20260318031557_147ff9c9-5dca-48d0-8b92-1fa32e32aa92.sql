INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);

CREATE POLICY "Allow public read on reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');