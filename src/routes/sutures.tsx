import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";

export const Route = createFileRoute("/sutures")({
  component: () => (
    <AuthGate>
      <SuturesLayout />
    </AuthGate>
  ),
});

type Tab = { to: string; label: string; icon: string; exact?: boolean };

const TABS: Tab[] = [
  { to: "/sutures", label: "Les fils", icon: "bi-bezier2", exact: true },
  { to: "/sutures/interventions", label: "Interventions", icon: "bi-clipboard2-pulse" },
];

const FORMATION_TAB: Tab = { to: "/sutures/formation", label: "Formation", icon: "bi-mortarboard" };

function SuturesLayout() {
  const tabs = [...TABS, FORMATION_TAB];

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppHeader />
      <ModuleBanner
        icon="bi-bezier2"
        title="Sutures"
        subtitle="Référentiel des fils de suture en chirurgie orthopédique : familles, caractéristiques et usage par intervention."
      />

      <nav className="hidden border-b border-border bg-card sm:block" aria-label="Sections sutures">
        <div className="mx-auto flex max-w-4xl gap-1 px-4">
          {tabs.map((tab) => (
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
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-card sm:hidden"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        aria-label="Sections sutures"
      >
        {tabs.map((tab) => (
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
