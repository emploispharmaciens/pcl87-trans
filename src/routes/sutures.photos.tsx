import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { useSutureImageUrls } from "@/hooks/useSutureImageUrls";
import { resizeImageToBase64 } from "@/lib/image-resize";
import { uploadSutureImage } from "@/lib/suture-images.functions";
import {
  FAMILY_SHORT,
  fetchSutureImages,
  fetchSutures,
  type SutureWithUsage,
} from "@/lib/sutures-api";

export const Route = createFileRoute("/sutures/photos")({
  validateSearch: (search: Record<string, unknown>) => ({
    fil: typeof search["fil"] === "string" ? (search["fil"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Photos des boîtes — Sutures" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate requireAdmin>
      <SuturesPhotos />
    </AuthGate>
  ),
});

type Shot = { base64: string; contentType: string; fileName: string; preview: string };

function SuturesPhotos() {
  const { fil } = Route.useSearch();
  const queryClient = useQueryClient();
  const upload = useServerFn(uploadSutureImage);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const suturesQuery = useQuery({ queryKey: ["sutures"], queryFn: fetchSutures });
  const imagesQuery = useQuery({
    queryKey: ["suture-images-all"],
    queryFn: () => fetchSutureImages(),
    retry: false,
  });

  const [idx, setIdx] = useState(0);
  const [retake, setRetake] = useState<SutureWithUsage | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [sending, setSending] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  const sutures = suturesQuery.data ?? [];
  const images = imagesQuery.data ?? [];

  // Fiches ayant déjà au moins une photo (+ celles envoyées dans cette session).
  const illustratedIds = useMemo(() => {
    const set = new Set(images.map((i) => i.content_id));
    doneIds.forEach((id) => set.add(id));
    return set;
  }, [images, doneIds]);

  // Première photo de chaque fiche, pour les vignettes.
  const mainPathBySuture = useMemo(() => {
    const map = new Map<string, string>();
    for (const image of images) {
      if (!map.has(image.content_id)) map.set(image.content_id, image.storage_path);
    }
    return map;
  }, [images]);

  const { data: signedUrls } = useSutureImageUrls(
    useMemo(() => [...mainPathBySuture.values()], [mainPathBySuture]),
  );

  // File d'attente : fiches sans photo, les plus utilisées d'abord.
  const queue = useMemo(() => {
    const missing = sutures.filter((s) => s.slug && !illustratedIds.has(s.id));
    missing.sort(
      (a, b) =>
        b.usages.length - a.usages.length ||
        (a.marque ?? "").localeCompare(b.marque ?? "", "fr"),
    );
    // Si on arrive depuis une fiche (?fil=...), ce fil passe en premier.
    if (fil) {
      const pos = missing.findIndex((s) => s.slug === fil);
      if (pos > 0) {
        const [item] = missing.splice(pos, 1);
        if (item) missing.unshift(item);
      }
    }
    return missing;
  }, [sutures, illustratedIds, fil]);

  const illustrated = useMemo(
    () => sutures.filter((s) => s.slug && illustratedIds.has(s.id)),
    [sutures, illustratedIds],
  );

  const total = queue.length + illustrated.length;
  // Index réellement affiché : il se resynchronise quand la file se raccourcit.
  const currentIdx = Math.min(idx, Math.max(queue.length - 1, 0));
  const target: SutureWithUsage | null = retake ?? queue[currentIdx] ?? null;
  const upcoming = useMemo(() => queue.slice(currentIdx + 1), [queue, currentIdx]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFeedback(null);
    try {
      const prepared = await resizeImageToBase64(file);
      setShot({
        ...prepared,
        preview: `data:${prepared.contentType};base64,${prepared.base64}`,
      });
    } catch (e) {
      setFeedback((e as Error).message);
    }
  };

  const send = async () => {
    if (!shot || !target) return;
    setSending(true);
    setFeedback(null);
    try {
      await upload({
        data: {
          sutureId: target.id,
          fileName: shot.fileName,
          contentType: shot.contentType,
          base64: shot.base64,
        },
      });
      setDoneIds((prev) => new Set(prev).add(target.id));
      setShot(null);
      setRetake(null);
      setFeedback(`✅ ${target.marque} : photo enregistrée.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suture-images-all"] }),
        queryClient.invalidateQueries({ queryKey: ["suture-images"] }),
        queryClient.invalidateQueries({ queryKey: ["sutures"] }),
      ]);
    } catch (e) {
      const message = (e as Error).message;
      setFeedback(
        /autoris|admin/i.test(message)
          ? "L'envoi de photos est réservé aux comptes administrateurs de l'app."
          : `Échec de l'envoi : ${message}. Réessaie.`,
      );
    } finally {
      setSending(false);
    }
  };

  const isLoading = suturesQuery.isLoading || imagesQuery.isLoading;
  const isError = suturesQuery.isError || imagesQuery.isError;
  const error = (suturesQuery.error ?? imagesQuery.error) as Error | null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-module-text">Photos des boîtes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mets-toi devant l'armoire. L'app te montre un fil à la fois, du plus utilisé au
          moins utilisé. Photographie la <strong>face de la boîte</strong>, référence bien
          lisible.
        </p>
        <p className="mt-3 text-sm font-semibold text-module-strong">
          {illustrated.length} sur {total} fiches illustrées
        </p>
      </header>

      <div className="mt-4">
        {isLoading ? <CardSkeleton count={2} /> : null}
        {isError ? (
          <ErrorState
            message={error?.message ?? "Impossible de charger les données."}
            onRetry={() => {
              void suturesQuery.refetch();
              void imagesQuery.refetch();
            }}
          />
        ) : null}
      </div>

      {feedback ? (
        <p
          className={`mt-4 rounded-md p-3 text-sm ${
            feedback.startsWith("✅")
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback}
        </p>
      ) : null}

      {!isLoading && !isError && !target ? (
        <div className="mt-6">
          <EmptyState
            icon="bi-check2-circle"
            title="Toutes les fiches ont une photo"
            hint="Tu peux en ajouter une meilleure depuis la liste ci-dessous si besoin."
          />
        </div>
      ) : null}

      {target ? (
        <section className="module-card mt-6 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {retake
              ? "Ajouter une photo"
              : `À photographier · ${currentIdx + 1} / ${queue.length}`}
          </p>
          <h2 className="mt-1 text-2xl font-semibold uppercase text-module-text">
            {target.marque}
          </h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Référence</dt>
              <dd className="font-semibold">{target.reference ?? "[NON DÉFINI]"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Calibre</dt>
              <dd>{target.calibre ?? "[NON DÉFINI]"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Aiguille</dt>
              <dd>{target.type_aiguille ?? "[NON DÉFINI]"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Famille</dt>
              <dd>{FAMILY_SHORT[target.famille ?? ""] ?? target.famille ?? "—"}</dd>
            </div>
          </dl>

          {shot ? (
            <div className="mt-4">
              <img
                src={shot.preview}
                alt={`Aperçu de la boîte ${target.marque}`}
                className="w-full rounded-md border border-border"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShot(null)}
                  disabled={sending}
                  className="min-h-12 rounded-md border border-border text-sm font-semibold text-muted-foreground disabled:opacity-50"
                >
                  Reprendre
                </button>
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={sending}
                  className="min-h-12 rounded-md bg-module-strong text-sm font-semibold text-white disabled:opacity-50"
                >
                  {sending ? "Envoi en cours…" : "Envoyer"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => cameraInput.current?.click()}
                className="flex min-h-14 items-center justify-center gap-2 rounded-md bg-module-strong text-base font-semibold text-white"
              >
                <i className="bi bi-camera-fill text-xl" aria-hidden="true" />
                Prendre la photo
              </button>
              <button
                type="button"
                onClick={() => galleryInput.current?.click()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold text-muted-foreground"
              >
                <i className="bi bi-images" aria-hidden="true" />
                Choisir depuis la galerie
              </button>
              {!retake && upcoming.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIdx(Math.min(currentIdx + 1, queue.length - 1))}
                  className="mt-1 text-sm font-semibold text-module-strong"
                >
                  Passer ce fil pour l'instant →
                </button>
              ) : null}
              {retake ? (
                <button
                  type="button"
                  onClick={() => setRetake(null)}
                  className="mt-1 text-sm font-semibold text-muted-foreground"
                >
                  Annuler
                </button>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {upcoming.length > 0 && !retake ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ensuite · {upcoming.length}
          </h2>
          <ul className="mt-2 divide-y divide-border rounded-md border border-border">
            {upcoming.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setIdx(currentIdx + 1 + i)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm"
                >
                  <span className="font-medium uppercase">{s.marque}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.reference ?? "sans réf"} · {s.usages.length} protocole
                    {s.usages.length > 1 ? "s" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {illustrated.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Déjà illustrées · {illustrated.length}
          </h2>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {illustrated.map((s) => {
              const path = mainPathBySuture.get(s.id);
              const src = path ? signedUrls?.[path] : undefined;
              return (
                <li key={s.id} className="rounded-md border border-border p-2">
                  {src ? (
                    <img
                      src={src}
                      alt={`Boîte ${s.marque}`}
                      loading="lazy"
                      className="h-24 w-full rounded-sm object-contain"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-sm bg-emerald-50 text-2xl text-emerald-600 dark:bg-emerald-950/40">
                      <i className="bi bi-check2" aria-hidden="true" />
                    </div>
                  )}
                  <p className="mt-1 truncate text-xs font-semibold uppercase">{s.marque}</p>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <Link
                      to="/sutures/fil/$slug"
                      params={{ slug: s.slug as string }}
                      className="text-xs text-module-strong"
                    >
                      Fiche
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setRetake(s);
                        setShot(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      Ajouter
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </main>
  );
}
