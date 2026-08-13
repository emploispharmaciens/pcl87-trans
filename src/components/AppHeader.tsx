import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-module-text">
          <i className="bi bi-hospital text-lg" aria-hidden="true" />
          DB&amp;M
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Transmissions</Link>
          </Button>
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">Administration</Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Se déconnecter">
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
          </Button>
          <Link
            to="/profile"
            aria-label="Mon profil"
            title="Mon profil"
            className="rounded-full ring-offset-2 transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar
              name={profile?.display_name}
              initials={profile?.initials}
              photoUrl={profile?.photo_url}
              size={32}
            />
          </Link>
        </nav>
      </div>
    </header>
  );
}
