import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { SUTURE_DISCLAIMER } from "@/lib/sutures-api";

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

function SuturesLayout() {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppHeader />
      <ModuleBanner
        icon="bi-bezier2"
        title="Sutures"
        subtitle="Référentiel des fils de suture en chirurgie orthopédique : familles, caractéristiques et usage par intervention."
      />

      <div className="border-b border-border bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="mx-auto flex max-w-4xl items-start gap-2">
          <i className="bi bi-exclamation-triangle mt-0.5 shrink-0" aria-hidden="true" />
          <span>{SUTURE_DISCLAIMER}</span>
        </p>
      </div>

      <nav className="hidden border-b border-border bg-card sm:block" aria-label="Sections sutures">
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
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-card sm:hidden"
        aria-label="Sections sutures"
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
