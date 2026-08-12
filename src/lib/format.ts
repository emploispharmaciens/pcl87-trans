/** Temps relatif court, en français simple. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem.`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initialsOf(name: string | null | undefined, email?: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function excerpt(text: string, max = 150): string {
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}
