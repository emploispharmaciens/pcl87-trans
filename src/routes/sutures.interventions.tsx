import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { FAMILY_SHORT, familyColor, fetchProtocoles, normalize } from "@/lib/sutures-api";

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
        placeholder="Rechercher une intervention ou un fil…"
        aria-label="Rechercher une intervention"
      />

      <p className="mt-4 text-sm text-muted-foreground">
        {count} intervention{count > 1 ? "s" : ""} relevée{count > 1 ? "s" : ""}.
      </p>

      <div className="mt-4 space-y-8">
        {isLoading ? <CardSkeleton count={4} /> : null}
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
        ) : null}
        {!isLoading && !isError && count === 0 ? (
          <EmptyState
            icon="bi-search"
            title="Aucune intervention ne correspond"
            hint="Essayez un autre mot."
          />
        ) : null}

        {grouped.map(([region, rows]) => (
          <section key={region}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {region} · {rows.length}
            </h2>
            <div className="space-y-3">
              {rows.map((protocole) => (
                <article key={protocole.id} className="module-card p-4">
                  <h3 className="font-semibold text-module-text">{protocole.nom}</h3>
                  {protocole.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{protocole.description}</p>
                  ) : null}

                  {protocole.fils.length === 0 ? (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      Aucun fil relevé pour cette intervention.
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {protocole.fils.map((f) => (
                        <li key={f.suture.id}>
                          <Link
                            to="/sutures/fil/$slug"
                            params={{ slug: f.suture.slug ?? "" }}
                            className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase transition hover:opacity-80"
                            style={{
                              backgroundColor: `${familyColor(f.suture.famille)}1a`,
                              color: familyColor(f.suture.famille),
                            }}
                            title={`${FAMILY_SHORT[f.suture.famille ?? ""] ?? ""}${f.note ? ` — ${f.note}` : ""}`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: familyColor(f.suture.famille) }}
                              aria-hidden="true"
                            />
                            {f.suture.marque}
                            {f.quantite ? (
                              <span className="text-foreground">{f.quantite}</span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
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
