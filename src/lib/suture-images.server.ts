/** Stockage des photos de fils — utilisé par l'interface admin et par l'accès agent. */

export const SUTURE_BUCKET = "sutures";
export const SUTURE_CONTENT_TYPE = "sutures";
export const MAX_SUTURE_PHOTOS = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp|gif)$/;

/** Télécharge une image depuis une adresse https et vérifie qu'il s'agit bien d'une image. */
export async function downloadImage(rawUrl: string) {
  const target = new URL(rawUrl);
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
  if (declared > MAX_IMAGE_BYTES) throw new Error("Image trop lourde (5 Mo max)");

  const bytes = new Uint8Array(await response.arrayBuffer());
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  return { bytes, contentType, ext };
}

/** Range l'image dans le stockage et l'ajoute à la fin des photos du fil. */
export async function storeSutureImage(params: {
  sutureId: string;
  bytes: Uint8Array;
  contentType: string;
  ext: string;
  source?: string | null;
}) {
  const { sutureId, bytes, contentType, ext } = params;
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("Image trop lourde (5 Mo max)");

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
    .eq("content_type_code", SUTURE_CONTENT_TYPE)
    .eq("content_id", sutureId);
  const count = existing?.length ?? 0;
  if (count >= MAX_SUTURE_PHOTOS) throw new Error(`${MAX_SUTURE_PHOTOS} photos au maximum par fil`);
  const position = Math.max(0, ...(existing ?? []).map((r) => r.position)) + 1;

  const path = `${sutureId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(SUTURE_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw new Error(`Envoi impossible : ${uploadError.message}`);

  const { data: row, error: insertError } = await supabaseAdmin
    .from("content_images")
    .insert({
      content_type_code: SUTURE_CONTENT_TYPE,
      content_id: sutureId,
      storage_path: path,
      position,
      source: params.source ?? null,
    })
    .select("id, storage_path, position")
    .single();
  if (insertError) {
    await supabaseAdmin.storage.from(SUTURE_BUCKET).remove([path]);
    throw new Error(`Enregistrement impossible : ${insertError.message}`);
  }
  return row;
}
