import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";

export const Route = createFileRoute("/pharmacie")({
  component: () => (
    <AuthGate>
      <PharmacyLayout />
    </AuthGate>
  ),
});

type Tab = { to: string; label: string; icon: string; exact?: boolean };

const TABS: Tab[] = [
  { to: "/pharmacie", label: "Recherche", icon: "bi-search", exact: true },
  { to: "/pharmacie/comparatif", label: "Comparatif", icon: "bi-columns-gap" },
  { to: "/pharmacie/checklist", label: "Check bloc", icon: "bi-check2-square" },
  { to: "/pharmacie/fiches", label: "Fiches", icon: "bi-file-medical" },
  { to: "/pharmacie/signalements", label: "Signaler", icon: "bi-flag" },
];

function PharmacyLayout() {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppHeader />
      <ModuleBanner
        icon="bi-capsule"
        title="Pharmacie"
        subtitle="Référentiel produits du bloc : classes, dotations par salle, comparatif et signalements."
      />

      <nav className="hidden border-b border-border bg-card sm:block" aria-label="Sections pharmacie">
        <div className="mx-auto flex max-w-4xl gap-1 px-4">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact ?? false }}
              className="flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:text-module-text data-[status=active]:border-module-strong data-[status=active]:text-module-strong"
            >
              <i className={`bi ${tab.icon}`} aria-hidden="true" />
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      <Outlet />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card sm:hidden"
        aria-label="Sections pharmacie"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.exact ?? false }}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground data-[status=active]:text-module-strong"
          >
            <i className={`bi ${tab.icon} text-lg`} aria-hidden="true" />
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
