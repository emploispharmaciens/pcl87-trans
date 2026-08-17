import { supabase } from "@/integrations/supabase/client";

export type SignalementRow = {
  id: string;
  site: string;
  product_label: string;
  kind: string;
  comment: string;
  initials: string | null;
  created_at: string;
};

export async function fetchSignalements(): Promise<SignalementRow[]> {
  const { data, error } = await supabase
    .from("pharma_signalements")
    .select("id, site, product_label, kind, comment, initials, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as SignalementRow[];
}

export type SignalementInput = {
  site: string;
  product_label: string;
  kind: string;
  comment: string;
  initials: string | null;
};

export async function createSignalement(
  input: SignalementInput,
  authorId: string,
): Promise<void> {
  const { error } = await supabase
    .from("pharma_signalements")
    .insert({ ...input, author_id: authorId });
  if (error) throw error;
}

export function signalementsToCsv(rows: SignalementRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["date", "secteur", "produit", "type", "commentaire", "initiales"];
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toISOString(),
      r.site,
      r.product_label,
      r.kind,
      r.comment,
      r.initials ?? "",
    ]
      .map((v) => escape(String(v)))
      .join(";"),
  );
  return [header.join(";"), ...lines].join("\n");
}
