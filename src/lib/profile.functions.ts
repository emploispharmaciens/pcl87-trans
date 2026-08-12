import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_EMAIL = "manuel.rohaut@gmail.com";

const schema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  photoUrl: z.string().url().max(500).optional(),
});

/** Crée/complète le profil du compte connecté et renvoie sa fiche. */
export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const email = ((context.claims as { email?: string } | null)?.email ?? "").toLowerCase();
    const isOwner = email === OWNER_EMAIL;

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      let row = existing;
      if (isOwner && existing.approval !== "approuve") {
        const { data: updated } = await supabaseAdmin
          .from("profiles")
          .update({ approval: "approuve", refusal_reason: null })
          .eq("id", userId)
          .select("*")
          .single();
        if (updated) row = updated;
      }
      if (isOwner) {
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (!(roles ?? []).some((r) => r.role === "admin")) {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
        }
      }
      return row;
    }

    const first = data.firstName?.trim() || email.split("@")[0] || "Utilisateur";
    const last = data.lastName?.trim() || null;
    const initials =
      first.slice(0, 1).toUpperCase() + (last ? last.slice(0, 1).toUpperCase() : "");

    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const isFirst = (count ?? 0) === 0;

    const { data: created, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email: email || null,
        first_name: first,
        last_name: last,
        display_name: [first, last].filter(Boolean).join(" "),
        initials,
        photo_url: data.photoUrl ?? null,
        approval: isFirst || isOwner ? "approuve" : "en_attente",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: isFirst || isOwner ? "admin" : "membre" });

    return created;
  });
