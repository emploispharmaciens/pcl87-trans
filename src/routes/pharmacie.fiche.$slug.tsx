import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getFiche, regenerateFiche } from "@/lib/pharma-fiche.functions";
import { FICHE_SECTIONS, familyOf, findProductBySlug } from "@/lib/pharmacy";

export const Route = createFileRoute("/pharmacie/fiche/$slug")({
  head: () => ({
    meta: [
      { title: "Fiche produit — Pharmacie du bloc — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Fiche produit du bloc opératoire : indications, posologie, dilution, surveillance et points de vigilance.",
      },
      { property: "og:title", content: "Fiche produit — Pharmacie du bloc" },
      {
        property: "og:description",
        content: "Fiche synthétique d'un médicament ou dispositif du bloc opératoire.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FichePage,
});

function FichePage() {
  const { slug } = useParams({ from: "/pharmacie/fiche/$slug" });
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const product = findProductBySlug(slug);

  const fetchFiche = useServerFn(getFiche);
  const regenerate = useServerFn(regenerateFiche);

  const ficheQuery = useQuery({
    queryKey: ["pharma-fiche", slug],
    queryFn: () => fetchFiche({ data: { slug } }),
    enabled: Boolean(product),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerate({ data: { slug } }),
    onSuccess: (row) => {
      queryClient.setQueryData(["pharma-fiche", slug], row);
      toast.success("Fiche régénérée.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-muted-foreground">Produit introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/pharmacie">Retour à la recherche</Link>
        </Button>
      </main>
    );
  }

  const content = ficheQuery.data?.content;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link
        to="/pharmacie"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-module-strong"
      >
        <i className="bi bi-arrow-left" aria-hidden="true" />
        Recherche
      </Link>

      <header className="module-panel mt-3 p-4">
        <h1 className="text-lg font-bold uppercase text-module-text">{product.label}</h1>
        <p className="text-sm uppercase text-muted-foreground">{product.dci}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-module-strong/10 px-2 py-0.5 uppercase text-module-strong">
            {product.classe}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 uppercase text-muted-foreground">
            {familyOf(product)}
          </span>
          {product.risque ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 uppercase text-destructive">
              Médicament à risque
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            ORTHO · {product.ortho ?? "—"}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            SSPI · {product.sspi ?? "—"}
          </span>
        </div>
      </header>

      {ficheQuery.isPending ? (
        <div className="module-card mt-4 flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" />
          Génération de la fiche en cours…
        </div>
      ) : null}

      {ficheQuery.isError ? (
        <div className="module-card mt-4 space-y-3 p-6">
          <p className="text-sm text-destructive">{(ficheQuery.error as Error).message}</p>
          <Button type="button" variant="outline" onClick={() => ficheQuery.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {content ? (
        <div className="mt-4 space-y-4">
          <p className="module-card p-4 text-sm leading-relaxed text-module-text">{content.resume}</p>

          {FICHE_SECTIONS.map((section) => {
            const items = content[section.key] ?? [];
            if (items.length === 0) return null;
            return (
              <section key={section.key} className="module-card p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-module-strong">
                  <i className={`bi ${section.icon}`} aria-hidden="true" />
                  {section.label}
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-module-text">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          })}

          <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
            <span>
              Fiche générée par IA ({ficheQuery.data?.model}) — à vérifier avant usage clinique.
            </span>
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={regenerateMutation.isPending}
                onClick={() => regenerateMutation.mutate()}
              >
                <i className="bi bi-arrow-repeat mr-2" aria-hidden="true" />
                {regenerateMutation.isPending ? "Régénération…" : "Régénérer"}
              </Button>
            ) : null}
          </footer>
        </div>
      ) : null}
    </main>
  );
}
