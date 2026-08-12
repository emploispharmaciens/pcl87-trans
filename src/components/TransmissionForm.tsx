import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";
import { TagChip } from "./Badges";
import { ImagesGrid } from "./ImagesGrid";
import { RULES, TAG_TYPES, TAG_TYPE_LABELS } from "@/lib/constants";
import { htmlToText, sanitizeHtml } from "@/lib/sanitize";
import {
  createTag,
  createTransmission,
  fetchTags,
  syncTags,
  updateTransmission,
  type Category,
  type TagType,
  type Transmission,
} from "@/lib/api";
import { uploadTransmissionImage } from "@/lib/images.functions";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(RULES.titleMin, { message: "Titre trop court (3 caractères minimum)." })
    .max(RULES.titleMax, { message: "Titre trop long (100 caractères maximum)." }),
  contentText: z
    .string()
    .trim()
    .min(RULES.contentMin, { message: "Contenu trop court (10 caractères minimum)." }),
  categoryId: z.string().uuid({ message: "Choisissez une catégorie." }),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  authorId: string;
  editing: Transmission | null;
};

export function TransmissionForm({
  open,
  onOpenChange,
  categories,
  authorId,
  editing,
}: Props) {
  const queryClient = useQueryClient();
  const upload = useServerFn(uploadTransmissionImage);
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"libre" | "essentiel">("libre");
  const [priority, setPriority] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [newTagType, setNewTagType] = useState<TagType>("libre");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setHtml(editing?.content_html ?? "");
    setCategoryId(editing?.category_id ?? categories[0]?.id ?? "");
    setType(editing?.type ?? "libre");
    setPriority(editing?.is_priority ?? false);
    setTagIds(editing?.tags.map((t) => t.id) ?? []);
    setFiles([]);
    setTagSearch("");
    setProgress(null);
  }, [open, editing, categories]);

  const selectedTags = useMemo(() => tags.filter((t) => tagIds.includes(t.id)), [tags, tagIds]);
  const suggestions = useMemo(() => {
    const term = tagSearch.trim().toLowerCase();
    if (!term) return [];
    return tags
      .filter((t) => t.label.toLowerCase().includes(term) && !tagIds.includes(t.id))
      .slice(0, 6);
  }, [tags, tagSearch, tagIds]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const existing = editing?.images.length ?? 0;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (!file.type.startsWith("image/")) {
        toast.error("Seules les images sont acceptées.");
        continue;
      }
      if (file.size > RULES.maxImageBytes) {
        toast.error(`« ${file.name} » dépasse 5 Mo.`);
        continue;
      }
      if (existing + next.length >= RULES.maxImages) {
        toast.error("3 images maximum par transmission.");
        break;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
      reader.readAsDataURL(file);
    });

  const save = useMutation({
    mutationFn: async () => {
      const cleanHtml = sanitizeHtml(html);
      const contentText = htmlToText(cleanHtml);
      const parsed = schema.safeParse({ title, contentText, categoryId });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Formulaire incomplet.");
      }

      const payload = {
        title: parsed.data.title,
        content_html: cleanHtml,
        content_text: contentText,
        type,
        is_priority: priority,
        category_id: categoryId,
      };

      let id = editing?.id;
      if (id) {
        await updateTransmission(id, payload);
      } else {
        const created = await createTransmission(payload, authorId);
        id = created.id;
      }

      await syncTags(id, tagIds);

      if (files.length > 0) {
        const offset = editing?.images.length ?? 0;
        for (let i = 0; i < files.length; i += 1) {
          const file = files[i]!;
          setProgress(Math.round((i / files.length) * 100));
          await upload({
            data: {
              transmissionId: id,
              fileName: file.name,
              contentType: file.type,
              base64: await toBase64(file),
              position: offset + i + 1,
            },
          });
        }
        setProgress(100);
      }
    },
    onSuccess: async () => {
      toast.success(editing ? "Transmission mise à jour." : "Transmission publiée.");
      await queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addTag = useMutation({
    mutationFn: async (label: string) => createTag(label, newTagType),
    onSuccess: async (tag) => {
      setTagIds((prev) => [...prev, tag.id].slice(0, RULES.maxTags));
      setTagSearch("");
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="module-banner space-y-0 px-4 py-3 text-left">
          <DialogTitle className="text-base">
            {editing ? "Modifier la transmission" : "Nouvelle transmission"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              maxLength={RULES.titleMax}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Panne du moteur de scie salle 3"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Contenu</Label>
            <RichTextEditor value={html} onChange={setHtml} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger aria-label="Catégorie">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "libre" | "essentiel")}>
                <SelectTrigger aria-label="Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="essentiel">Essentiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="module-panel flex items-center justify-between p-3">
            <Label htmlFor="priority" className="flex items-center gap-2">
              <i className="bi bi-fire text-destructive" aria-hidden="true" />
              Marquer comme prioritaire
            </Label>
            <Switch id="priority" checked={priority} onCheckedChange={setPriority} />
          </div>

          <div className="space-y-2">
            <Label>Images (3 maximum, 5 Mo par image)</Label>
            {editing && editing.images.length > 0 ? <ImagesGrid images={editing.images} /> : null}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center"
            >
              <i className="bi bi-cloud-arrow-up text-2xl text-muted-foreground" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Glissez vos photos ici</p>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                Choisir des images
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
            {files.length > 0 ? (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-destructive"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {progress !== null ? <Progress value={progress} /> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Mots-clés (5 maximum)</Label>
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setTagIds(tagIds.filter((id) => id !== tag.id))}
                    aria-label={`Retirer ${tag.label}`}
                  >
                    <TagChip tag={tag} />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagSearch}
                maxLength={40}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Rechercher ou créer un mot-clé"
              />
              <Select value={newTagType} onValueChange={(v) => setNewTagType(v as TagType)}>
                <SelectTrigger className="w-36" aria-label="Type de mot-clé">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TAG_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setTagIds((prev) => [...prev, tag.id].slice(0, RULES.maxTags))}
                  >
                    <TagChip tag={tag} />
                  </button>
                ))}
              </div>
            ) : null}
            {tagSearch.trim().length > 1 &&
            !tags.some((t) => t.label.toLowerCase() === tagSearch.trim().toLowerCase()) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag.mutate(tagSearch)}
                disabled={tagIds.length >= RULES.maxTags}
              >
                <i className="bi bi-plus-lg mr-2" aria-hidden="true" />
                Créer « {tagSearch.trim()} »
              </Button>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Envoi…" : editing ? "Enregistrer" : "Publier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
