import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, TableSkeleton } from "@/components/DataStates";
import { ROLE_LABELS } from "@/lib/constants";
import { fullDate } from "@/lib/format";
import { fetchInvites, setInviteActive, type InviteRow } from "@/lib/api";
import { createInvite } from "@/lib/invites.functions";

function inviteUrl(code: string): string {
  return `${window.location.origin}/invite?code=${encodeURIComponent(code)}`;
}

export function InvitesPanel() {
  const queryClient = useQueryClient();
  const create = useServerFn(createInvite);
  const invites = useQuery({ queryKey: ["invites"], queryFn: fetchInvites });

  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"membre" | "moderateur" | "admin">("membre");
  const [days, setDays] = useState("30");
  const [maxUses, setMaxUses] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const expiresInDays = Number(days);
      const uses = Number(maxUses);
      return create({
        data: {
          ...(label.trim() ? { label: label.trim() } : {}),
          password,
          role,
          ...(Number.isFinite(expiresInDays) && expiresInDays > 0 ? { expiresInDays } : {}),
          ...(Number.isFinite(uses) && uses > 0 ? { maxUses: uses } : {}),
        },
      });
    },
    onSuccess: ({ code }) => {
      setLastLink(inviteUrl(code));
      setPassword("");
      setLabel("");
      toast.success("Lien d'invitation créé");
      void queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setInviteActive(id, active),
    onSuccess: () => {
      toast.success("Invitation mise à jour");
      void queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié");
  };

  return (
    <div className="space-y-3">
      <div className="module-card space-y-3 p-5">
        <div>
          <h2 className="font-semibold">Nouveau lien d'invitation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La personne se connecte avec Google, saisit le mot de passe du lien et son accès est
            validé automatiquement.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="invite-label">Libellé (optionnel)</Label>
            <Input
              id="invite-label"
              value={label}
              maxLength={120}
              placeholder="Équipe IBODE nuit"
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-password">Mot de passe (6 caractères min.)</Label>
            <Input
              id="invite-password"
              value={password}
              maxLength={100}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Niveau d'accès accordé</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["membre", "moderateur", "admin"] as const).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="invite-days">Validité (jours)</Label>
              <Input
                id="invite-days"
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-uses">Utilisations max</Label>
              <Input
                id="invite-uses"
                inputMode="numeric"
                placeholder="illimité"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={password.trim().length < 6 || createMutation.isPending}
        >
          <i className="bi bi-link-45deg mr-2" aria-hidden="true" />
          Générer le lien
        </Button>

        {lastLink && (
          <div className="rounded-lg bg-module-soft p-3 text-sm">
            <p className="font-semibold text-module-text">Lien à partager</p>
            <p className="mt-1 break-all">{lastLink}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Transmettez le mot de passe séparément : il n'est plus affichable ensuite.
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void copy(lastLink)}>
              <i className="bi bi-clipboard mr-2" aria-hidden="true" />
              Copier
            </Button>
          </div>
        )}
      </div>

      {invites.isPending ? (
        <TableSkeleton />
      ) : invites.isError ? (
        <ErrorState onRetry={() => void invites.refetch()} />
      ) : (invites.data ?? []).length === 0 ? (
        <p className="module-card p-5 text-sm text-muted-foreground">Aucune invitation créée.</p>
      ) : (
        <div className="module-panel divide-y overflow-hidden">
          {(invites.data ?? []).map((invite: InviteRow) => (
            <div key={invite.id} className="flex flex-wrap items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {invite.label ?? "Invitation"} · {ROLE_LABELS[invite.grant_role]}
                </p>
                <p className="truncate text-[0.7rem] text-muted-foreground">
                  {invite.is_active ? "Actif" : "Désactivé"} · {invite.uses}
                  {invite.max_uses ? `/${invite.max_uses}` : ""} utilisation(s) ·{" "}
                  {invite.expires_at ? `expire le ${fullDate(invite.expires_at)}` : "sans expiration"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void copy(inviteUrl(invite.code))}>
                <i className="bi bi-clipboard" aria-hidden="true" />
              </Button>
              <Button
                variant={invite.is_active ? "ghost" : "secondary"}
                size="sm"
                onClick={() => toggle.mutate({ id: invite.id, active: !invite.is_active })}
              >
                {invite.is_active ? "Désactiver" : "Réactiver"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
