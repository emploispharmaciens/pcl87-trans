import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { useAuth } from "@/hooks/useAuth";
import { MODULES, MODULE_FAMILIES, type ModuleDef } from "@/lib/modules";

export const Route = createFileRoute("/portail")({
  head: () => ({
    meta: [
      { title: "Portail des modules — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Accédez à tous les modules du bloc : transmissions, protocoles, arsenal, formation, carnet de bord et profil.",
      },
      { property: "og:title", content: "Portail des modules — Des Blocs & Moi" },
      {
        property: "og:description",
        content: "Le point d'entrée unique vers les modules du bloc opératoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <PortalHub />
    </AuthGate>
  ),
});

function ModuleTile({ module }: { module: ModuleDef }) {
  const isActive = module.status === "actif" && !!module.path;

  const body = (
    <span className="flex items-start gap-3">
      <i
        className={`bi ${module.icon} mt-0.5 text-xl ${isActive ? "text-module-strong" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span
          className={`flex flex-wrap items-center gap-2 font-semibold ${isActive ? "text-module-text" : "text-muted-foreground"}`}
        >
          {module.name}
          {isActive ? null : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Bientôt
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{module.description}</span>
      </span>
    </span>
  );

  if (isActive) {
    return (
      <Link
        to={module.path!}
        className="module-card block p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      className="module-card block cursor-not-allowed bg-muted/40 p-4 text-left opacity-60 grayscale"
      aria-disabled="true"
      title={`${module.name} — bientôt disponible`}
    >
      {body}
    </div>
  );
}


function PortalHub() {
  const { profile, isAdmin } = useAuth();

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ModuleBanner
        icon="bi-grid-3x3-gap"
        title="Portail"
        subtitle={`Bonjour ${profile?.display_name ?? "et bienvenue"} — choisissez un module.`}
      />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {MODULE_FAMILIES.map((family) => {
          const items = MODULES.filter((m) => m.family === family);
          if (items.length === 0) return null;
          return (
            <section key={family} className="mb-8" aria-label={family}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {family}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <ModuleTile key={m.slug} module={m} />
                ))}
              </div>
            </section>
          );
        })}

        {isAdmin ? (
          <section aria-label="Administration">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Administration
            </h2>
            <Link
              to="/admin"
              className="module-card flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <i className="bi bi-sliders mt-0.5 text-xl text-module-strong" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-module-text">Administration</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Comptes, invitations, modération et statistiques.
                </span>
              </span>
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  );
}
