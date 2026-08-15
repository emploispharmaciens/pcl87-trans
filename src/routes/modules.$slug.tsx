import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { Button } from "@/components/ui/button";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/modules/$slug")({
  loader: ({ params }) => {
    const module = getModule(params.slug);
    if (!module) throw notFound();
    return { module };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Module introuvable — Des Blocs & Moi" }, { name: "robots", content: "noindex" }],
      };
    }
    const { module } = loaderData;
    return {
      meta: [
        { title: `${module.name} — Des Blocs & Moi` },
        { name: "description", content: module.description },
        { property: "og:title", content: `${module.name} — Des Blocs & Moi` },
        { property: "og:description", content: module.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ModuleRoute,
  errorComponent: ModuleMissing,
  notFoundComponent: ModuleMissing,
});

function ModuleMissing() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="module-card max-w-sm p-6 text-center">
        <i className="bi bi-question-circle text-3xl text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-3 font-semibold">Module introuvable</h1>
        <Button asChild className="mt-4">
          <Link to="/portail">Retour au portail</Link>
        </Button>
      </div>
    </main>
  );
}

function ModuleRoute() {
  const { module } = Route.useLoaderData();

  return (
    <AuthGate>
      <div className="min-h-screen">
        <AppHeader />
        <ModuleBanner icon={module.icon} title={module.name} subtitle={module.description} />

        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="module-card p-6 text-center">
            <i className="bi bi-cone-striped text-3xl text-module-strong" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-module-text">Module en préparation</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Ce module fait partie de la feuille de route Des Blocs &amp; Moi. Sa structure est
              posée&nbsp;: contenus, droits et écrans arrivent prochainement.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link to="/portail">
                  <i className="bi bi-grid-3x3-gap mr-2" aria-hidden="true" />
                  Retour au portail
                </Link>
              </Button>
              <Button asChild>
                <Link to="/transmissions">Aller aux transmissions</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
