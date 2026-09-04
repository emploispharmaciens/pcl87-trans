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

  const slugsQuery = useQuery({
    queryKey: ["pharma-fiche-slugs"],
    queryFn: () => fetchSlugs({}),
    retry: false,
  });

  const batchMutation = useMutation({
    mutationFn: () => runBatch({ data: { limit: 5 } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["pharma-fiche-slugs"] });
      toast.success(
        `${result.created} fiche(s) générée(s), ${result.remaining} restante(s)` +
          (result.failed.length > 0 ? ` — ${result.failed.length} échec(s)` : ""),
      );
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="module-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-module-text">
            {done.size} / {PHARMA_PRODUCTS.length} fiches générées
          </p>
          <p className="text-xs text-muted-foreground">
            Une fiche se génère automatiquement à sa première ouverture ; les admins peuvent lancer
            la génération en lot.
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
