import type { Category, Tag } from "@/lib/api";

export function CategoryBadge({ category }: { category: Category | null }) {
  if (!category) return null;
  return (
    <span
      className="inline-flex items-center rounded-full border bg-transparent px-2 py-0.5 text-[0.7rem] font-medium"
      style={{ borderColor: category.color, color: category.color }}
    >
      {category.label}
    </span>
  );
}

export function PriorityBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-priority px-2 py-0.5 text-[0.7rem] font-semibold text-priority-foreground">
      <i className="bi bi-fire" aria-hidden="true" />
      Prioritaire
    </span>
  );
}

export function EssentialBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-essential px-2 py-0.5 text-[0.7rem] font-semibold text-essential-foreground">
      <i className="bi bi-star-fill" aria-hidden="true" />
      Essentiel
    </span>
  );
}

export function ImageCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
      <i className="bi bi-image" aria-hidden="true" />
      {count}
    </span>
  );
}

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground">
      #{tag.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ouvert: "bg-module-soft text-module-text",
    archive: "bg-muted text-muted-foreground",
    supprime: "bg-priority/15 text-destructive",
  };
  const labels: Record<string, string> = {
    ouvert: "Active",
    archive: "Archivée",
    supprime: "Masquée",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${styles[status] ?? "bg-muted"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
