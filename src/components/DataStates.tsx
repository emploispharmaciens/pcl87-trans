import { Button } from "@/components/ui/button";

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "bi-inbox",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-card px-6 py-14 text-center shadow-card">
      <i className={`bi ${icon} text-4xl text-muted-foreground`} aria-hidden="true" />
      <p className="mt-3 font-semibold">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-card px-6 py-12 text-center shadow-card">
      <i className="bi bi-exclamation-triangle text-4xl text-destructive" aria-hidden="true" />
      <p className="mt-3 font-semibold">Le chargement a échoué</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? "Vérifiez votre connexion, puis réessayez."}
      </p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise mr-2" aria-hidden="true" />
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
