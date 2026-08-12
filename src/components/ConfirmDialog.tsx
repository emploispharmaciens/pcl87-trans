import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "warning" | "danger";
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  tone = "danger",
  onConfirm,
  loading,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={
              tone === "danger"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-essential text-essential-foreground hover:bg-essential/90"
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
