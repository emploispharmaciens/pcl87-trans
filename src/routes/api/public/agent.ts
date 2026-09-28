import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

/**
 * Point d'entrée des agents (Letta).
 * Requête : POST, en-tête « x-agent-key », corps JSON { "action": "...", "params": { ... } }.
 */
export const Route = createFileRoute("/api/public/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authentifierAgent, executerAction } = await import("@/lib/agent.server");

        const agent = await authentifierAgent(request.headers.get("x-agent-key") ?? "");
        if (!agent)
          return Response.json({ erreur: "Clé d'agent absente ou refusée" }, { status: 401 });

        let body: { action?: unknown; params?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ erreur: "Corps JSON illisible" }, { status: 400 });
        }
        if (typeof body.action !== "string") {
          return Response.json({ erreur: "Champ « action » manquant" }, { status: 400 });
        }

        try {
          const resultat = await executerAction(agent, body.action, body.params);
          return Response.json({ ok: true, resultat });
        } catch (error) {
          const message =
            error instanceof ZodError
              ? `Paramètres invalides : ${error.issues.map((i) => `${i.path.join(".") || "params"} — ${i.message}`).join(" ; ")}`
              : error instanceof Error
                ? error.message
                : "Erreur inconnue";
          return Response.json({ ok: false, erreur: message }, { status: 400 });
        }
      },
    },
  },
});
