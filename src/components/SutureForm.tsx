import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FAMILY_LABELS,
  STATUT_ACTIF,
  STATUT_LABELS,
  STATUT_RETIRE,
  SUTURE_FAMILIES,
  cleanField,
  type Suture,
  type SutureInput,
} from "@/lib/sutures-api";

type FormValues = Record<keyof SutureInput, string>;

const EMPTY: FormValues = {
  marque: "",
  calibre: "",
  famille: "",
  composition: "",
  reference: "",
  type_aiguille: "",
  longueur: "",
  couleur: "",
  usage_notes: "",
  note_qualite: "",
  statut: STATUT_ACTIF,
};

function toValues(suture?: Suture | null): FormValues {
  if (!suture) return EMPTY;
  return {
    marque: suture.marque ?? "",
    calibre: suture.calibre ?? "",
    famille: suture.famille ?? "",
    composition: suture.composition ?? "",
    reference: suture.reference ?? "",
    type_aiguille: suture.type_aiguille ?? "",
    longueur: suture.longueur ?? "",
    couleur: suture.couleur ?? "",
    usage_notes: suture.usage_notes ?? "",
    note_qualite: suture.note_qualite ?? "",
    statut: suture.statut ?? STATUT_ACTIF,
  };
}

/** Le calibre est gardé tel que saisi : seuls les espaces de bord sont retirés. */
function toInput(values: FormValues): SutureInput {
  return {
    marque: values.marque.trim(),
    calibre: cleanField(values.calibre),
    famille: cleanField(values.famille),
    composition: cleanField(values.composition),
    reference: cleanField(values.reference),
    type_aiguille: cleanField(values.type_aiguille),
    longueur: cleanField(values.longueur),
    couleur: cleanField(values.couleur),
    usage_notes: cleanField(values.usage_notes),
    note_qualite: cleanField(values.note_qualite),
    statut: values.statut || STATUT_ACTIF,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fil à modifier. Absent = création. */
  suture?: Suture | null;
  loading?: boolean;
  onSubmit: (input: SutureInput) => void;
};

const TEXT_FIELDS: { key: keyof SutureInput; label: string; placeholder?: string }[] = [
  { key: "composition", label: "Composition" },
  { key: "reference", label: "Référence" },
  { key: "type_aiguille", label: "Type d'aiguille", placeholder: "Ex. Aiguille 1/2 26mm TR" },
  { key: "longueur", label: "Longueur", placeholder: "Ex. 75 cm" },
  { key: "couleur", label: "Couleur" },
];

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SutureForm({ open, onOpenChange, suture, loading, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>(() => toValues(suture));
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(suture);

  useEffect(() => {
    if (open) {
      setValues(toValues(suture));
      setError(null);
    }
  }, [open, suture]);

  function set(key: keyof SutureInput, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values.marque.trim()) {
      setError("La marque est obligatoire.");
      return;
    }
    onSubmit(toInput(values));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le fil" : "Ajouter un fil"}</DialogTitle>
          <DialogDescription>
            Le calibre est enregistré exactement comme saisi : « 2 » et « 2/0 » sont deux fils
            différents.
          </DialogDescription>
        </DialogHeader>

        <form id="suture-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="suture-marque">Marque *</Label>
            <Input
              id="suture-marque"
              value={values.marque}
              onChange={(e) => set("marque", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suture-calibre">Calibre</Label>
            <Input
              id="suture-calibre"
              value={values.calibre}
              onChange={(e) => set("calibre", e.target.value)}
              placeholder="Ex. 2/0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suture-famille">Famille</Label>
            <select
              id="suture-famille"
              className={selectClass}
              value={values.famille}
              onChange={(e) => set("famille", e.target.value)}
            >
              <option value="">Non renseignée</option>
              {SUTURE_FAMILIES.map((family) => (
                <option key={family} value={family}>
                  {FAMILY_LABELS[family]}
                </option>
              ))}
            </select>
          </div>

          {TEXT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`suture-${field.key}`}>{field.label}</Label>
              <Input
                id={`suture-${field.key}`}
                value={values[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="suture-usage">Notes d'usage</Label>
            <Textarea
              id="suture-usage"
              value={values.usage_notes}
              onChange={(e) => set("usage_notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suture-vigilance">Point de vigilance</Label>
            <Textarea
              id="suture-vigilance"
              value={values.note_qualite}
              onChange={(e) => set("note_qualite", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suture-statut">Statut</Label>
            <select
              id="suture-statut"
              className={selectClass}
              value={values.statut}
              onChange={(e) => set("statut", e.target.value)}
            >
              <option value={STATUT_ACTIF}>{STATUT_LABELS[STATUT_ACTIF]}</option>
              <option value={STATUT_RETIRE}>{STATUT_LABELS[STATUT_RETIRE]}</option>
            </select>
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </form>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="suture-form" disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
