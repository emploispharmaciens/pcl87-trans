import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { SutureForm } from "@/components/SutureForm";
import { SuturePhotos } from "@/components/SuturePhotos";
import { AValider } from "@/components/AValider";
import { CoursRendu, FamilyBadge, PlanChips } from "@/components/SutureVisuals";
import { useAuth } from "@/hooks/useAuth";
import {
  FAMILY_LABELS,
  STATUT_ACTIF,
  STATUT_RETIRE,
  DISPONIBILITE_LABELS,
  PLAN_ICONS,
  PLAN_LABELS,
  deleteSuture,
  familyColor,
  validerFil,
  validerLien,
  validerLienChirurgien,
  fetchSutures,
  isRetired,
  setSutureStatut,
  updateSuture,
  type SutureInput,
} from "@/lib/sutures-api";

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
  const {
    data: sutures,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sutures"],
    queryFn: fetchSutures,
  });

  const suture = (sutures ?? []).find((s) => s.slug === slug);

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["sutures"] });

  const saveMutation = useMutation({
    mutationFn: (input: SutureInput) => updateSuture(suture!.id, input),
    onSuccess: async () => {
      await refresh();
      setEditOpen(false);
      toast.success("Fil enregistré");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statutMutation = useMutation({
    mutationFn: (statut: string) => setSutureStatut(suture!.id, statut),
    onSuccess: async () => {
      await refresh();
      setRetireOpen(false);
      toast.success("Fil enregistré");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSuture(suture!.id),
    onSuccess: async () => {
      setDeleteOpen(false);
      await navigate({ to: "/sutures" });
      await refresh();
      toast.success("Fil supprimé");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const linkCount = suture?.usages.length ?? 0;

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
          <header
            className="module-card border-t-4 p-5"
            style={{ borderTopColor: familyColor(suture.famille) }}
          >
            <h1 className="text-2xl font-semibold uppercase text-module-text">{suture.marque}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <FamilyBadge famille={suture.famille} />
              {suture.calibre ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                  Calibre {suture.calibre}
                </span>
              ) : null}
              <PlanChips plans={suture.plans} />
              {suture.a_valider ? (
                <AValider isAdmin={isAdmin} onValider={() => validerFil(suture.id)} />
              ) : null}
            </div>
            {isRetired(suture) ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                <i className="bi bi-archive" aria-hidden="true" />
                Retiré du service
              </span>
            ) : null}
            {suture.note_qualite ? (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <i className="bi bi-exclamation-triangle mt-0.5 shrink-0" aria-hidden="true" />
                <span>{suture.note_qualite}</span>
              </p>
            ) : null}
          </header>

          <SuturePhotos suture={suture} isAdmin={isAdmin} />

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
              Protocoles opératoires · {suture.usages.length}
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
                    {usage.plan ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs">
                        <i
                          className={`bi ${PLAN_ICONS[usage.plan] ?? "bi-dot"}`}
                          aria-hidden="true"
                        />
                        {PLAN_LABELS[usage.plan] ?? usage.plan}
                      </span>
                    ) : null}
                    {usage.disponibilite ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                        {DISPONIBILITE_LABELS[usage.disponibilite]}
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
                    {usage.a_valider ? (
                      <AValider
                        compact
                        isAdmin={isAdmin}
                        onValider={() => validerLien(suture.id, usage.protocole.id)}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {suture.chirurgiens.length > 0 ? (
            <section className="module-card p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Chirurgiens concernés
              </h2>
              <ul className="space-y-1.5">
                {suture.chirurgiens.map((c) => (
                  <li key={c.chirurgien.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <i className="bi bi-person-badge text-module-strong" aria-hidden="true" />
                    <span className="font-medium">{c.chirurgien.nom}</span>
                    {c.note ? <span className="text-muted-foreground">— {c.note}</span> : null}
                    {c.a_valider ? (
                      <AValider
                        compact
                        isAdmin={isAdmin}
                        onValider={() => validerLienChirurgien(suture.id, c.chirurgien.id)}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {suture.noms.length > 0 ? (
            <section className="module-card p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Aussi écrit dans les fiches de picking
              </h2>
              <div className="flex flex-wrap gap-2">
                {suture.noms.map((n) => (
                  <span
                    key={n.id}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                    title={n.source ?? undefined}
                  >
                    « {n.nom} »
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {isAdmin ? (
            <section className="module-card space-y-3 p-5" aria-label="Gestion du fil">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Gestion (admin)
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setEditOpen(true)}>
                  <i className="bi bi-pencil" aria-hidden="true" />
                  Modifier
                </Button>
                {isRetired(suture) ? (
                  <Button
                    variant="outline"
                    disabled={statutMutation.isPending}
                    onClick={() => statutMutation.mutate(STATUT_ACTIF)}
                  >
                    <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                    Remettre en service
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setRetireOpen(true)}>
                    <i className="bi bi-archive" aria-hidden="true" />
                    Retirer du service
                  </Button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="text-xs font-semibold text-destructive underline-offset-2 hover:underline"
              >
                Supprimer définitivement
              </button>
            </section>
          ) : null}

          {suture.cours ? (
            <section className="module-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <i className="bi bi-mortarboard" aria-hidden="true" />
                Le cours
              </h2>
              <CoursRendu cours={suture.cours} famille={suture.famille} />
            </section>
          ) : null}
        </article>
      ) : null}

      {suture && isAdmin ? (
        <>
          <SutureForm
            open={editOpen}
            onOpenChange={setEditOpen}
            suture={suture}
            loading={saveMutation.isPending}
            onSubmit={(input) => saveMutation.mutate(input)}
          />
          <ConfirmDialog
            open={retireOpen}
            onOpenChange={setRetireOpen}
            title="Retirer ce fil du service ?"
            message="Le fil reste dans le référentiel, marqué « Retiré du service ». Vous pourrez le remettre en service."
            confirmLabel="Retirer du service"
            tone="warning"
            loading={statutMutation.isPending}
            onConfirm={() => statutMutation.mutate(STATUT_RETIRE)}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Supprimer définitivement ce fil ?"
            message={`Ce fil et ses ${linkCount} lien${linkCount > 1 ? "s" : ""} avec des interventions seront effacés. Action irréversible.`}
            confirmLabel="Supprimer définitivement"
            tone="danger"
            loading={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate()}
          />
        </>
      ) : null}
    </main>
  );
}
