import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PHARMA_PRODUCTS, normalizeSearch } from "@/lib/pharmacy";

export const Route = createFileRoute("/pharmacie/comparatif")({
  head: () => ({
    meta: [
      { title: "Comparatif ORTHO / SSPI — Pharmacie — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Comparer les dotations pharmaceutiques ORTHO et SSPI d'un même article et repérer les écarts de dotation.",
      },
      { property: "og:title", content: "Comparatif multi-secteurs ORTHO / SSPI" },
      {
        property: "og:description",
        content: "Dotations ORTHO vs SSPI pour un même article du référentiel du bloc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Comparatif,
});

function Comparatif() {
  const [search, setSearch] = useState("");
  const [gapsOnly, setGapsOnly] = useState(false);

  const rows = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return PHARMA_PRODUCTS.filter((p) => p.ortho !== null && p.sspi !== null)
      .filter((p) => !q || normalizeSearch(`${p.label} ${p.dci}`).includes(q))
      .filter((p) => !gapsOnly || p.ortho !== p.sspi)
      .sort((a, b) => {
        const gapA = Math.abs((a.ortho ?? 0) - (a.sspi ?? 0));
        const gapB = Math.abs((b.ortho ?? 0) - (b.sspi ?? 0));
        return gapB - gapA || a.label.localeCompare(b.label, "fr");
      });
  }, [search, gapsOnly]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-xl font-semibold text-module-text">Comparatif multi-secteurs</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dotations ORTHO vs SSPI pour un même article.
      </p>

      <div className="relative mt-4">
        <i
          className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit ou une DCI"
          aria-label="Rechercher un produit"
          maxLength={80}
          className="pl-9"
        />
      </div>

      <Button
        type="button"
        variant={gapsOnly ? "default" : "outline"}
        className="mt-3"
        onClick={() => setGapsOnly((v) => !v)}
        aria-pressed={gapsOnly}
      >
        <i className="bi bi-arrow-left-right mr-2" aria-hidden="true" />
        Écarts uniquement
      </Button>

      <p className="mt-4 text-sm text-muted-foreground">
        {rows.length} ligne{rows.length > 1 ? "s" : ""}
      </p>

      <div className="mt-3 grid gap-3">
        {rows.map((p) => {
          const gap = (p.ortho ?? 0) !== (p.sspi ?? 0);
          return (
            <article key={p.label} className="module-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold uppercase text-module-text">{p.label}</h3>
                  <p className="text-sm uppercase text-muted-foreground">{p.dci}</p>
                  <span className="mt-2 inline-block rounded-full bg-module-strong/10 px-2 py-0.5 text-xs font-medium uppercase text-module-strong">
                    {p.classe}
                  </span>
                </div>
                {p.risque ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold uppercase text-destructive">
                    <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                    Risque
                  </span>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">ORTHO</p>
                  <p className="text-2xl font-bold text-module-strong">{p.ortho}</p>
                  <p className="text-xs text-muted-foreground">{p.unite}</p>
                </div>
                <i
                  className={`bi ${gap ? "bi-arrow-left-right text-destructive" : "bi-arrow-left-right text-muted-foreground"}`}
                  aria-hidden="true"
                />
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">SSPI</p>
                  <p className="text-2xl font-bold text-module-strong">{p.sspi}</p>
                  <p className="text-xs text-muted-foreground">{p.unite}</p>
                </div>
              </div>
            </article>
          );
        })}
        {rows.length === 0 ? (
          <div className="module-card p-6 text-center text-sm text-muted-foreground">
            Aucun article ne correspond à ce filtre.
          </div>
        ) : null}
      </div>
    </main>
  );
}
