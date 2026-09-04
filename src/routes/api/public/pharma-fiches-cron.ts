import { createFileRoute } from "@tanstack/react-router";

/** Nombre de fiches générées par exécution planifiée. */
const BATCH_LIMIT = 6;

/**
 * Point d'entrée planifié (toutes les heures) de la génération des fiches manquantes.
 * Authentifié par un jeton stocké en base et envoyé par le planificateur.
 */
export const Route = createFileRoute("/api/public/pharma-fiches-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-cron-token") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { JOB_ID } = await import("@/lib/pharma-fiche-batch.server");

        const { data: job } = await supabaseAdmin
          .from("pharma_fiche_jobs")
          .select("cron_token")
          .eq("id", JOB_ID)
          .maybeSingle();

        const expected = job?.cron_token ?? "";
        if (!token || !expected || token.length !== expected.length || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { runFicheBatch } = await import("@/lib/pharma-fiche-batch.server");
        const result = await runFicheBatch({ limit: BATCH_LIMIT });
        return Response.json(result);
      },
    },
  },
});
