import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { AValider } from "@/components/AValider";
import { useAuth } from "@/hooks/useAuth";
import {
  DISPONIBILITE_LABELS,
  FAMILY_SHORT,
  PLAN_ICONS,
  PLAN_LABELS,
  familyColor,
  fetchProtocoles,
  normalize,
  validerLien,
  validerProtocole,
  type ProtocoleWithFils,
} from "@/lib/sutures-api";

const REGION_LABELS: Record<string, string> = {
  hanche: "Hanche",
  genou: "Genou",
  epaule: "Épaule",
  coude: "Coude",
  poignet_main: "Poignet et main",
  tendon: "Tendons",
  autre: "Autres",
};

type Fil = ProtocoleWithFils["fils"][number];

function hasPlans(fils: Fil[]) {
  return fils.some((f) => f.plan);
}

/** Regroupe les fils par plan, dans l'ordre de fermeture. */
function groupByPlan(fils: Fil[]): [string, Fil[]][] {
  const groups = new Map<string, Fil[]>();
  for (const f of fils) {
    const key = f.plan ?? "non_precise";
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.entries()];
}

export const Route = createFileRoute("/sutures/interventions")({
  head: () => ({
    meta: [
      { title: "Quels fils pour quelle intervention — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Pour chaque intervention orthopédique, la liste des fils de suture et agrafes à préparer d'après le relevé du bloc.",
      },
      { property: "og:title", content: "Quels fils pour quelle intervention" },
      {
        property: "og:description",
        content: "Fils et agrafes à sortir par intervention, relevés au bloc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuturesByIntervention,
});

function SuturesByIntervention() {
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();
  const {
    data: protocoles,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["suture-protocoles"],
    queryFn: fetchProtocoles,
  });

  const grouped = useMemo(() => {
    const q = normalize(search);
    const rows = (protocoles ?? []).filter((p) => {
      if (!q) return true;
      if (normalize(p.nom).includes(q)) return true;
      return p.fils.some((f) => normalize(f.suture.marque ?? "").includes(q));
    });

    const map = new Map<string, typeof rows>();
    for (const p of rows) {
      const key = p.region ?? "autre";
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [protocoles, search]);

  const count = grouped.reduce((sum, [, rows]) => sum + rows.length, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un protocole opératoire ou un fil…"
        aria-label="Rechercher un protocole opératoire"
      />

      <p className="mt-4 text-sm text-muted-foreground">
        {count} protocole{count > 1 ? "s" : ""} opératoire{count > 1 ? "s" : ""}.
      </p>

      <div className="mt-4 space-y-8">
        {isLoading ? <CardSkeleton count={4} /> : null}
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
        ) : null}
        {!isLoading && !isError && count === 0 ? (
          <EmptyState
            icon="bi-search"
            title="Aucun protocole ne correspond"
            hint="Essayez un autre mot."
          />
        ) : null}

        {grouped.map(([region, rows]) => (
          <section key={region}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {REGION_LABELS[region] ?? region} · {rows.length}
            </h2>
            <div className="space-y-3">
              {rows.map((protocole) => (
                <article key={protocole.id} className="module-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-module-text">{protocole.nom}</h3>
                    {protocole.a_valider ? (
                      <AValider
                        compact
                        isAdmin={isAdmin}
                        onValider={() => validerProtocole(protocole.id)}
                      />
                    ) : null}
                  </div>
                  {protocole.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{protocole.description}</p>
                  ) : null}

                  {protocole.fils.length === 0 ? (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      Aucun fil relevé pour ce protocole.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {groupByPlan(protocole.fils).map(([plan, fils]) => (
                        <div key={plan}>
                          {plan !== "non_precise" || hasPlans(protocole.fils) ? (
                            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <i
                                className={`bi ${PLAN_ICONS[plan] ?? "bi-question-circle"}`}
                                aria-hidden="true"
                              />
                              {PLAN_LABELS[plan] ?? "Plan non précisé"}
                            </p>
                          ) : null}
                          <ul className="space-y-1.5">
                            {fils.map((f) => (
                              <li
                                key={f.suture.id}
                                className="flex flex-wrap items-center gap-2 rounded-lg border-l-4 bg-muted/40 px-3 py-2 text-sm"
                                style={{ borderLeftColor: familyColor(f.suture.famille) }}
                              >
                                <Link
                                  to="/sutures/fil/$slug"
                                  params={{ slug: f.suture.slug ?? "" }}
                                  className="font-semibold uppercase hover:underline"
                                  style={{ color: familyColor(f.suture.famille) }}
                                  title={FAMILY_SHORT[f.suture.famille ?? ""] ?? ""}
                                >
                                  {f.suture.marque}
                                </Link>
                                {f.suture.statut === "retire" ? (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                                    Hors service
                                  </span>
                                ) : null}
                                {f.quantite ? (
                                  <span className="font-semibold">{f.quantite}</span>
                                ) : null}
                                {f.disponibilite ? (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                                      f.disponibilite === "a_sortir"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                                        : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                                    }`}
                                  >
                                    {DISPONIBILITE_LABELS[f.disponibilite]}
                                  </span>
                                ) : null}
                                {f.note ? (
                                  <span className="text-xs text-muted-foreground">{f.note}</span>
                                ) : null}
                                {f.a_valider ? (
                                  <AValider
                                    compact
                                    isAdmin={isAdmin}
                                    onValider={() => validerLien(f.suture.id, protocole.id)}
                                  />
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
