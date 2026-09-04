import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { MODULES } from "@/lib/modules";

type NavItem = { to: string; label: string; icon: string };

const MODULE_LINKS: NavItem[] = MODULES.filter(
  (m) => m.status === "actif" && !!m.path && m.path !== "/profile",
).map((m) => ({ to: m.path!, label: m.name, icon: m.icon }));

const NAV: NavItem[] = [
  { to: "/portail", label: "Portail", icon: "bi-grid-3x3-gap" },
  ...MODULE_LINKS,
];

export function AppHeader() {
  const { profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = isAdmin ? [...NAV, { to: "/admin", label: "Administration", icon: "bi-sliders" }] : NAV;
  const showBack = pathname !== "/portail";

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {showBack ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="shrink-0 px-2"
              aria-label="Retour au portail"
              title="Retour au portail"
            >
              <Link to="/portail" onClick={() => setOpen(false)}>
                <i className="bi bi-arrow-left" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          <Link
            to="/portail"
            className="flex min-w-0 items-center gap-2 font-bold text-module-text"
            onClick={() => setOpen(false)}
          >
            <i className="bi bi-hospital shrink-0 text-lg" aria-hidden="true" />
            <span className="truncate">Des Blocs &amp; Moi</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {items.map((item) => (
              <Button
                key={item.to}
                asChild
                variant="ghost"
                size="sm"
                className="data-[status=active]:bg-module-soft data-[status=active]:text-module-strong"
              >
                <Link
                  to={item.to}
                  activeProps={{ "data-status": "active", className: "font-semibold" }}
                >
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
            </Button>
          </nav>

          <Link
            to="/profile"
            aria-label="Mon profil"
            title="Mon profil"
            className="shrink-0 rounded-full ring-offset-2 transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar
              name={profile?.display_name}
              initials={profile?.initials}
              photoUrl={profile?.photo_url}
              size={32}
            />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden" aria-label="Menu">
                <i className="bi bi-list text-xl" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-4">
              <SheetTitle className="text-module-text">Menu</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1" aria-label="Navigation">
                {items.map((item) => (
                  <Button
                    key={item.to}
                    asChild
                    variant="ghost"
                    className="justify-start data-[status=active]:bg-module-soft data-[status=active]:text-module-strong"
                  >
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      activeProps={{ "data-status": "active", className: "font-semibold" }}
                    >
                      <i className={`bi ${item.icon} mr-2`} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/profile" onClick={() => setOpen(false)}>
                    <i className="bi bi-person-circle mr-2" aria-hidden="true" />
                    Mon profil
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="mt-2 justify-start"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  <i className="bi bi-box-arrow-right mr-2" aria-hidden="true" />
                  Se déconnecter
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
