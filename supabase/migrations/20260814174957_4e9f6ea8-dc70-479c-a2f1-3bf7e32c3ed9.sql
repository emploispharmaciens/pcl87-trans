-- 1) Verrouillage des colonnes sensibles du profil pour l'auto-édition
CREATE OR REPLACE FUNCTION private.guard_profile_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  -- Les admins et les opérations serveur (service_role) ne sont pas concernés
  IF auth.uid() IS NULL OR auth.uid() <> OLD.id OR private.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email
     OR NEW.approval IS DISTINCT FROM OLD.approval
     OR NEW.refusal_reason IS DISTINCT FROM OLD.refusal_reason
     OR NEW.avatar_path IS DISTINCT FROM OLD.avatar_path
     OR NEW.google_photo_url IS DISTINCT FROM OLD.google_photo_url
     OR NEW.photo_url IS DISTINCT FROM OLD.photo_url
     OR NEW.last_login_at IS DISTINCT FROM OLD.last_login_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Modification non autorisée de ce champ du profil';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_self_update ON public.profiles;
CREATE TRIGGER profiles_guard_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.guard_profile_self_update();

-- 2) Règles de stockage pour le bucket "avatars" (dossier = user id)
DROP POLICY IF EXISTS "avatars insert own" ON storage.objects;
DROP POLICY IF EXISTS "avatars update own" ON storage.objects;
DROP POLICY IF EXISTS "avatars delete own" ON storage.objects;

CREATE POLICY "avatars insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND private.is_approved(auth.uid())
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars update own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars delete own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
