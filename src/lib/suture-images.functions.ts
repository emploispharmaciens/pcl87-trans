import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdmin, isApproved } from "@/lib/authz.server";

const BUCKET = "sutures";
const CONTENT_TYPE = "sutures";
const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_TTL = 900; // 15 minutes

const IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp|gif)$/;

async function requireAdmin(context: { supabase: Parameters<typeof isAdmin>[0]; userId: string }) {
  const allowed = await isAdmin(context.supabase, context.userId);
  if (!allowed) throw new Error("Action réservée aux administrateurs");
}

async function storeImage(sutureId: string, bytes: Uint8Array, contentType: string, ext: string) {
  if (bytes.byteLength > MAX_BYTES) throw new Error("Image trop lourde (5 Mo max)");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: suture } = await supabaseAdmin
    .from("sutures")
    .select("id")
    .eq("id", sutureId)
    .maybeSingle();
  if (!suture) throw new Error("Fil introuvable");

  const { data: existing } = await supabaseAdmin
    .from("content_images")
    .select("position")
    .eq("content_type_code", CONTENT_TYPE)
    .eq("content_id", sutureId);
  const count = existing?.length ?? 0;
  if (count >= MAX_PHOTOS) throw new Error(`${MAX_PHOTOS} photos au maximum par fil`);
  const position = Math.max(0, ...(existing ?? []).map((r) => r.position)) + 1;

  const path = `${sutureId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw new Error(`Envoi impossible : ${uploadError.message}`);

  const { data: row, error: insertError } = await supabaseAdmin
    .from("content_images")
    .insert({ content_type_code: CONTENT_TYPE, content_id: sutureId, storage_path: path, position })
    .select("id, storage_path, position")
    .single();
  if (insertError) {
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    throw new Error(`Enregistrement impossible : ${insertError.message}`);
  }
  return row;
}

/** Ajoute une photo prise ou choisie sur l'appareil. */
export const uploadSutureImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        sutureId: z.string().uuid(),
        fileName: z.string().min(1).max(200),
        contentType: z.string().regex(IMAGE_TYPES),
        base64: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const ext = (data.fileName.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    return storeImage(data.sutureId, Buffer.from(data.base64, "base64"), data.contentType, ext);
  });

/** Importe une image depuis son adresse web (https uniquement). */
export const importSutureImageFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        sutureId: z.string().uuid(),
        url: z.string().url().max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const target = new URL(data.url);
    if (target.protocol !== "https:") throw new Error("Adresse en https uniquement");

    const response = await fetch(target, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "image/*" },
    });
    if (!response.ok) throw new Error(`Image inaccessible (erreur ${response.status})`);

    const contentType = ((response.headers.get("content-type") ?? "").split(";")[0] ?? "").trim();
    if (!IMAGE_TYPES.test(contentType)) {
      throw new Error(
        "Cette adresse ne mène pas à une image. Copiez l'adresse de l'image elle-même.",
      );
    }
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > MAX_BYTES) throw new Error("Image trop lourde (5 Mo max)");

    const bytes = new Uint8Array(await response.arrayBuffer());
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    return storeImage(data.sutureId, bytes, contentType, ext);
  });

/** Supprime une photo (fichier + référence). */
export const deleteSutureImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ imageId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: image, error } = await supabaseAdmin
      .from("content_images")
      .select("id, storage_path")
      .eq("id", data.imageId)
      .eq("content_type_code", CONTENT_TYPE)
      .single();
    if (error || !image) throw new Error("Photo introuvable");

    const { error: deleteError } = await supabaseAdmin
      .from("content_images")
      .delete()
      .eq("id", image.id);
    if (deleteError) throw new Error(`Suppression impossible : ${deleteError.message}`);
    await supabaseAdmin.storage.from(BUCKET).remove([image.storage_path]);
    return { ok: true };
  });

/** Place une photo en première position (photo principale du fil). */
export const setMainSutureImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ imageId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: image } = await supabaseAdmin
      .from("content_images")
      .select("id, content_id")
      .eq("id", data.imageId)
      .eq("content_type_code", CONTENT_TYPE)
      .single();
    if (!image) throw new Error("Photo introuvable");

    const { data: siblings } = await supabaseAdmin
      .from("content_images")
      .select("id, position")
      .eq("content_type_code", CONTENT_TYPE)
      .eq("content_id", image.content_id)
      .order("position");
    const ordered = [
      image.id,
      ...(siblings ?? []).map((s) => s.id).filter((id) => id !== image.id),
    ];
    for (const [index, id] of ordered.entries()) {
      const { error } = await supabaseAdmin
        .from("content_images")
        .update({ position: index + 1 })
        .eq("id", id);
      if (error) throw new Error(`Réorganisation impossible : ${error.message}`);
    }
    return { ok: true };
  });

/** Adresses temporaires (15 min) pour afficher les photos. */
export const signSutureImageUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paths: z.array(z.string().min(1)).max(100) }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.paths.length === 0) return {} as Record<string, string>;
    const approved = await isApproved(context.supabase, context.userId);
    if (!approved) throw new Error("Accès non autorisé");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrls(data.paths, SIGNED_URL_TTL);
    if (error) throw new Error(error.message);

    const map: Record<string, string> = {};
    signed?.forEach((entry, index) => {
      const key = data.paths[index];
      if (key && entry.signedUrl) map[key] = entry.signedUrl;
    });
    return map;
  });
