import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { PHARMA_PRODUCTS, type PharmaSite } from "@/lib/pharmacy";

export const Route = createFileRoute("/pharmacie/checklist")({
  head: () => ({
    meta: [
      { title: "Check rapide bloc — Pharmacie — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Checklist de préparation du chariot de bloc : cocher les produits contrôlés par secteur ORTHO ou SSPI et suivre la progression.",
      },
      { property: "og:title", content: "Check rapide bloc — préparation du chariot" },
      {
        property: "og:description",
        content: "Contrôler la dotation du chariot ORTHO ou SSPI, produit par produit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checklist,
});

type Mode = PharmaSite | "RISQUE";

function Checklist() {
  const [mode, setMode] = useState<Mode>("ORTHO");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const items = useMemo(() => {
    const list = PHARMA_PRODUCTS.filter((p) => {
      if (mode === "RISQUE") return p.risque && (p.ortho !== null || p.sspi !== null);
      return (mode === "ORTHO" ? p.ortho : p.sspi) !== null;
    });
    return list.sort(
      (a, b) => a.classe.localeCompare(b.classe, "fr") || a.label.localeCompare(b.label, "fr"),
    );
  }, [mode]);

  const done = items.filter((p) => checked[p.label]).length;
  const percent = items.length === 0 ? 0 : Math.round((done / items.length) * 100);

  const subtitle =
    mode === "RISQUE" ? "Médicaments à risque" : `Préparation du chariot — ${mode}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-xl font-semibold text-module-text">Check rapide bloc</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["ORTHO", "SSPI", "RISQUE"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
          >
            {m === "RISQUE" ? "À risque" : m}
          </Button>
        ))}
        <Button type="button" variant="ghost" onClick={() => setChecked({})}>
          <i className="bi bi-arrow-counterclockwise mr-2" aria-hidden="true" />
          Réinitialiser
        </Button>
      </div>

      <div className="module-panel mt-4 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase text-muted-foreground">Progression</span>
          <span className="text-lg font-bold text-module-strong">
            {done}/{items.length}
          </span>
        </div>
        <Progress value={percent} className="mt-3" />
      </div>

      <ul className="mt-3 grid gap-2">
        {items.map((p) => {
          const qty = mode === "SSPI" ? p.sspi : mode === "ORTHO" ? p.ortho : (p.ortho ?? p.sspi);
          const isDone = !!checked[p.label];
          return (
            <li key={p.label} className="module-card flex items-center gap-3 p-3">
              <Checkbox
                id={`check-${p.label}`}
                checked={isDone}
                onCheckedChange={(v) =>
                  setChecked((prev) => ({ ...prev, [p.label]: v === true }))
                }
              />
              <label htmlFor={`check-${p.label}`} className="min-w-0 flex-1 cursor-pointer">
                <span
                  className={`block truncate font-semibold uppercase ${isDone ? "text-muted-foreground line-through" : "text-module-text"}`}
                >
                  {p.label}
                </span>
                <span className="mt-1 flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-module-strong/10 px-2 py-0.5 uppercase text-module-strong">
                    {p.classe}
                  </span>
                  {p.risque ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 uppercase text-destructive">
                      Risque
                    </span>
                  ) : null}
                </span>
              </label>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-module-text">{qty}</p>
                <p className="text-xs text-muted-foreground">{p.unite}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
