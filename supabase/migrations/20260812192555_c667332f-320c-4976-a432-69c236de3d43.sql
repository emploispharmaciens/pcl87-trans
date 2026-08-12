ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS google_photo_url text,
  ADD COLUMN IF NOT EXISTS avatar_path text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

DROP POLICY IF EXISTS "avatars read approved" ON storage.objects;
CREATE POLICY "avatars read approved"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND private.is_approved(auth.uid()));