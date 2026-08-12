import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateInviteCode,
  hashInvitePassword,
  invitePasswordMatches,
} from "@/lib/invites.server";

const createSchema = z.object({
  label: z.string().trim().max(120).optional(),
  password: z.string().min(6).max(100),
  role: z.enum(["membre", "moderateur", "admin"]).default("membre"),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  maxUses: z.number().int().min(1).max(500).optional(),
});

/** Crée un lien d'invitation protégé par mot de passe (admin uniquement). */
export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Action réservée aux administrateurs");

    const code = generateInviteCode();
    const { error } = await context.supabase.from("invites").insert({
      code,
      password_hash: hashInvitePassword(code, data.password),
      label: data.label ?? null,
      grant_role: data.role,
      max_uses: data.maxUses ?? null,
      expires_at: data.expiresInDays
        ? new Date(Date.now() + data.expiresInDays * 86400000).toISOString()
        : null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);

    return { code };
  });

/** Utilise un lien d'invitation : approuve le compte connecté si le mot de passe est bon. */
export const redeemInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ code: z.string().min(4).max(64), password: z.string().min(1).max(100) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite } = await supabaseAdmin
      .from("invites")
      .select("id, code, password_hash, grant_role, expires_at, max_uses, uses, is_active")
      .eq("code", data.code)
      .maybeSingle();

    const invalid = { ok: false as const, message: "Lien ou mot de passe invalide." };
    if (!invite || !invite.is_active) return invalid;
    if (invite.expires_at && new Date(invite.expires_at) < new Date())
      return { ok: false as const, message: "Ce lien d'invitation a expiré." };
    if (invite.max_uses !== null && invite.uses >= invite.max_uses)
      return { ok: false as const, message: "Ce lien d'invitation n'est plus disponible." };
    if (!invitePasswordMatches(invite.code, data.password, invite.password_hash)) return invalid;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, approval")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: false as const, message: "Profil introuvable, reconnectez-vous." };

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ approval: "approuve", refusal_reason: null })
      .eq("id", context.userId);
    if (updateError) throw new Error(updateError.message);

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (existingRoles ?? []).map((r) => r.role as string);
    if (!roles.includes(invite.grant_role)) {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: invite.grant_role });
    }

    await supabaseAdmin
      .from("invites")
      .update({ uses: invite.uses + 1 })
      .eq("id", invite.id);

    return { ok: true as const, message: "Votre accès est activé." };
  });
