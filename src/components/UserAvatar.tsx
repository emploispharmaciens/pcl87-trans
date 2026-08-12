import { cn } from "@/lib/utils";

type Props = {
  name?: string | null | undefined;
  initials?: string | null | undefined;
  photoUrl?: string | null | undefined;
  size?: number | undefined;
  className?: string | undefined;
};

export function UserAvatar({ name, initials, photoUrl, size = 40, className }: Props) {
  const label = initials?.slice(0, 2) || (name ? name.slice(0, 1).toUpperCase() : "?");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-module-strong font-bold text-primary-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: "0.8rem" }}
      aria-hidden="true"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        label
      )}
    </span>
  );
}
