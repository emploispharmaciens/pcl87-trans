import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { SutureForm } from "@/components/SutureForm";
import { FamilyBadge, PlanChips } from "@/components/SutureVisuals";
import { useSutureImageUrls } from "@/hooks/useSutureImageUrls";
import { useAuth } from "@/hooks/useAuth";
import {
  FAMILY_LABELS,
  FAMILY_SHORT,
  PLANS,
  PLAN_ICONS,
  PLAN_LABELS,
  SUTURE_FAMILIES,
  createSuture,
  familyColor,
  fetchSutureImages,
  fetchSutures,
  isIncomplete,
  isRetired,
  matchesSuture,
  type SutureFamily,
  type SutureInput,
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
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string | undefined;
}) {
  const style = color
    ? active
      ? { backgroundColor: color, color: "#fff" }
      : { backgroundColor: `${color}1a`, color }
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={style}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
        color
          ? "hover:opacity-90"
          : active
            ? "bg-module-strong text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-module-text"
      }`}
    >
      {children}
    </button>
  );
}

function SutureCard({
  suture,
  photoUrl,
}: {
  suture: SutureWithUsage;
  photoUrl?: string | undefined;
}) {
  const usageCount = suture.usages.length;
  return (
    <Link
      to="/sutures/fil/$slug"
      params={{ slug: suture.slug ?? "" }}
      className="module-card block border-l-4 p-4 transition hover:shadow-md"
      style={{ borderLeftColor: familyColor(suture.famille) }}
    >
      <div className="flex items-start justify-between gap-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-md bg-muted object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold uppercase text-module-text">{suture.marque}</h3>
          <p className="text-sm text-muted-foreground">
            {suture.type_aiguille || "Aiguille [NON DÉFINI]"}
            {suture.longueur ? ` · ${suture.longueur}` : ""}
          </p>
        </div>
        {isRetired(suture) ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
            <i className="bi bi-archive" aria-hidden="true" />
            Retiré du service
          </span>
        ) : null}
        {suture.note_qualite ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold uppercase text-destructive">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            Vigilance
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
        <FamilyBadge famille={suture.famille} short />
        <PlanChips plans={suture.plans} />
        {suture.a_valider ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
            <i className="bi bi-robot" aria-hidden="true" />À valider
          </span>
        ) : null}
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
            : `${usageCount} protocole${usageCount > 1 ? "s" : ""}`}
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
  const [plans, setPlans] = useState<string[]>([]);
  const [onlyUsed, setOnlyUsed] = useState(false);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

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

  const { data: allImages = [] } = useQuery({
    queryKey: ["suture-images", "all"],
    queryFn: () => fetchSutureImages(),
  });
  const mainPhotos = useMemo(() => {
    const map = new Map<string, string>();
    for (const image of allImages) {
      if (!map.has(image.content_id)) map.set(image.content_id, image.storage_path);
    }
    return map;
  }, [allImages]);
  const { data: photoUrls } = useSutureImageUrls([...mainPhotos.values()]);

  const completude = useMemo(() => {
    const enService = (sutures ?? []).filter((s) => s.statut !== "retire");
    return {
      enService: enService.length,
      completes: enService.filter((s) => !isIncomplete(s)).length,
    };
  }, [sutures]);

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (input: SutureInput) => createSuture(input),
    onSuccess: async (slug) => {
      await queryClient.invalidateQueries({ queryKey: ["sutures"] });
      setCreateOpen(false);
      toast.success("Fil enregistré");
      await navigate({ to: "/sutures/fil/$slug", params: { slug } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    const rows = sutures ?? [];
    return rows
      .filter((s) => matchesSuture(s, search))
      .filter((s) => families.length === 0 || families.includes((s.famille ?? "") as SutureFamily))
      .filter((s) => plans.length === 0 || plans.some((p) => (s.plans ?? []).includes(p)))
      .filter((s) => !onlyUsed || s.usages.length > 0)
      .filter((s) => !onlyIncomplete || isIncomplete(s))
      .sort((a, b) => b.usages.length - a.usages.length);
  }, [sutures, search, families, plans, onlyUsed, onlyIncomplete]);

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

  function togglePlan(plan: string) {
    setPlans((prev) => (prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]));
  }

  function toggleFamily(family: SutureFamily) {
    setFamilies((prev) =>
      prev.includes(family) ? prev.filter((f) => f !== family) : [...prev, family],
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      {isAdmin ? (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Ajouter un fil
          </Button>
        </div>
      ) : null}

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
              color={familyColor(family)}
            >
              {FAMILY_SHORT[family]}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {PLANS.map((plan) => (
            <Chip key={plan} active={plans.includes(plan)} onClick={() => togglePlan(plan)}>
              <i className={`bi ${PLAN_ICONS[plan]}`} aria-hidden="true" />
              {PLAN_LABELS[plan]}
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
        {completude.enService > 0 ? (
          <>
            {" "}
            Fiches complètes : {completude.completes} sur {completude.enService} en service.
          </>
        ) : null}
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
            <h2
              className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
              style={{ color: familyColor(family) }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: familyColor(family) }}
                aria-hidden="true"
              />
              {FAMILY_LABELS[family]} · {rows.length}
            </h2>
            <div className="space-y-3">
              {rows.map((suture) => (
                <SutureCard
                  key={suture.id}
                  suture={suture}
                  photoUrl={photoUrls?.[mainPhotos.get(suture.id) ?? ""]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {isAdmin ? (
        <SutureForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          loading={createMutation.isPending}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      ) : null}
    </main>
  );
}
