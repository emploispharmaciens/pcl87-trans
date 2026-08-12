import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canEditTransmission, isApproved } from "@/lib/authz.server";

const BUCKET = "transmissions";
const SIGNED_URL_TTL = 900; // 15 minutes

const uploadSchema = z.object({
  transmissionId: z.string().uuid(),
  fileName: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/),
  base64: z.string().min(1),
  position: z.number().int().min(1).max(3),
});

const signSchema = z.object({ paths: z.array(z.string().min(1)).max(60) });

/** Téléverse une image et l'attache à une transmission (droits vérifiés côté base). */
export const uploadTransmissionImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => uploadSchema.parse(data))
  .handler(async ({ data, context }) => {
    const allowed = await canEditTransmission(
      context.supabase,
      context.userId,
      data.transmissionId,
    );
    if (!allowed) throw new Error("Action non autorisée");

    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Image trop lourde (5 Mo max)");

    const ext = (data.fileName.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const path = `${data.transmissionId}/${crypto.randomUUID()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: row, error: insertError } = await context.supabase
      .from("content_images")
      .insert({
        content_type_code: "transmissions",
        content_id: data.transmissionId,
        storage_path: path,
        position: data.position,
      })
      .select("id, storage_path, position")
      .single();
    if (insertError) throw new Error(insertError.message);

    return row;
  });

/** Renvoie des URL signées (15 min) pour les images stockées. */
export const signImageUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => signSchema.parse(data))
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

/** Supprime une image (fichier + référence). */
export const deleteTransmissionImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ imageId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: image, error } = await context.supabase
      .from("content_images")
      .select("id, storage_path, content_id")
      .eq("id", data.imageId)
      .single();
    if (error) throw new Error(error.message);

    const { error: deleteError } = await context.supabase
      .from("content_images")
      .delete()
      .eq("id", data.imageId);
    if (deleteError) throw new Error(deleteError.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from("transmissions").remove([image.storage_path]);
    return { ok: true };
  });
