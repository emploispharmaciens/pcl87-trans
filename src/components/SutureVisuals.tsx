import {
  FAMILY_LABELS,
  FAMILY_SHORT,
  PLAN_ICONS,
  PLAN_LABELS,
  familyColor,
} from "@/lib/sutures-api";

/** Pastille de famille, dans la couleur de la famille. */
export function FamilyBadge({
  famille,
  short = false,
}: {
  famille: string | null | undefined;
  short?: boolean;
}) {
  const color = familyColor(famille);
  const label = (short ? FAMILY_SHORT : FAMILY_LABELS)[famille ?? ""] ?? "Famille non renseignée";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold uppercase"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

/** Plans de suture d'un fil. */
export function PlanChips({ plans }: { plans: string[] | null | undefined }) {
  if (!plans || plans.length === 0) return null;
  return (
    <>
      {plans.map((plan) => (
        <span
          key={plan}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground"
        >
          <i className={`bi ${PLAN_ICONS[plan] ?? "bi-dot"}`} aria-hidden="true" />
          {PLAN_LABELS[plan] ?? plan}
        </span>
      ))}
    </>
  );
}

type Ligne = { kind: "piege" | "source" | "sachet" | "bloc" | "devenir" | "texte"; text: string };

const LINE_STYLE: Record<
  Exclude<Ligne["kind"], "piege" | "source">,
  { icon: string; label: string | null }
> = {
  sachet: { icon: "bi-upc-scan", label: "Le reconnaître" },
  bloc: { icon: "bi-clipboard2-pulse", label: "Au bloc" },
  devenir: { icon: "bi-hourglass-split", label: "Dans l'organisme" },
  texte: { icon: "bi-dot", label: null },
};

/** Découpe le cours en phrases, ou en lignes s'il contient déjà des sauts de ligne. */
function decouper(cours: string): string[] {
  const text = cours.trim();
  if (text.includes("\n")) {
    return text
      .split(/\n+/)
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÀÂÉÈÊÎÔÛÇ«])/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function classer(line: string): Ligne {
  const l = line.toLowerCase();
  if (/^pi[eè]ge\s*:/.test(l))
    return { kind: "piege", text: line.replace(/^pi[eè]ge\s*:\s*/i, "") };
  if (/^source\s*:/.test(l)) return { kind: "source", text: line.replace(/^source\s*:\s*/i, "") };
  if (l.includes("sachet")) return { kind: "sachet", text: line };
  if (
    l.includes("au bloc") ||
    l.includes("il sert") ||
    l.includes("elle sert") ||
    l.includes("sert à")
  )
    return { kind: "bloc", text: line };
  if (/(résorb|reste en place|se retire|on le retire|garde sa force)/.test(l))
    return { kind: "devenir", text: line };
  return { kind: "texte", text: line };
}

/** Affiche le cours d'un fil de façon aérée : accroche, points repérés, piège, source. */
export function CoursRendu({ cours, famille }: { cours: string; famille: string | null }) {
  const lignes = decouper(cours).map(classer);
  const [accroche, ...reste] = lignes;
  const pieges = reste.filter((l) => l.kind === "piege");
  const sources = reste.filter((l) => l.kind === "source");
  const points = reste.filter((l) => l.kind !== "piege" && l.kind !== "source");
  const color = familyColor(famille);

  return (
    <div className="space-y-4">
      {accroche ? (
        <p
          className="border-l-4 pl-3 text-base font-medium leading-relaxed"
          style={{ borderColor: color }}
        >
          {accroche.text}
        </p>
      ) : null}

      {points.length > 0 ? (
        <ul className="space-y-3">
          {points.map((point) => {
            const style = LINE_STYLE[point.kind as keyof typeof LINE_STYLE] ?? LINE_STYLE.texte;
            return (
              <li key={point.text} className="flex gap-3 text-sm leading-relaxed">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}1a`, color }}
                  aria-hidden="true"
                >
                  <i className={`bi ${style.icon}`} />
                </span>
                <span>
                  {style.label ? (
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {style.label}
                    </span>
                  ) : null}
                  {point.text}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {pieges.map((piege) => (
        <div
          key={piege.text}
          className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <i className="bi bi-exclamation-triangle-fill mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide">
              Piège à éviter
            </span>
            {piege.text}
          </span>
        </div>
      ))}

      {sources.map((source) => (
        <p key={source.text} className="flex items-start gap-2 text-xs text-muted-foreground">
          <i className="bi bi-book mt-0.5" aria-hidden="true" />
          <span>Source : {source.text}</span>
        </p>
      ))}
    </div>
  );
}
