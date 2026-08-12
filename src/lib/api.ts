import { supabase } from "@/integrations/supabase/client";
import { CONTENT_TYPE, RULES } from "./constants";

export type Category = { id: string; label: string; color: string; position: number };
export type TagType =
  | "libre"
  | "fonction"
  | "anatomie"
  | "intervention"
  | "materiel"
  | "personne"
  | "marque";
export type Tag = { id: string; label: string; slug: string; type: TagType };
export type ContentImage = { id: string; storage_path: string; position: number };

export type TransmissionRow = {
  id: string;
  title: string;
  content_html: string;
  content_text: string;
  type: "libre" | "essentiel";
  status: "ouvert" | "archive" | "supprime";
  is_priority: boolean;
  author_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Transmission = TransmissionRow & {
  category: Category | null;
  author: {
    id: string;
    display_name: string | null;
    initials: string | null;
    photo_url: string | null;
    job_title: string | null;
  } | null;
  images: ContentImage[];
  tags: Tag[];
};

const SELECT = `
  id, title, content_html, content_text, type, status, is_priority, author_id, category_id, created_at, updated_at,
  category:categories(id, label, color, position),
  author:profiles!transmissions_author_id_fkey(id, display_name, initials, photo_url, job_title)
`;

export type ListFilters = {
  search?: string;
  categoryId?: string | null;
  status?: "ouvert" | "archive";
  type?: "all" | "libre" | "essentiel";
  priorityOnly?: boolean;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, label, color, position")
    .eq("content_type_code", CONTENT_TYPE)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, label, slug, type")
    .order("label");
  if (error) throw error;
  return (data ?? []) as Tag[];
}

async function attachRelations(rows: TransmissionRow[]): Promise<Transmission[]> {
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [{ data: images }, { data: taggings }] = await Promise.all([
    supabase
      .from("content_images")
      .select("id, storage_path, position, content_id")
      .eq("content_type_code", CONTENT_TYPE)
      .in("content_id", ids)
      .order("position"),
    supabase
      .from("taggings")
      .select("content_id, tag:tags(id, label, slug, type)")
      .eq("content_type_code", CONTENT_TYPE)
      .in("content_id", ids),
  ]);

  return rows.map((row) => ({
    ...(row as Transmission),
    images: (images ?? [])
      .filter((i) => i.content_id === row.id)
      .map(({ id, storage_path, position }) => ({ id, storage_path, position })),
    tags: (taggings ?? [])
      .filter((t) => t.content_id === row.id)
      .map((t) => t.tag as Tag)
      .filter(Boolean),
  }));
}

export async function fetchTransmissions(filters: ListFilters): Promise<Transmission[]> {
  let query = supabase
    .from("transmissions")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(RULES.listLimit);

  query = query.eq("status", filters.status ?? "ouvert");
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
  if (filters.priorityOnly) query = query.eq("is_priority", true);
  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, " ");
    query = query.or(`title.ilike.%${term}%,content_text.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return attachRelations((data ?? []) as unknown as TransmissionRow[]);
}

export async function fetchAllForAdmin(): Promise<Transmission[]> {
  const { data, error } = await supabase
    .from("transmissions")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return attachRelations((data ?? []) as unknown as TransmissionRow[]);
}

export type Stats = {
  active: number;
  priority: number;
  essential: number;
  archived: number;
  hidden: number;
  total: number;
};

export async function fetchStats(): Promise<Stats> {
  const count = async (build: () => ReturnType<typeof supabase.from>) => build;
  void count;
  const base = () => supabase.from("transmissions").select("id", { count: "exact", head: true });

  const [active, priority, essential, archived, hidden, total] = await Promise.all([
    base().eq("status", "ouvert"),
    base().eq("status", "ouvert").eq("is_priority", true),
    base().eq("status", "ouvert").eq("type", "essentiel"),
    base().eq("status", "archive"),
    base().eq("status", "supprime"),
    base(),
  ]);

  return {
    active: active.count ?? 0,
    priority: priority.count ?? 0,
    essential: essential.count ?? 0,
    archived: archived.count ?? 0,
    hidden: hidden.count ?? 0,
    total: total.count ?? 0,
  };
}

export type TransmissionInput = {
  title: string;
  content_html: string;
  content_text: string;
  type: "libre" | "essentiel";
  is_priority: boolean;
  category_id: string;
};

export async function createTransmission(
  input: TransmissionInput,
  authorId: string,
): Promise<TransmissionRow> {
  const { data, error } = await supabase
    .from("transmissions")
    .insert({ ...input, author_id: authorId })
    .select("*")
    .single();
  if (error) throw error;
  return data as TransmissionRow;
}

export async function updateTransmission(
  id: string,
  input: Partial<TransmissionInput>,
): Promise<void> {
  const { error } = await supabase.from("transmissions").update(input).eq("id", id);
  if (error) throw error;
}

export async function setStatus(
  id: string,
  status: "ouvert" | "archive" | "supprime",
): Promise<void> {
  const { error } = await supabase.from("transmissions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function hardDelete(id: string): Promise<void> {
  const { error } = await supabase.from("transmissions").delete().eq("id", id);
  if (error) throw error;
}

function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createTag(label: string, type: Tag["type"]): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert({ label: label.trim(), slug: slugify(label), type })
    .select("id, label, slug, type")
    .single();
  if (error) throw error;
  return data as Tag;
}

export async function syncTags(transmissionId: string, tagIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from("taggings")
    .delete()
    .eq("content_type_code", CONTENT_TYPE)
    .eq("content_id", transmissionId);
  if (deleteError) throw deleteError;

  if (tagIds.length === 0) return;
  const { error } = await supabase.from("taggings").insert(
    tagIds.slice(0, RULES.maxTags).map((tag_id) => ({
      tag_id,
      content_type_code: CONTENT_TYPE,
      content_id: transmissionId,
    })),
  );
  if (error) throw error;
}

export type AccountRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  initials: string | null;
  photo_url: string | null;
  job_title: string | null;
  approval: "en_attente" | "approuve" | "refuse" | "desactive";
  refusal_reason: string | null;
  created_at: string;
};

export async function fetchAccounts(): Promise<(AccountRow & { roles: string[] })[]> {
  const [{ data: profiles, error }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, display_name, initials, photo_url, job_title, approval, refusal_reason, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (error) throw error;
  return (profiles ?? []).map((p) => ({
    ...(p as AccountRow),
    roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
  }));
}

export async function setApproval(
  userId: string,
  approval: AccountRow["approval"],
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ approval, refusal_reason: reason ?? null })
    .eq("id", userId);
  if (error) throw error;
}

export async function setRole(
  userId: string,
  role: "membre" | "moderateur" | "admin",
): Promise<void> {
  const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}
