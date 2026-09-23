import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdmin, isApproved } from "@/lib/authz.server";

import {
  IMAGE_TYPES,
  SUTURE_BUCKET as BUCKET,
  SUTURE_CONTENT_TYPE as CONTENT_TYPE,
  downloadImage,
  storeSutureImage,
} from "@/lib/suture-images.server";

const SIGNED_URL_TTL = 900; // 15 minutes

async function requireAdmin(context: { supabase: Parameters<typeof isAdmin>[0]; userId: string }) {
  const allowed = await isAdmin(context.supabase, context.userId);
  if (!allowed) throw new Error("Action réservée aux administrateurs");
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
    return storeSutureImage({
      sutureId: data.sutureId,
      bytes: new Uint8Array(Buffer.from(data.base64, "base64")),
      contentType: data.contentType,
      ext,
      source: "Photo ajoutée par un admin",
    });
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
    const image = await downloadImage(data.url);
    return storeSutureImage({ sutureId: data.sutureId, ...image, source: data.url });
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
