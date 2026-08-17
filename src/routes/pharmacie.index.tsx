import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  PHARMA_CLASSES,
  PHARMA_FAMILIES,
  PHARMA_MAX_DOTATION,
  PHARMA_PRODUCTS,
  familyOf,
  normalizeSearch,
  type PharmaFamily,
  type PharmaProduct,
} from "@/lib/pharmacy";

export const Route = createFileRoute("/pharmacie/")({
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
        content:
          "Référentiel pharmaceutique du bloc : classes, dotations par salle et alertes risque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PharmacySearch,
});

type SiteFilter = "all" | "ORTHO" | "SSPI";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
        active
          ? "bg-module-strong text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-module-text"
      }`}
    >
      {children}
    </button>
  );
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
        <span className="rounded-full bg-muted px-2 py-0.5 uppercase text-muted-foreground">
          {familyOf(product)}
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

function PharmacySearch() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [site, setSite] = useState<SiteFilter>("all");
  const [families, setFamilies] = useState<PharmaFamily[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [riskOnly, setRiskOnly] = useState(false);
  const [minDotation, setMinDotation] = useState(0);

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const results = useMemo(() => {
    const q = normalizeSearch(search.trim());
    return PHARMA_PRODUCTS.filter((p) => {
      if (q && !normalizeSearch(`${p.label} ${p.dci} ${p.classe}`).includes(q)) return false;
      if (families.length > 0 && !families.includes(familyOf(p))) return false;
      if (classes.length > 0 && !classes.includes(p.classe)) return false;
      if (site === "ORTHO" && p.ortho === null) return false;
      if (site === "SSPI" && p.sspi === null) return false;
      if (riskOnly && !p.risque) return false;
      if (minDotation > 0) {
        const value =
          site === "ORTHO"
            ? (p.ortho ?? 0)
            : site === "SSPI"
              ? (p.sspi ?? 0)
              : Math.max(p.ortho ?? 0, p.sspi ?? 0);
        if (value < minDotation) return false;
      }
      return true;
    });
  }, [search, families, classes, site, riskOnly, minDotation]);

  const activeCount =
    families.length + classes.length + (site !== "all" ? 1 : 0) + (riskOnly ? 1 : 0) + (minDotation > 0 ? 1 : 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="relative">
        <i
          className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Propofol, céfazoline, PROPO…"
          aria-label="Rechercher un produit"
          maxLength={80}
          className="pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <i className="bi bi-sliders mr-2" aria-hidden="true" />
          Filtres{activeCount > 0 ? ` · ${activeCount}` : ""}
        </Button>
        {activeCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSite("all");
              setFamilies([]);
              setClasses([]);
              setRiskOnly(false);
              setMinDotation(0);
            }}
          >
            Réinitialiser
          </Button>
        ) : null}
      </div>

      {showFilters ? (
        <div className="module-panel mt-3 space-y-4 p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Secteur</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["ORTHO", "SSPI"] as const).map((s) => (
                <Chip
                  key={s}
                  active={site === s}
                  onClick={() => setSite(site === s ? "all" : s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Famille</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PHARMA_FAMILIES.map((f) => (
                <Chip
                  key={f}
                  active={families.includes(f)}
                  onClick={() => toggle(families, f, setFamilies)}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Classe pharmaco-thérapeutique
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PHARMA_CLASSES.map((c) => (
                <Chip
                  key={c}
                  active={classes.includes(c)}
                  onClick={() => toggle(classes, c, setClasses)}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-module-text">Médicaments à risque uniquement</span>
            <Switch checked={riskOnly} onCheckedChange={setRiskOnly} aria-label="Médicaments à risque" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Dotation minimale : {minDotation}
            </p>
            <Slider
              className="mt-3"
              value={[minDotation]}
              max={PHARMA_MAX_DOTATION}
              step={5}
              onValueChange={(v) => setMinDotation(v[0] ?? 0)}
              aria-label="Dotation minimale"
            />
          </div>
        </div>
      ) : null}

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
  );
}
