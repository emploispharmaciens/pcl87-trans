import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, ListFilters } from "@/lib/api";

type Props = {
  filters: ListFilters;
  categories: Category[];
  canCreate: boolean;
  onChange: (next: ListFilters) => void;
  onCreate: () => void;
};

export function FiltersBar({ filters, categories, canCreate, onChange, onCreate }: Props) {
  return (
    <div className="module-panel mb-4 grid grid-cols-2 gap-2 p-2 sm:flex sm:flex-wrap sm:items-center">
      <div className="relative col-span-2 min-w-0 sm:min-w-40 sm:flex-1">
        <i
          className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Rechercher"
          aria-label="Rechercher une transmission"
          maxLength={100}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.categoryId ?? "all"}
        onValueChange={(v) => onChange({ ...filters, categoryId: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-full sm:w-36" aria-label="Filtrer par catégorie">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes catégories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status ?? "ouvert"}
        onValueChange={(v) => onChange({ ...filters, status: v as NonNullable<ListFilters["status"]> })}
      >
        <SelectTrigger className="w-full sm:w-32" aria-label="Filtrer par statut">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ouvert">Actives</SelectItem>
          <SelectItem value="archive">Archivées</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.type ?? "all"}
        onValueChange={(v) => onChange({ ...filters, type: v as NonNullable<ListFilters["type"]> })}
      >
        <SelectTrigger className="w-full sm:w-36" aria-label="Filtrer par type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="essentiel">Essentielles</SelectItem>
          <SelectItem value="libre">Libres</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={filters.priorityOnly ? "default" : "outline"}
        onClick={() => onChange({ ...filters, priorityOnly: !filters.priorityOnly })}
        aria-pressed={filters.priorityOnly ?? false}
        className="w-full sm:w-auto"
      >
        <i className="bi bi-fire mr-2" aria-hidden="true" />
        Prioritaires
      </Button>

      {canCreate ? (
        <Button type="button" onClick={onCreate} className="w-full sm:ml-auto sm:w-auto">
          <i className="bi bi-plus-lg mr-2" aria-hidden="true" />
          Nouvelle transmission
        </Button>
      ) : null}
    </div>
  );
}
