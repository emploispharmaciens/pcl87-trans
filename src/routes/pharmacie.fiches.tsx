import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  generateMissingFiches,
  getFicheJob,
  listFicheSlugs,
  resumeFicheJob,
} from "@/lib/pharma-fiche.functions";
import { fullDate } from "@/lib/format";
import { PHARMA_PRODUCTS, normalizeSearch, productSlug } from "@/lib/pharmacy";

export const Route = createFileRoute("/pharmacie/fiches")({
  head: () => ({
    meta: [
      { title: "Fiches produits générées — Pharmacie du bloc — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Suivi des fiches produits du bloc : fiches déjà générées, fiches manquantes et génération en lot.",
      },
      { property: "og:title", content: "Fiches produits — Pharmacie du bloc" },
      {
        property: "og:description",
        content: "Avancement de la base de fiches médicament du bloc opératoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FichesPage,
});

function FichesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const fetchSlugs = useServerFn(listFicheSlugs);
  const runBatch = useServerFn(generateMissingFiches);
  const fetchJob = useServerFn(getFicheJob);
  const resumeJob = useServerFn(resumeFicheJob);

  const slugsQuery = useQuery({
    queryKey: ["pharma-fiche-slugs"],
    queryFn: () => fetchSlugs({}),
    retry: false,
  });

  const jobQuery = useQuery({
    queryKey: ["pharma-fiche-job"],
    queryFn: () => fetchJob({}),
    enabled: isAdmin,
    retry: false,
    refetchInterval: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pharma-fiche-slugs"] });
    queryClient.invalidateQueries({ queryKey: ["pharma-fiche-job"] });
  };

  const batchMutation = useMutation({
    mutationFn: () => runBatch({ data: { limit: 5 } }),
    onSuccess: (result) => {
      invalidate();
      if (result.status === "paused") {
        toast.error(result.reason ?? "Génération en pause (crédits IA).");
        return;
      }
      if (result.status === "locked" || result.status === "skipped") {
        toast.info(result.reason ?? "Génération non lancée.");
        return;
      }
      toast.success(
        `${result.created} fiche(s) générée(s), ${result.remaining} restante(s)` +
          (result.failed.length > 0 ? ` — ${result.failed.length} échec(s)` : ""),
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeJob({}),
    onSuccess: () => {
      invalidate();
      toast.success("Génération automatique réactivée.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const done = useMemo(() => new Set(slugsQuery.data ?? []), [slugsQuery.data]);

  const rows = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return PHARMA_PRODUCTS.filter(
      (p) => !q || normalizeSearch(`${p.label} ${p.dci}`).includes(q),
    ).map((p) => ({ product: p, slug: productSlug(p.label) }));
  }, [search]);

  const job = jobQuery.data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="module-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-module-text">
            {done.size} / {PHARMA_PRODUCTS.length} fiches générées
          </p>
          <p className="text-xs text-muted-foreground">
            Les fiches manquantes se génèrent automatiquement par petits lots (une exécution par
            heure) ; une fiche se génère aussi à sa première ouverture.
          </p>
        </div>
        {isAdmin ? (
          <Button
            type="button"
            disabled={batchMutation.isPending}
            onClick={() => batchMutation.mutate()}
          >
            <i className="bi bi-stars mr-2" aria-hidden="true" />
            {batchMutation.isPending ? "Génération…" : "Générer 5 fiches manquantes"}
          </Button>
        ) : null}
      </div>

      {isAdmin && job ? (
        <div className="module-card mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0 text-xs text-muted-foreground">
            <p className="text-sm font-semibold text-module-text">
              Génération automatique :{" "}
              {job.status === "paused"
                ? "en pause"
                : job.status === "running"
                  ? "en cours"
                  : "active"}
            </p>
            {job.last_run_at ? <p>Dernière exécution : {fullDate(job.last_run_at)}</p> : null}
            {job.status === "paused" ? (
              <p className="text-destructive">
                {job.pause_reason ?? "Crédits IA indisponibles."} Nouvelle tentative automatique 24 h
                après la mise en pause.
              </p>
            ) : job.last_error ? (
              <p>Dernier incident : {job.last_error}</p>
            ) : null}
          </div>
          {job.status === "paused" ? (
            <Button
              type="button"
              variant="outline"
              disabled={resumeMutation.isPending}
              onClick={() => resumeMutation.mutate()}
            >
              <i className="bi bi-arrow-clockwise mr-2" aria-hidden="true" />
              Reprendre maintenant
            </Button>
          ) : null}
        </div>
      ) : null}


      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filtrer les produits…"
        aria-label="Filtrer les produits"
        maxLength={80}
        className="mt-4"
      />

      <ul className="mt-4 space-y-2">
        {rows.map(({ product, slug }) => (
          <li key={slug}>
            <Link
              to="/pharmacie/fiche/$slug"
              params={{ slug }}
              className="module-card flex items-center justify-between gap-3 p-3 transition hover:border-module-strong"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold uppercase text-module-text">
                  {product.label}
                </span>
                <span className="block truncate text-xs uppercase text-muted-foreground">
                  {product.dci}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                  done.has(slug)
                    ? "bg-module-strong/10 text-module-strong"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done.has(slug) ? "Fiche prête" : "À générer"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
