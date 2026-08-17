CREATE TABLE public.pharma_signalements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site text NOT NULL,
  product_label text NOT NULL,
  kind text NOT NULL,
  comment text NOT NULL DEFAULT '',
  initials text,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pharma_signalements TO authenticated;
GRANT ALL ON public.pharma_signalements TO service_role;

ALTER TABLE public.pharma_signalements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved read signalements" ON public.pharma_signalements
  FOR SELECT TO authenticated
  USING (private.is_approved(auth.uid()));

CREATE POLICY "approved create signalements" ON public.pharma_signalements
  FOR INSERT TO authenticated
  WITH CHECK (private.is_approved(auth.uid()) AND author_id = auth.uid());

CREATE POLICY "admins delete signalements" ON public.pharma_signalements
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

GRANT DELETE ON public.pharma_signalements TO authenticated;