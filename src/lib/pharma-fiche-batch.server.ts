import { PHARMA_PRODUCTS, productSlug } from "@/lib/pharmacy";
import { AiGatewayError, FICHE_MODEL, generateFicheContent } from "@/lib/pharma-fiche.server";

export const JOB_ID = "fiches";
const LEASE_MINUTES = 10;
/** Délai avant nouvelle tentative quand les crédits IA manquent. */
const PAUSE_RETRY_HOURS = 24;

export type BatchResult = {
  status: "done" | "paused" | "skipped" | "locked";
  created: number;
  failed: string[];
  remaining: number;
  total: number;
  reason?: string;
};

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

/**
 * Génère un lot borné de fiches manquantes.
 * - verrou unique en base (bail expirant) : deux exécutions ne se chevauchent pas ;
 * - progression idempotente : chaque fiche est écrite dès qu'elle est générée ;
 * - coupe-circuit : pause persistée sur 402/403, arrêt du lot sur 429.
 * En pause, une seule fiche témoin est tentée par exécution, et seulement après 24 h.
 */
export async function runFicheBatch(options: {
  limit: number;
  generatedBy?: string | null;
  /** Forçage manuel (admin) : ignore le délai de 24 h de la pause. */
  force?: boolean;
}): Promise<BatchResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AdminClient;
  const total = PHARMA_PRODUCTS.length;

  const { data: job } = await admin
    .from("pharma_fiche_jobs")
    .select("status, paused_at, pause_reason, lease_until")
    .eq("id", JOB_ID)
    .maybeSingle();

  let limit = options.limit;
  if (job?.status === "paused" && !options.force) {
    const pausedAt = job.paused_at ? new Date(job.paused_at).getTime() : 0;
    if (Date.now() - pausedAt < PAUSE_RETRY_HOURS * 3600_000) {
      return {
        status: "skipped",
        created: 0,
        failed: [],
        remaining: await countRemaining(admin),
        total,
        reason: job.pause_reason ?? "en pause",
      };
    }
    // Fenêtre de reprise : une seule fiche témoin pour détecter le retour des crédits.
    limit = 1;
  }

  const leaseUntil = new Date(Date.now() + LEASE_MINUTES * 60_000).toISOString();
  const { data: leased } = await admin
    .from("pharma_fiche_jobs")
    .update({ status: "running", lease_until: leaseUntil, last_run_at: new Date().toISOString() })
    .eq("id", JOB_ID)
    .or(`lease_until.is.null,lease_until.lt.${new Date().toISOString()}`)
    .select("id");

  if (!leased || leased.length === 0) {
    return {
      status: "locked",
      created: 0,
      failed: [],
      remaining: await countRemaining(admin),
      total,
      reason: "Une génération est déjà en cours.",
    };
  }

  const { data: rows } = await admin.from("pharma_fiches").select("product_slug");
  const done = new Set((rows ?? []).map((r) => r.product_slug));
  const todo = PHARMA_PRODUCTS.filter((p) => !done.has(productSlug(p.label))).slice(0, limit);

  let created = 0;
  const failed: string[] = [];
  let paused: { reason: string } | null = null;
  let lastError: string | null = null;

  for (const product of todo) {
    try {
      const content = await generateFicheContent(product);
      const { error } = await admin.from("pharma_fiches").upsert(
        {
          product_slug: productSlug(product.label),
          product_label: product.label,
          dci: product.dci,
          content,
          model: FICHE_MODEL,
          generated_by: options.generatedBy ?? null,
        },
        { onConflict: "product_slug" },
      );
      if (error) throw new Error(error.message);
      created += 1;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erreur inconnue";
      if (error instanceof AiGatewayError && (error.status === 402 || error.status === 403)) {
        paused = { reason: lastError };
        break;
      }
      if (error instanceof AiGatewayError && error.status === 429) break;
      console.error("fiche generation failed", product.label, error);
      failed.push(product.label);
    }
  }

  const remaining = total - done.size - created;
  await admin
    .from("pharma_fiche_jobs")
    .update({
      status: paused ? "paused" : "idle",
      lease_until: null,
      pause_reason: paused ? paused.reason : null,
      paused_at: paused ? new Date().toISOString() : null,
      last_error: lastError,
      created_count: done.size + created,
    })
    .eq("id", JOB_ID);

  return {
    status: paused ? "paused" : "done",
    created,
    failed,
    remaining,
    total,
    ...(paused ? { reason: paused.reason } : {}),
  };
}

async function countRemaining(admin: AdminClient): Promise<number> {
  const { count } = await admin
    .from("pharma_fiches")
    .select("product_slug", { count: "exact", head: true });
  return PHARMA_PRODUCTS.length - (count ?? 0);
}
