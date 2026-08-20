CREATE TABLE public.pharma_fiches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL UNIQUE,
  product_label text NOT NULL,
  dci text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text NOT NULL DEFAULT '',
  generated_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pharma_fiches TO authenticated;
GRANT ALL ON public.pharma_fiches TO service_role;

ALTER TABLE public.pharma_fiches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved read fiches" ON public.pharma_fiches
  FOR SELECT TO authenticated
  USING (private.is_approved(auth.uid()));

CREATE POLICY "admins manage fiches" ON public.pharma_fiches
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER pharma_fiches_touch BEFORE UPDATE ON public.pharma_fiches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();