import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { StatsCards, StatsSkeleton } from "@/components/StatsCards";
import { FiltersBar } from "@/components/FiltersBar";
import { TransmissionCard } from "@/components/TransmissionCard";
import { TransmissionDetail } from "@/components/TransmissionDetail";
import { TransmissionForm } from "@/components/TransmissionForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/DataStates";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCategories,
  fetchStats,
  fetchTransmissions,
  hardDelete,
  setStatus,
  type ListFilters,
  type Transmission,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Transmissions du bloc — DB&M" },
      {
        name: "description",
        content:
          "Le journal de relève des équipes de bloc opératoire : pannes, consignes, alertes et rappels partagés entre équipes.",
      },
      { property: "og:title", content: "Transmissions du bloc — DB&M" },
      {
        property: "og:description",
        content: "Le journal de relève numérique des équipes de bloc opératoire.",
      },
    ],
  }),
  component: TransmissionsPage,
});

function TransmissionsPage() {
  return (
    <AuthGate>
      <Portal />
    </AuthGate>
  );
}

function Portal() {
  const { profile, isAdmin, isModerator } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ListFilters>({ status: "ouvert", type: "all" });
  const [detail, setDetail] = useState<Transmission | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transmission | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "archive" | "delete"; item: Transmission } | null>(
    null,
  );

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const statsQuery = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const listQuery = useQuery({
    queryKey: ["transmissions", filters],
    queryFn: () => fetchTransmissions(filters),
  });

  const items = listQuery.data ?? [];
  const canEdit = useMemo(
    () => (item: Transmission) => item.author_id === profile?.id || isModerator,
    [profile?.id, isModerator],
  );

  const act = useMutation({
    mutationFn: async ({ kind, item }: { kind: "archive" | "delete"; item: Transmission }) => {
      if (kind === "archive") {
        await setStatus(item.id, item.status === "archive" ? "ouvert" : "archive");
        return;
      }
      if (isAdmin) await hardDelete(item.id);
      else await setStatus(item.id, "supprime");
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.kind === "archive" ? "Statut mis à jour." : "Transmission retirée.");
      setConfirm(null);
      setDetail(null);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ModuleBanner
        title="Transmissions"
        subtitle="Ce que l'équipe précédente doit vous dire."
      />

      <main className="mx-auto max-w-4xl px-4 py-4">
        <section className="mb-4" aria-label="Statistiques">
          {statsQuery.isPending ? (
            <StatsSkeleton />
          ) : statsQuery.isError ? (
            <ErrorState onRetry={() => void statsQuery.refetch()} />
          ) : (
            <StatsCards stats={statsQuery.data} />
          )}
        </section>

        <FiltersBar
          filters={filters}
          categories={categoriesQuery.data ?? []}
          canCreate={Boolean(profile)}
          onChange={setFilters}
          onCreate={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />

        <section aria-label="Liste des transmissions">
          {listQuery.isPending ? (
            <CardSkeleton />
          ) : listQuery.isError ? (
            <ErrorState
              message={(listQuery.error as Error).message}
              onRetry={() => void listQuery.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon="bi-chat-square-text"
              title="Aucune transmission"
              hint="Écrivez la première pour l'équipe suivante."
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <TransmissionCard key={item.id} item={item} onOpen={setDetail} />
              ))}
            </div>
          )}
        </section>
      </main>

      <TransmissionDetail
        item={detail}
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        canEdit={detail ? canEdit(detail) : false}
        canDeleteHard={isAdmin}
        onEdit={(item) => {
          setEditing(item);
          setDetail(null);
          setFormOpen(true);
        }}
        onArchive={(item) => setConfirm({ kind: "archive", item })}
        onDelete={(item) => setConfirm({ kind: "delete", item })}
      />

      {profile ? (
        <TransmissionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          categories={categoriesQuery.data ?? []}
          authorId={profile.id}
          editing={editing}
        />
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.kind === "archive"
            ? confirm.item.status === "archive"
              ? "Réactiver cette transmission ?"
              : "Archiver cette transmission ?"
            : isAdmin
              ? "Supprimer définitivement ?"
              : "Masquer cette transmission ?"
        }
        message={
          confirm?.kind === "archive"
            ? "Elle change simplement de liste. Vous pouvez revenir en arrière."
            : isAdmin
              ? "Cette action est définitive. La transmission sera effacée."
              : "Elle ne sera plus visible. Un administrateur peut la restaurer."
        }
        confirmLabel={confirm?.kind === "archive" ? "Archiver" : "Supprimer"}
        tone={confirm?.kind === "archive" ? "warning" : "danger"}
        loading={act.isPending}
        onConfirm={() => confirm && act.mutate(confirm)}
      />
    </div>
  );
}
