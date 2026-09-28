import type React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/profile.functions";

export type AppRole = "membre" | "moderateur" | "admin";
export type Approval = "en_attente" | "approuve" | "refuse" | "desactive";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  initials: string | null;
  job_title: string | null;
  photo_url: string | null;
  service: string | null;
  google_photo_url: string | null;
  avatar_path: string | null;
  last_login_at: string | null;
  created_at: string;
  approval: Approval;
  refusal_reason: string | null;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  error: string | null;
  isApproved: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  reload: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  signOut: () => Promise<void>;
};

// Contexte partagé via globalThis : survit aux rechargements à chaud du module
// (sinon le Provider et les consommateurs peuvent référencer deux contextes différents).
const globalKey = "__dbm_auth_context__";
const g = globalThis as unknown as Record<string, React.Context<AuthState | null> | undefined>;
const AuthContext: React.Context<AuthState | null> =
  g[globalKey] ?? (g[globalKey] = createContext<AuthState | null>(null));

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (current: Session | null) => {
    if (!current) {
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const meta = (current.user.user_metadata ?? {}) as Record<string, string | undefined>;
      const fullName = meta["full_name"] ?? meta["name"] ?? "";
      const [firstName, ...rest] = fullName.split(" ");
      const args: { firstName?: string; lastName?: string; photoUrl?: string } = {};
      if (firstName) args.firstName = firstName;
      if (rest.join(" ")) args.lastName = rest.join(" ");
      const photo = meta["avatar_url"] ?? meta["picture"];
      if (photo) args.photoUrl = photo;
      const row = await ensureProfile({ data: args });
      setProfile((row as Profile) ?? null);

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", current.user.id);
      setRoles((roleRows ?? []).map((r) => r.role as AppRole));

      const target = sessionStorage.getItem("postLoginRedirect");
      if (target) {
        sessionStorage.removeItem("postLoginRedirect");
        if ((row as Profile | null)?.approval === "approuve" && target !== window.location.pathname) {
          void navigate({ to: target, replace: true });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    let currentUserId: string | null | undefined;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      currentUserId = data.session?.user.id ?? null;
      setSession(data.session);
      void load(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(next);
      const nextId = next?.user.id ?? null;
      if (nextId === currentUserId) return; // simple rafraîchissement : pas d'écran de chargement
      currentUserId = nextId;
      setLoading(true);
      void load(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    loading,
    session,
    profile,
    roles,
    error,
    isApproved: profile?.approval === "approuve",
    isModerator: roles.includes("moderateur") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    setProfile: (next: Profile) => setProfile(next),
    reload: async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await load(data.session);
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setRoles([]);
      if (typeof window !== "undefined") window.location.assign("/");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
