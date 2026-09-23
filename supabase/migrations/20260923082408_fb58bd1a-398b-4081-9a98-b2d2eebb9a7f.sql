GRANT SELECT, INSERT, UPDATE, DELETE ON public.sutures TO authenticated;
GRANT ALL ON public.sutures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocoles TO authenticated;
GRANT ALL ON public.protocoles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suture_protocoles TO authenticated;
GRANT ALL ON public.suture_protocoles TO service_role;

DROP TRIGGER IF EXISTS touch_sutures_updated_at ON public.sutures;
CREATE TRIGGER touch_sutures_updated_at BEFORE UPDATE ON public.sutures
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_protocoles_updated_at ON public.protocoles;
CREATE TRIGGER touch_protocoles_updated_at BEFORE UPDATE ON public.protocoles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS sutures_slug_idx ON public.sutures (slug);
CREATE INDEX IF NOT EXISTS suture_protocoles_suture_idx ON public.suture_protocoles (suture_id);
CREATE INDEX IF NOT EXISTS suture_protocoles_protocole_idx ON public.suture_protocoles (protocole_id);