/**
 * Réduit une image dans le navigateur avant envoi (photo de téléphone
 * trop lourde). Renvoie un JPEG encodé en base64, côté max = maxSize px.
 */
export async function resizeImageToBase64(
  file: File,
  maxSize = 1600,
  quality = 0.85,
): Promise<{ base64: string; contentType: string; fileName: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image illisible"));
      image.src = url;
    });
    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Traitement de l'image impossible");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return {
      base64: dataUrl.split(",")[1] ?? "",
      contentType: "image/jpeg",
      fileName: `${base}.jpg`,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
