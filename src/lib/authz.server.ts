import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

/** Rôles de l'utilisateur courant (lisibles via la policy "own roles read"). */
export async function ownRoles(supabase: Client, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
}

export async function isAdmin(supabase: Client, userId: string): Promise<boolean> {
  return (await ownRoles(supabase, userId)).includes("admin");
}

export async function isModerator(supabase: Client, userId: string): Promise<boolean> {
  const roles = await ownRoles(supabase, userId);
  return roles.includes("admin") || roles.includes("moderateur");
}

/** Le compte courant est-il approuvé ? (policy "own profile read") */
export async function isApproved(supabase: Client, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("approval").eq("id", userId).maybeSingle();
  return data?.approval === "approuve";
}

/** Droit d'édition d'une transmission : auteur ou modérateur/admin. */
export async function canEditTransmission(
  supabase: Client,
  userId: string,
  transmissionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("transmissions")
    .select("author_id")
    .eq("id", transmissionId)
    .maybeSingle();
  if (!data) return false;
  if (data.author_id === userId) return true;
  return isModerator(supabase, userId);
}
