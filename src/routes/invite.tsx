import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ModuleBanner } from "@/components/ModuleBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { redeemInvite } from "@/lib/invites.functions";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Invitation — Transmissions DB&M" },
      {
        name: "description",
        content:
          "Activez votre accès au journal de relève du bloc opératoire avec votre lien d'invitation et son mot de passe.",
      },
      { property: "og:title", content: "Invitation — Transmissions DB&M" },
      {
        property: "og:description",
        content: "Activez votre accès au module Transmissions avec le mot de passe de l'invitation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search['code'] === "string" ? (search['code'] as string) : "",
  }),
  component: InvitePage,
});

function InvitePage() {
  const { code } = Route.useSearch();
  const { loading, session, isApproved, reload } = useAuth();
  const navigate = useNavigate();
  const redeem = useServerFn(redeemInvite);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (result.error) {
      toast.error("La connexion a échoué. Réessayez.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.reload();
  };

  const submit = async () => {
    setBusy(true);
    try {
      const result = await redeem({ data: { code, password } });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      await reload();
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <ModuleBanner title="Invitation" subtitle="Activez votre accès aux transmissions." />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="module-card w-full max-w-sm p-6 text-center">
          {!code ? (
            <>
              <i className="bi bi-link-45deg text-3xl text-muted-foreground" aria-hidden="true" />
              <h1 className="mt-3 text-lg font-semibold">Lien d'invitation incomplet</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Demandez un nouveau lien à un administrateur du bloc.
              </p>
            </>
          ) : loading ? (
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          ) : !session ? (
            <>
              <i className="bi bi-person-check text-3xl text-module-strong" aria-hidden="true" />
              <h1 className="mt-3 text-lg font-semibold">Vous êtes invité</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connectez-vous d'abord avec Google, puis saisissez le mot de passe de l'invitation.
              </p>
              <Button className="mt-5 w-full" onClick={() => void signIn()} disabled={busy}>
                <i className="bi bi-google mr-2" aria-hidden="true" />
                Se connecter avec Google
              </Button>
            </>
          ) : isApproved ? (
            <>
              <i className="bi bi-check2-circle text-3xl text-module-strong" aria-hidden="true" />
              <h1 className="mt-3 text-lg font-semibold">Votre accès est actif</h1>
              <Button className="mt-5 w-full" onClick={() => void navigate({ to: "/" })}>
                Ouvrir les transmissions
              </Button>
            </>
          ) : (
            <>
              <i className="bi bi-shield-lock text-3xl text-module-strong" aria-hidden="true" />
              <h1 className="mt-3 text-lg font-semibold">Mot de passe de l'invitation</h1>
              <div className="mt-4 space-y-1 text-left">
                <Label htmlFor="invite-code-password">Mot de passe</Label>
                <Input
                  id="invite-code-password"
                  type="password"
                  autoComplete="one-time-code"
                  maxLength={100}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password) void submit();
                  }}
                />
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => void submit()}
                disabled={busy || password.length === 0}
              >
                Activer mon accès
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
