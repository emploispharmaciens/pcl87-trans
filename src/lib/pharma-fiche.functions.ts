import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdmin, isApproved } from "@/lib/authz.server";
import { PHARMA_PRODUCTS, productSlug, type FicheContent } from "@/lib/pharmacy";

const slugInput = z.object({ slug: z.string().min(1).max(160) });

export type FicheRow = {
  product_slug: string;
  product_label: string;
  dci: string;
  content: FicheContent;
  model: string;
  updated_at: string;
};

/** Lit la fiche d'un produit, et la génère au premier accès si elle n'existe pas encore. */
export const getFiche = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => slugInput.parse(data))
  .handler(async ({ data, context }): Promise<FicheRow> => {
    if (!(await isApproved(context.supabase, context.userId)))
      throw new Error("Compte non approuvé.");

    const product = PHARMA_PRODUCTS.find((p) => productSlug(p.label) === data.slug);
    if (!product) throw new Error("Produit inconnu.");

    const { data: existing } = await context.supabase
      .from("pharma_fiches")
      .select("product_slug, product_label, dci, content, model, updated_at")
      .eq("product_slug", data.slug)
      .maybeSingle();
    if (existing) return existing as FicheRow;

    const { generateFicheContent, FICHE_MODEL } = await import("@/lib/pharma-fiche.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const content = await generateFicheContent(product);

    const { data: inserted, error } = await supabaseAdmin
      .from("pharma_fiches")
      .upsert(
        {
          product_slug: data.slug,
          product_label: product.label,
          dci: product.dci,
          content,
          model: FICHE_MODEL,
          generated_by: context.userId,
        },
        { onConflict: "product_slug" },
      )
      .select("product_slug, product_label, dci, content, model, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return inserted as FicheRow;
  });

/** Régénère une fiche (admin uniquement). */
export const regenerateFiche = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => slugInput.parse(data))
  .handler(async ({ data, context }): Promise<FicheRow> => {
    if (!(await isAdmin(context.supabase, context.userId)))
      throw new Error("Action réservée aux administrateurs");

    const product = PHARMA_PRODUCTS.find((p) => productSlug(p.label) === data.slug);
    if (!product) throw new Error("Produit inconnu.");

    const { generateFicheContent, FICHE_MODEL } = await import("@/lib/pharma-fiche.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const content = await generateFicheContent(product);

    const { data: row, error } = await supabaseAdmin
      .from("pharma_fiches")
      .upsert(
        {
          product_slug: data.slug,
          product_label: product.label,
          dci: product.dci,
          content,
          model: FICHE_MODEL,
          generated_by: context.userId,
        },
        { onConflict: "product_slug" },
      )
      .select("product_slug, product_label, dci, content, model, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as FicheRow;
  });

/** Liste les slugs déjà générés (pour l'écran d'avancement). */
export const listFicheSlugs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    if (!(await isApproved(context.supabase, context.userId)))
      throw new Error("Compte non approuvé.");
    const { data } = await context.supabase.from("pharma_fiches").select("product_slug");
    return (data ?? []).map((r) => r.product_slug);
  });

/** Génère par lot les fiches manquantes (admin uniquement). */
export const generateMissingFiches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ limit: z.number().int().min(1).max(10) }).parse(data))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId)))
      throw new Error("Action réservée aux administrateurs");

    const { generateFicheContent, FICHE_MODEL } = await import("@/lib/pharma-fiche.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin.from("pharma_fiches").select("product_slug");
    const done = new Set((rows ?? []).map((r) => r.product_slug));
    const todo = PHARMA_PRODUCTS.filter((p) => !done.has(productSlug(p.label))).slice(0, data.limit);

    let created = 0;
    const failed: string[] = [];
    for (const product of todo) {
      try {
        const content = await generateFicheContent(product);
        const { error } = await supabaseAdmin.from("pharma_fiches").upsert(
          {
            product_slug: productSlug(product.label),
            product_label: product.label,
            dci: product.dci,
            content,
            model: FICHE_MODEL,
            generated_by: context.userId,
          },
          { onConflict: "product_slug" },
        );
        if (error) throw new Error(error.message);
        created += 1;
      } catch (error) {
        console.error("fiche generation failed", product.label, error);
        failed.push(product.label);
      }
    }

    return {
      created,
      failed,
      remaining: PHARMA_PRODUCTS.length - done.size - created,
      total: PHARMA_PRODUCTS.length,
    };
  });
