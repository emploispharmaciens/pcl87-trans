import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { FAMILY_LABELS, fetchSutures } from "@/lib/sutures-api";

export const Route = createFileRoute("/sutures/fil/$slug")({
  head: () => ({
    meta: [
      { title: "Fiche fil de suture — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Fiche d'un fil de suture : famille, calibre, aiguille, longueur, composition, points de vigilance et interventions concernées.",
      },
      { property: "og:title", content: "Fiche fil de suture" },
      {
        property: "og:description",
        content: "Caractéristiques du fil et interventions qui le consomment au bloc.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SutureFiche,
});

const UNDEFINED = "[NON DÉFINI]";

function Row({ label, value }: { label: string; value?: string | null }) {
  const missing = !value;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-48 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={missing ? "text-sm italic text-muted-foreground" : "text-sm"}>
        {value || UNDEFINED}
      </dd>
    </div>
  );
}

function SutureFiche() {
  const { slug } = Route.useParams();
  const { data: sutures, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sutures"],
    queryFn: fetchSutures,
  });

  const suture = (sutures ?? []).find((s) => s.slug === slug);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link
        to="/sutures"
        className="inline-flex items-center gap-2 text-sm font-semibold text-module-strong"
      >
        <i className="bi bi-arrow-left" aria-hidden="true" />
        Tous les fils
      </Link>

      <div className="mt-4">
        {isLoading ? <CardSkeleton count={2} /> : null}
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
        ) : null}
        {!isLoading && !isError && !suture ? (
          <EmptyState
            icon="bi-question-circle"
            title="Fil introuvable"
            hint="Ce fil n'existe pas ou plus dans le référentiel."
          />
        ) : null}
      </div>

      {suture ? (
        <article className="mt-4 space-y-6">
          <header className="module-card p-5">
            <h1 className="text-2xl font-semibold uppercase text-module-text">{suture.marque}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {FAMILY_LABELS[suture.famille ?? ""] ?? `Famille ${UNDEFINED}`}
            </p>
            {suture.note_qualite ? (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <i className="bi bi-exclamation-triangle mt-0.5 shrink-0" aria-hidden="true" />
                <span>{suture.note_qualite}</span>
              </p>
            ) : null}
          </header>

          <section className="module-card p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Caractéristiques
            </h2>
            <dl>
              <Row label="Calibre" value={suture.calibre} />
              <Row label="Aiguille" value={suture.type_aiguille} />
              <Row label="Longueur" value={suture.longueur} />
              <Row label="Composition" value={suture.composition} />
              <Row label="Couleur" value={suture.couleur} />
              <Row label="Référence" value={suture.reference} />
              <Row label="Durée de résorption" value={null} />
              <Row label="Notes d'usage" value={suture.usage_notes} />
            </dl>
          </section>

          <section className="module-card p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Interventions concernées · {suture.usages.length}
            </h2>
            {suture.usages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune demande enregistrée à ce jour. Fil en stock, jamais sorti dans le relevé.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {suture.usages.map((usage) => (
                  <li key={usage.protocole.id} className="flex flex-wrap items-baseline gap-2 py-2">
                    <span className="font-medium">{usage.protocole.nom}</span>
                    {usage.protocole.region ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                        {usage.protocole.region}
                      </span>
                    ) : null}
                    {usage.quantite ? (
                      <span className="text-sm font-semibold text-module-strong">
                        {usage.quantite}
                      </span>
                    ) : null}
                    {usage.note ? (
                      <span className="text-sm text-muted-foreground">— {usage.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {suture.cours ? (
            <section className="module-card p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Cours
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed">{suture.cours}</p>
            </section>
          ) : null}
        </article>
      ) : null}
    </main>
  );
}
