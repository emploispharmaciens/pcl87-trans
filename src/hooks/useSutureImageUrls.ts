import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { signSutureImageUrls } from "@/lib/suture-images.functions";

/** Adresses temporaires pour un lot de photos de fils. */
export function useSutureImageUrls(paths: string[]) {
  const sign = useServerFn(signSutureImageUrls);
  const key = [...paths].sort().join("|");
  return useQuery({
    queryKey: ["suture-image-urls", key],
    enabled: paths.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: () => sign({ data: { paths } }),
  });
}
