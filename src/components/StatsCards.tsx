import type { Stats } from "@/lib/api";
import { RULES } from "@/lib/constants";

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="module-card flex items-center gap-3 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-module-soft text-module-text">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-tight">{value}</span>
        <span className="block truncate text-[0.7rem] text-muted-foreground">{hint ?? label}</span>
      </span>
    </div>
  );
}

export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon="bi-journal-text" label="Actives" value={String(stats.active)} hint="Actives" />
      <StatCard icon="bi-fire" label="Prioritaires" value={String(stats.priority)} hint="Prioritaires" />
      <StatCard
        icon="bi-star"
        label="Essentielles"
        value={`${stats.essential}/${RULES.essentialTarget}`}
        hint="Essentielles"
      />
      <StatCard icon="bi-archive" label="Archivées" value={String(stats.archived)} hint="Archivées" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
