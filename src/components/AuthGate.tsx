import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ModuleBanner } from "./ModuleBanner";
import { ErrorState } from "./DataStates";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";

function SignIn() {
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("La connexion a échoué. Réessayez.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.reload();
  };

  return (
    <main className="flex min-h-screen flex-col">
      <ModuleBanner
        icon="bi-hospital"
        title="Des Blocs &amp; Moi"
        subtitle="Espace réservé aux équipes du bloc opératoire."
      />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="module-card w-full max-w-sm p-6 text-center">
          <i className="bi bi-shield-lock text-3xl text-module-strong" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">Connexion requise</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez-vous pour accéder aux modules du bloc.
          </p>
          <Button className="mt-5 w-full" onClick={() => void signIn()} disabled={busy}>
            <i className="bi bi-google mr-2" aria-hidden="true" />
            Se connecter avec Google
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <a href="/">
              <i className="bi bi-arrow-left mr-2" aria-hidden="true" />
              Retour à l'accueil
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}

function PendingApproval() {
  const { profile, signOut, reload } = useAuth();
  const refused = profile?.approval === "refuse" || profile?.approval === "desactive";

  return (
    <main className="flex min-h-screen flex-col">
      <ModuleBanner title="Transmissions" subtitle="Votre accès est en cours de validation." />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="module-card w-full max-w-md p-6 text-center">
          <i
            className={`bi ${refused ? "bi-shield-exclamation" : "bi-hourglass-split"} text-3xl text-module-strong`}
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-semibold">
            {refused ? "Accès non activé" : "Votre compte a bien été créé"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {refused
              ? "Votre accès n'est pas actif. Contactez un administrateur du bloc."
              : "Un administrateur doit valider votre accès avant que vous puissiez consulter les transmissions. Vous recevrez un e-mail dès que votre accès sera activé."}
          </p>

          <div className="mt-4 rounded-lg bg-module-soft px-4 py-3 text-left text-sm">
            <p className="font-semibold text-module-text">
              {profile?.display_name ?? "Nouveau compte"}
            </p>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => void reload()}>
              <i className="bi bi-arrow-clockwise mr-2" aria-hidden="true" />
              Vérifier
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Loading() {
  return (
    <main className="min-h-screen">
      <div className="module-banner h-32 w-full" />
      <div className="mx-auto max-w-4xl space-y-3 p-4">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    </main>
  );
}

/** Affiche l'app seulement aux comptes approuvés. */
export function AuthGate({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { loading, session, profile, isApproved, isAdmin, error, reload } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <SignIn />;
  if (error && !profile) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!isApproved) return <PendingApproval />;

  if (requireAdmin && !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="module-card max-w-sm p-6 text-center">
          <i className="bi bi-lock text-3xl text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Page réservée aux administrateurs</h2>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
