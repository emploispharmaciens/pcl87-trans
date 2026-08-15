import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const { profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-4">
        <Link
          to="/portail"
          className="flex min-w-0 items-center gap-2 font-bold text-module-text"
          onClick={() => setOpen(false)}
        >
          <i className="bi bi-hospital shrink-0 text-lg" aria-hidden="true" />
          <span className="truncate">Des Blocs &amp; Moi</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <nav className="hidden items-center gap-1 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/portail">Portail</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/transmissions">Transmissions</Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">Administration</Link>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              aria-label="Se déconnecter"
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
              <Button variant="ghost" size="sm" className="sm:hidden" aria-label="Menu">
                <i className="bi bi-list text-xl" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-4">
              <SheetTitle className="text-module-text">Menu</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1">
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/portail" onClick={() => setOpen(false)}>
                    <i className="bi bi-grid-3x3-gap mr-2" aria-hidden="true" />
                    Portail
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/transmissions" onClick={() => setOpen(false)}>
                    <i className="bi bi-chat-left-text mr-2" aria-hidden="true" />
                    Transmissions
                  </Link>
                </Button>
                {isAdmin ? (
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/admin" onClick={() => setOpen(false)}>
                      <i className="bi bi-sliders mr-2" aria-hidden="true" />
                      Administration
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="ghost" className="justify-start">
                  <Link to="/profile" onClick={() => setOpen(false)}>
                    <i className="bi bi-person-circle mr-2" aria-hidden="true" />
                    Mon profil
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
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
