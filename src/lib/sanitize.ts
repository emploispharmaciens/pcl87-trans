// Sanitisation du HTML riche avant affichage (protection XSS).
// Whitelist stricte : aucune balise/attribut hors liste n'est conservé.
const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
  "DIV",
  "SPAN",
]);

/** Échappe du texte brut destiné au DOM. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Retire toutes les balises et renvoie le texte brut. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|ul|ol)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nettoie le HTML de l'éditeur. Côté navigateur : parsing DOM. Côté serveur : fallback texte. */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
    return escapeHtml(htmlToText(html));
  }

  const doc = new window.DOMParser().parseFromString(`<body>${html}</body>`, "text/html");

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      walk(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        child.removeAttribute(attr.name);
      }
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
