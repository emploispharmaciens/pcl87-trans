import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { PHARMA_PRODUCTS, SIGNALEMENT_KINDS, type PharmaSite } from "@/lib/pharmacy";
import { createSignalement, fetchSignalements, signalementsToCsv } from "@/lib/pharma-api";
import { fullDate } from "@/lib/format";

export const Route = createFileRoute("/pharmacie/signalements")({
  head: () => ({
    meta: [
      { title: "Signalements pharmacie — Des Blocs & Moi" },
      {
        name: "description",
        content:
          "Signaler une rupture, une péremption ou une erreur de dotation pharmaceutique au bloc, et consulter l'historique de l'équipe.",
      },
      { property: "og:title", content: "Signalements pharmacie du bloc" },
      {
        property: "og:description",
        content: "Rupture, péremption ou erreur de dotation — aucune donnée patient.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Signalements,
});

function Signalements() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [site, setSite] = useState<PharmaSite>("ORTHO");
  const [product, setProduct] = useState("");
  const [kind, setKind] = useState<string>("rupture");
  const [comment, setComment] = useState("");
  const [initials, setInitials] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["pharma-signalements"],
    queryFn: fetchSignalements,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Session expirée.");
      if (!product) throw new Error("Sélectionner un produit.");
      await createSignalement(
        {
          site,
          product_label: product,
          kind,
          comment: comment.trim(),
          initials: initials.trim() || null,
        },
        profile.id,
      );
    },
    onSuccess: () => {
      toast.success("Signalement envoyé.");
      setProduct("");
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["pharma-signalements"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Envoi impossible."),
  });

  const exportCsv = () => {
    const blob = new Blob([signalementsToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signalements-pharmacie.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-xl font-semibold text-module-text">Signalements</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rupture ou anomalie constatée — aucune donnée patient.
      </p>

      <form
        className="module-panel mt-4 space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Secteur</p>
          <div className="mt-2 flex gap-2">
            {(["ORTHO", "SSPI"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={site === s ? "default" : "outline"}
                onClick={() => setSite(s)}
                aria-pressed={site === s}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Produit</p>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger className="mt-2" aria-label="Produit concerné">
              <SelectValue placeholder="Choisir un produit" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {PHARMA_PRODUCTS.map((p) => (
                <SelectItem key={p.label} value={p.label}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIGNALEMENT_KINDS.map((k) => (
              <Button
                key={k}
                type="button"
                variant={kind === k ? "default" : "outline"}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
              >
                {k}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="signalement-comment"
            className="text-xs font-semibold uppercase text-muted-foreground"
          >
            Commentaire
          </label>
          <Textarea
            id="signalement-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2"
          />
        </div>

        <div>
          <label
            htmlFor="signalement-initials"
            className="text-xs font-semibold uppercase text-muted-foreground"
          >
            Initiales (facultatif)
          </label>
          <Input
            id="signalement-initials"
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
            maxLength={6}
            className="mt-2"
          />
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          <i className="bi bi-send mr-2" aria-hidden="true" />
          Envoyer le signalement
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-module-text">Historique</h3>
        <Button type="button" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <i className="bi bi-filetype-csv mr-2" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <div className="mt-3 grid gap-2">
        {isLoading ? (
          <div className="module-card p-6 text-center text-sm text-muted-foreground">
            Chargement…
          </div>
        ) : rows.length === 0 ? (
          <div className="module-card p-6 text-center text-sm text-muted-foreground">
            Aucun signalement.
          </div>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="module-card p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
                <span className="rounded-full bg-module-strong/10 px-2 py-0.5 text-module-strong">
                  {r.site}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {r.kind}
                </span>
                <span className="text-muted-foreground">{fullDate(r.created_at)}</span>
                {r.initials ? (
                  <span className="text-muted-foreground">· {r.initials}</span>
                ) : null}
              </div>
              <p className="mt-2 font-semibold uppercase text-module-text">{r.product_label}</p>
              {r.comment ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {r.comment}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
