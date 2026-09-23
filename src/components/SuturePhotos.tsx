import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSutureImageUrls } from "@/hooks/useSutureImageUrls";
import { resizeImageToBase64 } from "@/lib/image-resize";
import {
  deleteSutureImage,
  importSutureImageFromUrl,
  setMainSutureImage,
  uploadSutureImage,
} from "@/lib/suture-images.functions";
import {
  fetchSutureImages,
  webImageSearchUrl,
  type Suture,
  type SutureImage,
} from "@/lib/sutures-api";

const MAX_PHOTOS = 6;

type Props = { suture: Suture; isAdmin: boolean };

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function SuturePhotos({ suture, isAdmin }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<SutureImage | null>(null);

  const upload = useServerFn(uploadSutureImage);
  const importFromUrl = useServerFn(importSutureImageFromUrl);
  const remove = useServerFn(deleteSutureImage);
  const setMain = useServerFn(setMainSutureImage);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["suture-images", suture.id],
    queryFn: () => fetchSutureImages(suture.id),
    retry: false,
  });
  const { data: urls } = useSutureImageUrls(images.map((i) => i.storage_path));

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["suture-images"] }),
      queryClient.invalidateQueries({ queryKey: ["suture-image-urls"] }),
    ]);

  const onError = (err: Error) => toast.error(err.message);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const prepared = await resizeImageToBase64(file);
        await upload({ data: { sutureId: suture.id, ...prepared } });
      }
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Photo ajoutée");
    },
    onError,
  });

  const urlMutation = useMutation({
    mutationFn: () => importFromUrl({ data: { sutureId: suture.id, url: url.trim() } }),
    onSuccess: async () => {
      setUrl("");
      await refresh();
      toast.success("Photo ajoutée");
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => remove({ data: { imageId } }),
    onSuccess: async () => {
      setToDelete(null);
      await refresh();
      toast.success("Photo supprimée");
    },
    onError,
  });

  const mainMutation = useMutation({
    mutationFn: (imageId: string) => setMain({ data: { imageId } }),
    onSuccess: async () => {
      await refresh();
      toast.success("Photo principale changée");
    },
    onError,
  });

  const full = images.length >= MAX_PHOTOS;
  const busy = uploadMutation.isPending || urlMutation.isPending;

  if (!isAdmin && images.length === 0 && !isLoading) return null;

  return (
    <section className="module-card space-y-4 p-5" aria-label="Photos du fil">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Photos · {images.length}
      </h2>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const src = urls?.[image.storage_path];
            return (
              <figure key={image.id} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => src && setZoom(src)}
                  className="relative block aspect-square w-full overflow-hidden rounded-lg bg-muted"
                  aria-label="Agrandir la photo"
                >
                  {src ? (
                    <img
                      src={src}
                      alt={`${suture.marque ?? "Fil"} — photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="block h-full w-full animate-pulse bg-muted" />
                  )}
                  {index === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-module-strong px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                      Principale
                    </span>
                  ) : null}
                </button>
                {image.source?.startsWith("http") ? (
                  <a
                    href={image.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-[11px] text-muted-foreground hover:underline"
                  >
                    Source : {hostname(image.source)}
                  </a>
                ) : image.source && image.source !== "Photo ajoutée par un admin" ? (
                  <p className="truncate text-[11px] text-muted-foreground">
                    Source : {image.source}
                  </p>
                ) : null}
                {isAdmin ? (
                  <figcaption className="flex flex-wrap gap-2 text-xs">
                    {index > 0 ? (
                      <button
                        type="button"
                        className="font-semibold text-module-strong hover:underline"
                        disabled={mainMutation.isPending}
                        onClick={() => mainMutation.mutate(image.id)}
                      >
                        Mettre en principale
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="font-semibold text-destructive hover:underline"
                      onClick={() => setToDelete(image)}
                    >
                      Supprimer
                    </button>
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune photo pour ce fil.</p>
      )}

      {isAdmin ? (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - images.length);
                e.target.value = "";
                if (files.length > 0) uploadMutation.mutate(files);
              }}
            />
            <Button disabled={full || busy} onClick={() => fileRef.current?.click()}>
              <i className="bi bi-camera" aria-hidden="true" />
              {uploadMutation.isPending ? "Envoi…" : "Prendre ou choisir une photo"}
            </Button>
            <Button variant="outline" asChild>
              <a href={webImageSearchUrl(suture)} target="_blank" rel="noopener noreferrer">
                <i className="bi bi-search" aria-hidden="true" />
                Chercher sur le web
              </a>
            </Button>
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) urlMutation.mutate();
            }}
          >
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Coller l'adresse d'une image (clic droit → Copier l'adresse de l'image)"
              aria-label="Adresse web d'une image"
              disabled={full || busy}
            />
            <Button type="submit" variant="outline" disabled={full || busy || !url.trim()}>
              {urlMutation.isPending ? "Import…" : "Importer"}
            </Button>
          </form>
        </div>
      ) : null}

      <Dialog open={zoom !== null} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-3xl rounded-2xl p-2">
          <DialogTitle className="sr-only">Photo en grand</DialogTitle>
          {zoom ? <img src={zoom} alt="" className="max-h-[80vh] w-full object-contain" /> : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Supprimer cette photo ?"
        message="La photo sera effacée définitivement."
        confirmLabel="Supprimer"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </section>
  );
}
