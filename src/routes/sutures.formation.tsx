import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/DataStates";
import { FAMILY_LABELS, familyColor, fetchProtocoles, fetchSutures } from "@/lib/sutures-api";
import {
  ETAPES,
  FAB_FAMILLES,
  buildQuiz,
  fetchFormationBlocs,
  realiteFamille,
  type FormationBloc,
  type Question,
} from "@/lib/sutures-formation";

export const Route = createFileRoute("/sutures/formation")({
  head: () => ({
    meta: [
      { title: "Formation — les fils de suture — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Apprendre à lire et à choisir un fil de suture, avec des exercices tirés des fils du bloc.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Formation,
});

function EtapeSection({ titre, blocs }: { titre: string; blocs: FormationBloc[] }) {
  return (
    <section className="module-card space-y-4 p-5">
      <h2 className="font-semibold uppercase text-module-text">{titre}</h2>
      {blocs.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          Contenu en cours de rédaction.
        </p>
      ) : null}
      {blocs.map((bloc) => (
        <div key={bloc.id}>
          <h3 className="mb-1.5 text-sm font-semibold">{bloc.titre}</h3>
          <ul className="space-y-1.5 text-sm">
            {bloc.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden="true" className="text-module-strong">
                  •
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Quiz({ questions, onRestart }: { questions: Question[]; onRestart: () => void }) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= questions.length;
  const question = questions[index];

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pas assez de fils en base pour créer des exercices.
      </p>
    );
  }

  if (done || !question) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-2xl font-semibold text-module-text">
          {score} / {questions.length}
        </p>
        <p className="text-sm text-muted-foreground">
          {score === questions.length
            ? "Sans faute. Tu sais lire un fil."
            : "Relis les critères et la méthode, puis recommence."}
        </p>
        <Button
          onClick={() => {
            setIndex(0);
            setChoice(null);
            setScore(0);
            onRestart();
          }}
        >
          Nouvelle série
        </Button>
      </div>
    );
  }

  const answered = choice !== null;
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Question {index + 1} sur {questions.length}
      </p>
      <p className="font-medium">{question.enonce}</p>
      <div className="grid gap-2">
        {question.options.map((option, i) => {
          const good = answered && i === question.bonne;
          const bad = answered && i === choice && i !== question.bonne;
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => {
                setChoice(i);
                if (i === question.bonne) setScore((s) => s + 1);
              }}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                good
                  ? "border-green-600 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200"
                  : bad
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:border-module-strong"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="space-y-3">
          <p className="text-sm">
            <strong>{choice === question.bonne ? "Exact." : "Pas tout à fait."}</strong>{" "}
            {question.explication}
          </p>
          <Button
            onClick={() => {
              setIndex((i) => i + 1);
              setChoice(null);
            }}
          >
            {index + 1 < questions.length ? "Question suivante" : "Voir mon score"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Formation() {
  const [seed, setSeed] = useState(0);

  const sutures = useQuery({ queryKey: ["sutures"], queryFn: fetchSutures });
  const blocs = useQuery({ queryKey: ["formation-blocs"], queryFn: fetchFormationBlocs });
  const parEtape = (etape: string) => (blocs.data ?? []).filter((b) => b.etape === etape);
  const protocoles = useQuery({
    queryKey: ["suture-protocoles"],
    queryFn: fetchProtocoles,
  });

  const questions = useMemo(
    () => (sutures.data && protocoles.data ? buildQuiz(sutures.data, protocoles.data) : []),
    // seed force une nouvelle série
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sutures.data, protocoles.data, seed],
  );

  const loading = sutures.isLoading || protocoles.isLoading || blocs.isLoading;
  const quizIndisponible = Boolean(sutures.error ?? protocoles.error);
  const rows = sutures.data ?? [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {ETAPES.slice(0, 2).map((e) => (
        <EtapeSection key={e.etape} titre={e.titre} blocs={parEtape(e.etape)} />
      ))}

      <section className="module-card space-y-4 p-5">
        <h2 className="font-semibold uppercase text-module-text">Les familles, en bref</h2>
        <p className="text-sm text-muted-foreground">
          Pour chaque famille : ce que c'est, ce que ça fait, ce que ça change. La dernière ligne
          vient des fils en service au bloc.
        </p>
        {loading ? <CardSkeleton count={2} /> : null}
        {!loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {FAB_FAMILLES.map((fiche) => {
              const reel = realiteFamille(fiche.famille, rows);
              return (
                <article
                  key={fiche.famille}
                  className="rounded-lg border border-l-4 border-border p-4 text-sm"
                  style={{ borderLeftColor: familyColor(fiche.famille) }}
                >
                  <h3 className="mb-2 font-semibold" style={{ color: familyColor(fiche.famille) }}>
                    {FAMILY_LABELS[fiche.famille]}
                  </h3>
                  <p>
                    <strong>C'est :</strong> {fiche.f}
                  </p>
                  <p>
                    <strong>Ça fait :</strong> {fiche.a}
                  </p>
                  <p>
                    <strong>Ça change :</strong> {fiche.b}
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    <strong>Au bloc :</strong> {reel.nombre} fil{reel.nombre > 1 ? "s" : ""} en
                    service
                    {reel.plusDemande ? `, le plus demandé : ${reel.plusDemande}` : ""}.
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      {ETAPES.slice(2).map((e) => (
        <EtapeSection key={e.etape} titre={e.titre} blocs={parEtape(e.etape)} />
      ))}

      <section className="module-card space-y-4 p-5">
        <div>
          <h2 className="font-semibold uppercase text-module-text">Teste-toi</h2>
          <p className="text-sm text-muted-foreground">
            Dix questions tirées des fils et des interventions du bloc.
          </p>
        </div>
        {loading ? <CardSkeleton count={1} /> : null}
        {quizIndisponible ? (
          <p role="status" className="text-sm text-muted-foreground">
            Exercices indisponibles pour le moment.
          </p>
        ) : null}
        {!loading && !quizIndisponible ? (
          <Quiz key={seed} questions={questions} onRestart={() => setSeed((s) => s + 1)} />
        ) : null}
      </section>
    </main>
  );
}
