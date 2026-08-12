import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { signImageUrls } from "@/lib/images.functions";
import type { ContentImage } from "@/lib/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** URL signées (15 min) pour un lot d'images. */
export function useSignedUrls(paths: string[]) {
  const sign = useServerFn(signImageUrls);
  const key = [...paths].sort().join("|");
  return useQuery({
    queryKey: ["signed-urls", key],
    enabled: paths.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: () => sign({ data: { paths } }),
  });
}

export function ImagesGrid({ images }: { images: ContentImage[] }) {
  const [zoom, setZoom] = useState<string | null>(null);
  const { data: urls, isLoading } = useSignedUrls(images.map((i) => i.storage_path));

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image) => {
          const url = urls?.[image.storage_path];
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => url && setZoom(url)}
              className="aspect-video overflow-hidden rounded-lg bg-muted"
              aria-label="Agrandir l'image"
            >
              {isLoading || !url ? (
                <span className="block h-full w-full animate-pulse bg-muted" />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={zoom !== null} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-3xl rounded-2xl p-2">
          <DialogTitle className="sr-only">Image en grand</DialogTitle>
          {zoom ? <img src={zoom} alt="" className="max-h-[80vh] w-full object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
