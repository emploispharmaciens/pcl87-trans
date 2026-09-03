CREATE TABLE public.pharma_fiche_jobs (
  id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'idle',
  lease_until timestamptz,
  pause_reason text,
  paused_at timestamptz,
  last_run_at timestamptz,
  last_error text,
  created_count integer NOT NULL DEFAULT 0,
  cron_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT (id, status, lease_until, pause_reason, paused_at, last_run_at, last_error, created_count, created_at, updated_at)
  ON public.pharma_fiche_jobs TO authenticated;
GRANT ALL ON public.pharma_fiche_jobs TO service_role;

ALTER TABLE public.pharma_fiche_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read fiche jobs" ON public.pharma_fiche_jobs
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER pharma_fiche_jobs_touch
  BEFORE UPDATE ON public.pharma_fiche_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.pharma_fiche_jobs (id) VALUES ('fiches');

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'pharma-fiches-batch',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pcl87-trans.lovable.app/api/public/pharma-fiches-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-token', (SELECT cron_token::text FROM public.pharma_fiche_jobs WHERE id = 'fiches')
    ),
    body := '{}'::jsonb
  );
  $$
);