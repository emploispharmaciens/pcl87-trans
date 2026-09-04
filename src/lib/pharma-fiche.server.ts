import { z } from "zod";
import type { PharmaProduct } from "@/lib/pharmacy";

/** Structure d'une fiche médicament générée par l'IA. */
export const ficheSchema = z.object({
  resume: z.string().max(600),
  indications: z.array(z.string().max(300)).max(8),
  posologie: z.array(z.string().max(300)).max(8),
  dilution: z.array(z.string().max(300)).max(8),
  contre_indications: z.array(z.string().max(300)).max(8),
  effets_indesirables: z.array(z.string().max(300)).max(8),
  surveillance: z.array(z.string().max(300)).max(8),
  antidote: z.array(z.string().max(300)).max(6),
  vigilance_bloc: z.array(z.string().max(300)).max(8),
  conservation: z.array(z.string().max(300)).max(6),
});

export type FicheContent = z.infer<typeof ficheSchema>;

/** Erreur de la passerelle IA, porteuse du statut HTTP pour le circuit breaker. */
export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AiGatewayError";
    this.status = status;
  }
}

export const FICHE_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Tu es pharmacien hospitalier français, référent bloc opératoire.
Tu rédiges des fiches produit synthétiques destinées aux IADE, IBODE et anesthésistes.
Règles :
- français professionnel, phrases courtes, style télégraphique (puces).
- aucune donnée patient, aucune posologie fantaisiste : reste sur les données de référence usuelles en France (RCP/ANSM).
- si une rubrique ne s'applique pas (dispositif médical, antiseptique, soluté), écris une puce explicite du type "Non applicable (dispositif médical)".
- pas de markdown, pas de titres, uniquement le JSON demandé.`;

function userPrompt(product: PharmaProduct): string {
  return `Rédige la fiche du produit suivant du bloc opératoire :
- Libellé : ${product.label}
- DCI : ${product.dci}
- Classe : ${product.classe}
- Unité de délivrance : ${product.unite}
- Médicament à risque : ${product.risque ? "oui" : "non"}
- Dotation salle ORTHO : ${product.ortho ?? "non doté"}
- Dotation SSPI : ${product.sspi ?? "non doté"}

Renvoie un objet JSON avec exactement ces clés : resume (string), indications, posologie, dilution, contre_indications, effets_indesirables, surveillance, antidote, vigilance_bloc, conservation (chacune un tableau de 2 à 6 chaînes courtes).`;
}

/** Appelle la passerelle IA et renvoie une fiche validée. */
export async function generateFicheContent(product: PharmaProduct): Promise<FicheContent> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Générateur IA indisponible (clé manquante).");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FICHE_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(product) },
      ],
    }),
  });

  if (response.status === 429)
    throw new AiGatewayError(429, "Trop de générations en cours, réessayez dans une minute.");
  if (response.status === 402)
    throw new AiGatewayError(402, "Crédits IA épuisés : rechargez l'espace de travail Lovable.");
  if (response.status === 403)
    throw new AiGatewayError(403, "IA bloquée pour cet espace de travail (limite ou clé).");
  if (!response.ok) {
    console.error("AI gateway error", response.status, await response.text());
    throw new AiGatewayError(response.status, "La génération de la fiche a échoué.");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Réponse IA vide.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse IA illisible.");
  }
  return ficheSchema.parse(parsed);
}
