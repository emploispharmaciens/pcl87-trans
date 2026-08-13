import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ModuleBanner } from "@/components/ModuleBanner";
import { UserAvatar } from "@/components/UserAvatar";
import { ErrorState } from "@/components/DataStates";
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
import { APPROVAL_LABELS } from "@/lib/constants";
import { useAuth, type Profile } from "@/hooks/useAuth";
import { setMyPhotoMode, updateMyProfile, uploadMyAvatar } from "@/lib/profile.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mon profil — Transmissions DB&M" },
      {
        name: "description",
        content:
          "Modifiez votre nom, votre fonction, votre service et votre photo affichés sur vos transmissions.",
      },
      { property: "og:title", content: "Mon profil — Transmissions DB&M" },
      {
        property: "og:description",
        content: "Nom, fonction, service et photo affichés aux équipes du bloc opératoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <ProfilePage />
    </AuthGate>
  ),
});

const SERVICES = ["Bloc ortho", "Bloc viscéral"];

function monthYear(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function ProfilePage() {
  const { profile, setProfile, error, reload } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", jobTitle: "", service: "" });

  const save = useServerFn(updateMyProfile);
  const upload = useServerFn(uploadMyAvatar);
  const photoMode = useServerFn(setMyPhotoMode);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      jobTitle: profile.job_title ?? "",
      service: profile.service ?? "",
    });
  }, [profile?.id]);

  if (error && !profile) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!profile) return null;

  const previewInitials =
    ((form.firstName.trim().slice(0, 1) + form.lastName.trim().slice(0, 1)).toUpperCase() || "?");
  const previewName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");

  const apply = (row: unknown) => setProfile(row as Profile);

  const onSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Le prénom et le nom sont obligatoires.");
      return;
    }
    setBusy(true);
    try {
      const row = await save({
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          jobTitle: form.jobTitle.trim() || null,
          service: form.service.trim() || null,
        },
      });
      apply(row);
      toast.success("Profil enregistré.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = async (file: File) => {
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      toast.error("Formats acceptés : JPEG, PNG, WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo trop lourde (2 Mo max).");
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
      const row = await upload({
        data: { fileName: file.name, contentType: file.type, base64: btoa(binary) },
      });
      apply(row);
      toast.success("Photo mise à jour.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Téléversement impossible.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onPhotoMode = async (mode: "google" | "none") => {
    setBusy(true);
    try {
      const row = await photoMode({ data: { mode } });
      apply(row);
      toast.success(mode === "google" ? "Photo Google rétablie." : "Photo supprimée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <ModuleBanner
        title="Mon profil"
        subtitle="Ce que les équipes voient de vous sur vos transmissions."
        icon="bi-person-circle"
      />

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-4">
        <section className="module-card p-4">
          <h2 className="text-sm font-semibold text-module-text">Aperçu</h2>
          <div className="mt-3 flex items-center gap-3">
            <UserAvatar
              name={previewName}
              initials={previewInitials}
              photoUrl={profile.photo_url}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{previewName || "Soignant"}</p>
              <p className="text-[0.7rem] text-muted-foreground">
                {[form.jobTitle.trim(), form.service.trim()].filter(Boolean).join(" · ") ||
                  "Fonction non renseignée"}
              </p>
            </div>
          </div>
        </section>

        <section className="module-card space-y-4 p-4">
          <h2 className="text-sm font-semibold text-module-text">Modifier mes informations</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="font-semibold">
                Prénom
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                maxLength={80}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="font-semibold">
                Nom
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                maxLength={80}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle" className="font-semibold">
                Fonction
              </Label>
              <Input
                id="jobTitle"
                value={form.jobTitle}
                maxLength={50}
                placeholder="ex : IBODE, IDE, Cadre…"
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">50 caractères maximum.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Service</Label>
              <Select
                value={form.service || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, service: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger aria-label="Service">
                  <SelectValue placeholder="ex : Bloc ortho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non renseigné</SelectItem>
                  {SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Photo</p>
            <div className="flex flex-wrap items-center gap-3">
              <UserAvatar
                name={previewName}
                initials={previewInitials}
                photoUrl={profile.photo_url}
                size={64}
              />
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onPickFile(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                <i className="bi bi-upload mr-2" aria-hidden="true" />
                Changer la photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !profile.google_photo_url}
                onClick={() => void onPhotoMode("google")}
              >
                <i className="bi bi-google mr-2" aria-hidden="true" />
                Utiliser la photo Google
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={busy || !profile.photo_url}
                onClick={() => void onPhotoMode("none")}
              >
                <i className="bi bi-trash mr-2" aria-hidden="true" />
                Supprimer la photo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP — 2 Mo maximum.</p>
          </div>

          <Button onClick={() => void onSave()} disabled={busy}>
            <i className="bi bi-check2 mr-2" aria-hidden="true" />
            Enregistrer
          </Button>
        </section>

        <section className="module-card p-4">
          <h2 className="text-sm font-semibold text-module-text">Informations du compte</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="truncate">{profile.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Statut du compte</dt>
              <dd>{APPROVAL_LABELS[profile.approval]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Membre depuis</dt>
              <dd>{monthYear(profile.created_at)}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
