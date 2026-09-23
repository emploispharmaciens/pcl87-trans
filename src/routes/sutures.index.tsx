import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import {
  FAMILY_LABELS,
  FAMILY_SHORT,
  SUTURE_FAMILIES,
  fetchSutures,
  isIncomplete,
  matchesSuture,
  type SutureFamily,
  type SutureWithUsage,
} from "@/lib/sutures-api";

export const Route = createFileRoute("/sutures/")({
  head: () => ({
    meta: [
      { title: "Sutures — les fils du bloc orthopédique — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Rechercher un fil de suture : famille, calibre, aiguille, composition et interventions qui le consomment.",
      },
      { property: "og:title", content: "Sutures — référentiel des fils du bloc" },
      {
        property: "og:description",
        content: "Familles de fils, calibres, aiguilles et usage réel par intervention.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuturesList,
});

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

function SutureCard({ suture }: { suture: SutureWithUsage }) {
  const usageCount = suture.usages.length;
  return (
    <Link
      to="/sutures/fil/$slug"
      params={{ slug: suture.slug ?? "" }}
      className="module-card block p-4 transition hover:border-module-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold uppercase text-module-text">{suture.marque}</h3>
          <p className="text-sm text-muted-foreground">
            {suture.type_aiguille || "Aiguille [NON DÉFINI]"}
            {suture.longueur ? ` · ${suture.longueur}` : ""}
          </p>
        </div>
        {suture.note_qualite ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold uppercase text-destructive">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            Vigilance
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full bg-module-strong/10 px-2 py-0.5 uppercase text-module-strong">
          {FAMILY_SHORT[suture.famille ?? ""] ?? "Famille [NON DÉFINI]"}
        </span>
        {suture.calibre ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            Calibre {suture.calibre}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            Calibre [NON DÉFINI]
          </span>
        )}
        {suture.reference ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            Réf. {suture.reference}
          </span>
        ) : null}
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {usageCount === 0
            ? "Jamais demandé"
            : `${usageCount} intervention${usageCount > 1 ? "s" : ""}`}
        </span>
        <span className="ml-auto flex items-center gap-1 text-module-strong">
          Fiche
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function SuturesList() {
  const [search, setSearch] = useState("");
  const [families, setFamilies] = useState<SutureFamily[]>([]);
  const [onlyUsed, setOnlyUsed] = useState(false);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const { data: sutures, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sutures"],
    queryFn: fetchSutures,
  });

  const filtered = useMemo(() => {
    const rows = sutures ?? [];
    return rows
      .filter((s) => matchesSuture(s, search))
      .filter((s) => families.length === 0 || families.includes((s.famille ?? "") as SutureFamily))
      .filter((s) => !onlyUsed || s.usages.length > 0)
      .filter((s) => !onlyIncomplete || isIncomplete(s))
      .sort((a, b) => b.usages.length - a.usages.length);
  }, [sutures, search, families, onlyUsed, onlyIncomplete]);

  const grouped = useMemo(() => {
    const map = new Map<string, SutureWithUsage[]>();
    for (const s of filtered) {
      const key = s.famille ?? "inconnu";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return SUTURE_FAMILIES.flatMap((f) => {
      const rows = map.get(f);
      return rows ? [[f, rows] as const] : [];
    });
  }, [filtered]);

  function toggleFamily(family: SutureFamily) {
    setFamilies((prev) =>
      prev.includes(family) ? prev.filter((f) => f !== family) : [...prev, family],
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un fil, un calibre, une référence…"
          aria-label="Rechercher un fil de suture"
        />

        <div className="flex flex-wrap gap-2">
          {SUTURE_FAMILIES.map((family) => (
            <Chip
              key={family}
              active={families.includes(family)}
              onClick={() => toggleFamily(family)}
            >
              {FAMILY_SHORT[family]}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={onlyUsed} onClick={() => setOnlyUsed((v) => !v)}>
            Utilisés au bloc
          </Chip>
          <Chip active={onlyIncomplete} onClick={() => setOnlyIncomplete((v) => !v)}>
            Fiches incomplètes
          </Chip>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length} fil{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} sur {(sutures ?? []).length}.
      </p>

      <div className="mt-4 space-y-8">
        {isLoading ? <CardSkeleton count={4} /> : null}

        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
        ) : null}

        {!isLoading && !isError && filtered.length === 0 ? (
          <EmptyState
            icon="bi-search"
            title="Aucun fil ne correspond"
            hint="Essayez un autre mot ou retirez les filtres."
          />
        ) : null}

        {grouped.map(([family, rows]) => (
          <section key={family}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {FAMILY_LABELS[family]} · {rows.length}
            </h2>
            <div className="space-y-3">
              {rows.map((suture) => (
                <SutureCard key={suture.id} suture={suture} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
