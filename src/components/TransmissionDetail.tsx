import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Transmission } from "@/lib/api";
import { UserAvatar } from "./UserAvatar";
import { CategoryBadge, EssentialBadge, PriorityBadge, TagChip } from "./Badges";
import { ImagesGrid } from "./ImagesGrid";
import { fullDate } from "@/lib/format";
import { sanitizeHtml } from "@/lib/sanitize";

type Props = {
  item: Transmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDeleteHard: boolean;
  onEdit: (item: Transmission) => void;
  onArchive: (item: Transmission) => void;
  onDelete: (item: Transmission) => void;
};

export function TransmissionDetail({
  item,
  open,
  onOpenChange,
  canEdit,
  canDeleteHard,
  onEdit,
  onArchive,
  onDelete,
}: Props) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="module-banner space-y-0 px-4 py-3 text-left">
          <DialogTitle className="pr-8 text-base">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={item.author?.display_name}
              initials={item.author?.initials}
              photoUrl={item.author?.photo_url}
            />
            <div>
              <p className="text-sm font-semibold">{item.author?.display_name ?? "Soignant"}</p>
              <p className="text-[0.7rem] text-muted-foreground">{fullDate(item.created_at)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={item.category} />
            {item.is_priority ? <PriorityBadge /> : null}
            {item.type === "essentiel" ? <EssentialBadge /> : null}
          </div>

          <ImagesGrid images={item.images} />

          <div
            className="prose-dbm"
            // Contenu sanitisé (whitelist stricte de balises) avant affichage.
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content_html) }}
          />

          {item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          ) : null}

          {canEdit ? (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                <i className="bi bi-pencil mr-2" aria-hidden="true" />
                Modifier
              </Button>
              <Button variant="outline" size="sm" onClick={() => onArchive(item)}>
                <i className="bi bi-archive mr-2" aria-hidden="true" />
                {item.status === "archive" ? "Réactiver" : "Archiver"}
              </Button>
              <Button
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(item)}
              >
                <i className="bi bi-trash mr-2" aria-hidden="true" />
                {canDeleteHard ? "Supprimer" : "Masquer"}
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
