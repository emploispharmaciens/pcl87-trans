import type { Transmission } from "@/lib/api";
import { UserAvatar } from "./UserAvatar";
import {
  CategoryBadge,
  EssentialBadge,
  ImageCountBadge,
  PriorityBadge,
  TagChip,
} from "./Badges";
import { excerpt, relativeTime } from "@/lib/format";

export function TransmissionCard({
  item,
  onOpen,
}: {
  item: Transmission;
  onOpen: (item: Transmission) => void;
}) {
  const extraTags = item.tags.length - 3;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={`module-card cursor-pointer p-4 ${
        item.is_priority ? "border-l-[3px] border-l-destructive" : ""
      }`}
    >
      <header className="flex items-center gap-3">
        <UserAvatar
          name={item.author?.display_name}
          initials={item.author?.initials}
          photoUrl={item.author?.photo_url}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {item.author?.display_name ?? "Soignant"}
          </p>
          <p className="text-[0.7rem] text-muted-foreground">{relativeTime(item.created_at)}</p>
        </div>
      </header>

      <h2 className="mt-3 font-semibold">{item.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{excerpt(item.content_text, 150)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={item.category} />
        {item.is_priority ? <PriorityBadge /> : null}
        {item.type === "essentiel" ? <EssentialBadge /> : null}
        <ImageCountBadge count={item.images.length} />
        {item.tags.slice(0, 3).map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
        {extraTags > 0 ? (
          <span className="text-[0.7rem] text-muted-foreground">+{extraTags}</span>
        ) : null}
      </div>
    </article>
  );
}
