ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users view own note files'
  ) THEN
    CREATE POLICY "Users view own note files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'note-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users upload own note files'
  ) THEN
    CREATE POLICY "Users upload own note files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'note-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users delete own note files'
  ) THEN
    CREATE POLICY "Users delete own note files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'note-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users view own chapter files'
  ) THEN
    CREATE POLICY "Users view own chapter files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'chapter-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users upload own chapter files'
  ) THEN
    CREATE POLICY "Users upload own chapter files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'chapter-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users delete own chapter files'
  ) THEN
    CREATE POLICY "Users delete own chapter files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'chapter-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;