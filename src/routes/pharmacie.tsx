import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHARMA_CLASSES, PHARMA_PRODUCTS, type PharmaProduct } from "@/lib/pharmacy";

export const Route = createFileRoute("/pharmacie")({
  head: () => ({
    meta: [
      { title: "Pharmacie — référentiel produits du bloc — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Rechercher un médicament ou un dispositif du bloc : classe thérapeutique, dotation ORTHO et SSPI, médicaments à risque.",
      },
      { property: "og:title", content: "Pharmacie — référentiel produits du bloc" },
      {
        property: "og:description",
        content: "Référentiel pharmaceutique du bloc : classes, dotations par salle et alertes risque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate>
      <PharmacyModule />
    </AuthGate>
  ),
});

type SiteFilter = "all" | "ORTHO" | "SSPI";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ProductCard({ product }: { product: PharmaProduct }) {
  return (
    <article className="module-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold uppercase text-module-text">{product.label}</h3>
          <p className="text-sm uppercase text-muted-foreground">{product.dci}</p>
        </div>
        {product.risque ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold uppercase text-destructive">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            Risque
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-module-strong/10 px-2 py-0.5 uppercase text-module-strong">
          {product.classe}
        </span>
        {product.ortho !== null ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            ORTHO · {product.ortho} {product.unite}
          </span>
        ) : null}
        {product.sspi !== null ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            SSPI · {product.sspi} {product.unite}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function PharmacyModule() {
  const [search, setSearch] = useState("");
  const [classe, setClasse] = useState("all");
  const [site, setSite] = useState<SiteFilter>("all");
  const [riskOnly, setRiskOnly] = useState(false);

  const results = useMemo(() => {
    const q = normalize(search.trim());
    return PHARMA_PRODUCTS.filter((p) => {
      if (q && !normalize(`${p.label} ${p.dci} ${p.classe}`).includes(q)) return false;
      if (classe !== "all" && p.classe !== classe) return false;
      if (site === "ORTHO" && p.ortho === null) return false;
      if (site === "SSPI" && p.sspi === null) return false;
      if (riskOnly && !p.risque) return false;
      return true;
    });
  }, [search, classe, site, riskOnly]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ModuleBanner
        icon="bi-capsule"
        title="Pharmacie"
        subtitle="Référentiel produits du bloc : classes, dotations par salle et médicaments à risque."
      />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="module-panel grid grid-cols-2 gap-2 p-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="relative col-span-2 min-w-0 sm:min-w-40 sm:flex-1">
            <i
              className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Propofol, céfazoline, seringue…"
              aria-label="Rechercher un produit"
              maxLength={80}
              className="pl-9"
            />
          </div>

          <Select value={classe} onValueChange={setClasse}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Classe">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {PHARMA_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={site} onValueChange={(v) => setSite(v as SiteFilter)}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Salle">
              <SelectValue placeholder="Salle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les salles</SelectItem>
              <SelectItem value="ORTHO">ORTHO</SelectItem>
              <SelectItem value="SSPI">SSPI</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={riskOnly ? "default" : "outline"}
            onClick={() => setRiskOnly((v) => !v)}
            className="col-span-2 sm:col-span-1"
            aria-pressed={riskOnly}
          >
            <i className="bi bi-exclamation-triangle mr-2" aria-hidden="true" />
            À risque
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {results.length} produit{results.length > 1 ? "s" : ""}
        </p>

        <div className="mt-3 grid gap-3">
          {results.map((p) => (
            <ProductCard key={p.label} product={p} />
          ))}
          {results.length === 0 ? (
            <div className="module-card p-6 text-center text-sm text-muted-foreground">
              Aucun produit ne correspond à cette recherche.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
