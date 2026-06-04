
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE POLICY "Users view own chapter files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chapter-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own chapter files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chapter-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own chapter files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chapter-files' AND auth.uid()::text = (storage.foldername(name))[1]);
