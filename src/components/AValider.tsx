import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Étiquette « À valider » posée sur ce que Letta a créé.
 * Pour un admin, un clic sur « Valider » retire l'étiquette.
 */
export function AValider({
  isAdmin,
  onValider,
  compact = false,
}: {
  isAdmin: boolean;
  onValider: () => Promise<void>;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: onValider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sutures"] });
      await queryClient.invalidateQueries({ queryKey: ["suture-protocoles"] });
      toast.success("Validé");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
        <i className="bi bi-robot" aria-hidden="true" />
        {compact ? "À valider" : "Ajouté par Letta · à valider"}
      </span>
      {isAdmin ? (
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            mutation.mutate();
          }}
          className="rounded-full bg-sky-700 px-2 py-0.5 text-[11px] font-semibold uppercase text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {mutation.isPending ? "…" : "Valider"}
        </button>
      ) : null}
    </span>
  );
}
