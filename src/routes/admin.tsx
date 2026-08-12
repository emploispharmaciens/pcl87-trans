import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { TransmissionDetail } from "@/components/TransmissionDetail";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState, TableSkeleton } from "@/components/DataStates";
import { StatusBadge, CategoryBadge } from "@/components/Badges";
import { UserAvatar } from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPROVAL_LABELS, ROLE_LABELS } from "@/lib/constants";
import { fullDate } from "@/lib/format";
import {
  fetchAccounts,
  fetchAllForAdmin,
  fetchCategories,
  hardDelete,
  setApproval,
  setRole,
  type Transmission,
} from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Transmissions DB&M" },
      {
        name: "description",
        content:
          "Modération des transmissions, statistiques d'usage, export CSV et validation des comptes soignants.",
      },
      { property: "og:title", content: "Administration — Transmissions DB&M" },
      {
        property: "og:description",
        content: "Modération, statistiques, export et gestion des comptes du module Transmissions.",
      },
    ],
  }),
  component: () => (
    <AuthGate requireAdmin>
      <AdminPage />
    </AuthGate>
  ),
});

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportCsv(rows: Transmission[]) {
  const header = ["Titre", "Statut", "Categorie", "Date", "Auteur"];
  const lines = rows.map((r) =>
    [
      r.title,
      r.status,
      r.category?.label ?? "",
      new Date(r.created_at).toISOString(),
      r.author?.display_name ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(";"),
  );
  const csv = `\uFEFF${header.join(";")}\n${lines.join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `transmissions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [preview, setPreview] = useState<Transmission | null>(null);
  const [toDelete, setToDelete] = useState<Transmission | null>(null);

  const all = useQuery({ queryKey: ["admin-transmissions"], queryFn: fetchAllForAdmin });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (all.data ?? []).filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (categoryId === "all" || r.category_id === categoryId) &&
        (!term ||
          r.title.toLowerCase().includes(term) ||
          (r.author?.display_name ?? "").toLowerCase().includes(term)),
    );
  }, [all.data, search, status, categoryId]);

  const stats = useMemo(() => {
    const data = all.data ?? [];
    return {
      total: data.length,
      published: data.filter((r) => r.status === "ouvert").length,
      archived: data.filter((r) => r.status === "archive").length,
      hidden: data.filter((r) => r.status === "supprime").length,
    };
  }, [all.data]);

  const removeRow = useMutation({
    mutationFn: (id: string) => hardDelete(id),
    onSuccess: async () => {
      toast.success("Transmission supprimée.");
      setToDelete(null);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approval = useMutation({
    mutationFn: ({ id, value }: { id: string; value: "approuve" | "refuse" | "desactive" }) =>
      setApproval(id, value),
    onSuccess: async () => {
      toast.success("Compte mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const role = useMutation({
    mutationFn: ({ id, value }: { id: string; value: "membre" | "moderateur" | "admin" }) =>
      setRole(id, value),
    onSuccess: async () => {
      toast.success("Niveau d'accès mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ModuleBanner
        title="Administration"
        subtitle="Modération, statistiques, export et comptes."
        icon="bi-sliders"
      />

      <main className="mx-auto max-w-4xl px-4 py-4">
        <Tabs defaultValue="all">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="all">Transmissions</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="accounts">Comptes</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            <div className="module-panel flex flex-wrap gap-2 p-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher"
                maxLength={100}
                className="min-w-40 flex-1"
              />
              <Select value={status} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" aria-label="Statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="ouvert">Actives</SelectItem>
                  <SelectItem value="archive">Archivées</SelectItem>
                  <SelectItem value="supprime">Masquées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-40" aria-label="Catégorie">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {all.isPending ? (
              <TableSkeleton />
            ) : all.isError ? (
              <ErrorState onRetry={() => void all.refetch()} />
            ) : rows.length === 0 ? (
              <p className="rounded-lg bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
                Aucun résultat.
              </p>
            ) : (
              <div className="module-panel divide-y overflow-hidden">
                {rows.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{row.title}</p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        {row.author?.display_name ?? "—"} · {fullDate(row.created_at)}
                      </p>
                    </div>
                    <CategoryBadge category={row.category} />
                    <StatusBadge status={row.status} />
                    <Button variant="ghost" size="sm" onClick={() => setPreview(row)}>
                      <i className="bi bi-eye" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setToDelete(row)}
                      aria-label="Supprimer définitivement"
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            {all.isPending ? (
              <TableSkeleton rows={2} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total", value: stats.total },
                  { label: "Actives", value: stats.published },
                  { label: "Archivées", value: stats.archived },
                  { label: "Masquées", value: stats.hidden },
                ].map((kpi) => (
                  <div key={kpi.label} className="module-card p-4">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="mt-4">
            <div className="module-card p-5">
              <h2 className="font-semibold">Export CSV</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Titre, statut, catégorie, date et auteur. Le contenu des transmissions n'est pas
                exporté.
              </p>
              <Button
                className="mt-4"
                onClick={() => exportCsv(all.data ?? [])}
                disabled={!all.data?.length}
              >
                <i className="bi bi-download mr-2" aria-hidden="true" />
                Télécharger le fichier
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-4 space-y-3">
            {accounts.isPending ? (
              <TableSkeleton />
            ) : accounts.isError ? (
              <ErrorState onRetry={() => void accounts.refetch()} />
            ) : (
              <div className="module-panel divide-y overflow-hidden">
                {(accounts.data ?? []).map((account) => (
                  <div key={account.id} className="flex flex-wrap items-center gap-2 p-3">
                    <UserAvatar
                      name={account.display_name}
                      initials={account.initials}
                      photoUrl={account.photo_url}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {account.display_name ?? "Sans nom"}
                      </p>
                      <p className="truncate text-[0.7rem] text-muted-foreground">
                        {account.email} · {APPROVAL_LABELS[account.approval]} ·{" "}
                        {account.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "Aucun rôle"}
                      </p>
                    </div>
                    <Select
                      value={account.roles[0] ?? "membre"}
                      onValueChange={(v) =>
                        role.mutate({
                          id: account.id,
                          value: v as "membre" | "moderateur" | "admin",
                        })
                      }
                    >
                      <SelectTrigger className="w-32" aria-label="Niveau d'accès">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membre">Membre</SelectItem>
                        <SelectItem value="moderateur">Modérateur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approval.mutate({ id: account.id, value: "approuve" })}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => approval.mutate({ id: account.id, value: "refuse" })}
                    >
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => approval.mutate({ id: account.id, value: "desactive" })}
                    >
                      Désactiver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <TransmissionDetail
        item={preview}
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
        canEdit={false}
        canDeleteHard
        onEdit={() => undefined}
        onArchive={() => undefined}
        onDelete={() => undefined}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Supprimer définitivement ?"
        message="La transmission sera effacée de la base. Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={removeRow.isPending}
        onConfirm={() => toDelete && removeRow.mutate(toDelete.id)}
      />
    </div>
  );
}
