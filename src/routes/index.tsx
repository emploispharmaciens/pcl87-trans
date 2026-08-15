import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Des Blocs & Moi — la plateforme des équipes de bloc" },
      {
        name: "description",
        content:
          "Des Blocs & Moi rassemble transmissions, protocoles, fiches d'intervention, arsenal et formation dans une seule plateforme pensée pour les équipes de bloc opératoire.",
      },
      { property: "og:title", content: "Des Blocs & Moi — la plateforme des équipes de bloc" },
      {
        property: "og:description",
        content:
          "Une plateforme unique pour les équipes de bloc : transmissions, protocoles, arsenal, préférences chirurgien et formation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const PROMISES = [
  {
    icon: "bi-lightning-charge",
    title: "Trouver en 10 secondes",
    text: "L'information du bloc — matériel, protocole, préférence chirurgien — accessible depuis le téléphone, en salle.",
  },
  {
    icon: "bi-arrow-left-right",
    title: "Ne plus rien perdre entre deux équipes",
    text: "Les transmissions écrites remplacent le post-it et le bouche-à-oreille.",
  },
  {
    icon: "bi-mortarboard",
    title: "Intégrer plus vite les nouveaux",
    text: "Livret d'accueil, carnet de bord et modules de formation dans un seul parcours.",
  },
  {
    icon: "bi-shield-check",
    title: "Sécuriser la pratique",
    text: "Never events, installations patient, fiches de picking : les repères sont partagés, pas mémorisés.",
  },
  {
    icon: "bi-people",
    title: "Faire équipe",
    text: "Annuaire, profils DISC, boîte à idées : mieux se connaître pour mieux travailler ensemble.",
  },
  {
    icon: "bi-lock",
    title: "Réservé à l'équipe",
    text: "Accès sur invitation, validé par un administrateur du bloc. Aucune donnée patient.",
  },
];

function SignInButton({ label = "Se connecter avec Google" }: { label?: string }) {
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
    <Button size="lg" onClick={() => void signIn()} disabled={busy}>
      <i className="bi bi-google mr-2" aria-hidden="true" />
      {label}
    </Button>
  );
}

function LandingPage() {
  const { session, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
          <span className="flex min-w-0 items-center gap-2 font-bold text-module-text">
            <i className="bi bi-hospital shrink-0 text-lg" aria-hidden="true" />
            <span className="truncate">Des Blocs &amp; Moi</span>
          </span>
          {loading ? null : session ? (
            <Button asChild size="sm">
              <Link to="/portail">
                Entrer dans le portail
                <i className="bi bi-arrow-right ml-2" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <a href="#acces">Accès équipe</a>
            </Button>
          )}
        </div>
      </header>

      <section className="module-banner px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm uppercase tracking-widest opacity-75">Bloc opératoire</p>
          <h1 className="mt-2 max-w-2xl text-3xl leading-tight sm:text-5xl">
            Tout ce que l'équipe de bloc doit savoir, au même endroit.
          </h1>
          <p className="mt-4 max-w-2xl text-base opacity-85 sm:text-lg">
            Des Blocs &amp; Moi réunit les transmissions, les protocoles, l'arsenal, les préférences
            chirurgien et la formation dans une plateforme mobile-first, utilisable en salle.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {session ? (
              <Button asChild size="lg" variant="secondary">
                <Link to="/portail">Accéder aux modules</Link>
              </Button>
            ) : (
              <SignInButton />
            )}
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <a href="#modules">Voir les modules</a>
            </Button>
          </div>
        </div>
      </section>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-12" aria-label="Nos promesses">
          <h2 className="text-xl font-semibold text-module-text sm:text-2xl">
            Ce que la plateforme vous promet
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p) => (
              <article key={p.title} className="module-card p-5">
                <i className={`bi ${p.icon} text-2xl text-module-strong`} aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="modules" className="bg-module-soft px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-semibold text-module-text sm:text-2xl">
              {MODULES.length} modules pour couvrir la vie du bloc
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les modules s'ouvrent progressivement. Transmissions et Mon profil sont déjà en
              service.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((m) => (
                <div key={m.slug} className="module-card flex gap-3 p-4">
                  <i
                    className={`bi ${m.icon} mt-0.5 text-xl text-module-strong`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {m.name}
                      {m.status === "actif" ? (
                        <span className="rounded-full bg-module-strong/10 px-2 py-0.5 text-xs font-medium text-module-strong">
                          Disponible
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Bientôt
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="acces" className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-xl font-semibold text-module-text sm:text-2xl">Accès équipe</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            La plateforme est réservée aux professionnels du bloc. Connectez-vous avec votre compte
            Google : un administrateur valide votre accès, ou utilisez le lien d'invitation qui vous
            a été transmis.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {session ? (
              <Button asChild size="lg">
                <Link to="/portail">Entrer dans le portail</Link>
              </Button>
            ) : (
              <SignInButton label="Se connecter / demander un accès" />
            )}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Des Blocs &amp; Moi — plateforme interne du bloc opératoire.
      </footer>
    </div>
  );
}
