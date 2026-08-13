import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_EMAIL = "manuel.rohaut@gmail.com";
const AVATAR_BUCKET = "avatars";
const AVATAR_URL_TTL = 60 * 60 * 24 * 365; // 1 an

const schema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  photoUrl: z.string().url().max(500).optional(),
});

function computeInitials(first: string | null, last: string | null): string {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  return `${a}${b}` || "?";
}

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
      const patch: {
        last_login_at: string;
        google_photo_url?: string;
        approval?: "approuve";
        refusal_reason?: null;
      } = { last_login_at: new Date().toISOString() };
      if (data.photoUrl && existing.google_photo_url !== data.photoUrl) {
        patch.google_photo_url = data.photoUrl;
      }
      if (isOwner && existing.approval !== "approuve") {
        patch.approval = "approuve";
        patch.refusal_reason = null;
      }
      const { data: updated } = await supabaseAdmin
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select("*")
        .single();

      if (isOwner) {
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (!(roles ?? []).some((r) => r.role === "admin")) {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
        }
      }
      return updated ?? existing;
    }

    const first = data.firstName?.trim() || email.split("@")[0] || "Utilisateur";
    const last = data.lastName?.trim() || null;

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
        initials: computeInitials(first, last),
        photo_url: data.photoUrl ?? null,
        google_photo_url: data.photoUrl ?? null,
        last_login_at: new Date().toISOString(),
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

const updateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  jobTitle: z.string().trim().max(50).nullable().optional(),
  service: z.string().trim().max(80).nullable().optional(),
});

/** Met à jour les informations publiques de son propre profil. */
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const first = data.firstName;
    const last = data.lastName;
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update({
        first_name: first,
        last_name: last,
        display_name: [first, last].filter(Boolean).join(" "),
        initials: computeInitials(first, last),
        job_title: data.jobTitle?.trim() || null,
        service: data.service?.trim() || null,
      })
      .eq("id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const avatarSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/),
  base64: z.string().min(1),
});

/** Téléverse une photo de profil (2 Mo max) et renvoie le profil mis à jour. */
export const uploadMyAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => avatarSchema.parse(data))
  .handler(async ({ data, context }) => {
    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.byteLength > 2 * 1024 * 1024) throw new Error("Photo trop lourde (2 Mo max)");

    const ext = (data.fileName.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const path = `${context.userId}/${crypto.randomUUID()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, AVATAR_URL_TTL);
    if (signError || !signed) throw new Error(signError?.message ?? "URL indisponible");

    const { data: previous } = await supabaseAdmin
      .from("profiles")
      .select("avatar_path")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_path: path, photo_url: signed.signedUrl })
      .eq("id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (previous?.avatar_path && previous.avatar_path !== path) {
      await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([previous.avatar_path]);
    }
    return row;
  });

const photoModeSchema = z.object({ mode: z.enum(["google", "none"]) });

/** Revient à la photo Google ou supprime la photo (repli sur les initiales). */
export const setMyPhotoMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => photoModeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current } = await supabaseAdmin
      .from("profiles")
      .select("avatar_path, google_photo_url")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_path: null,
        photo_url: data.mode === "google" ? (current?.google_photo_url ?? null) : null,
      })
      .eq("id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (current?.avatar_path) {
      await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([current.avatar_path]);
    }
    return row;
  });
