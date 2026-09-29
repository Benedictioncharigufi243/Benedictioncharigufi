import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { TextInput, TextArea, ImageField, PdfField } from "./Fields";
import { AiButton } from "./AiButton";

const EMPTY = {
  title: "",
  genre: "",
  format: "",
  status: "",
  pitch: "",
  synopsis: "",
  note_intention: "",
  poster: "",
  images: [],
  treatment_pdf: "",
  order: 99,
};

export const ScenarioForm = ({ initial, onSaved, onCancel }) => {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setImage = (i) => (v) =>
    setForm((f) => {
      const imgs = [...(f.images || [])];
      imgs[i] = v;
      return { ...f, images: imgs };
    });

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setSaving(true);
    try {
      if (form.id) await api.put(`/scenarios/${form.id}`, form);
      else await api.post("/scenarios", form);
      toast.success("Scénario enregistré");
      onSaved();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gold/30 bg-coal p-6 lg:p-8 space-y-6" data-testid="scenario-form">
      <div className="grid md:grid-cols-2 gap-6">
        <TextInput label="Titre" value={form.title} onChange={set("title")} testId="scenario-form-title" />
        <TextInput label="Genre" value={form.genre} onChange={set("genre")} testId="scenario-form-genre" placeholder="Drame, thriller…" />
        <TextInput label="Format" value={form.format} onChange={set("format")} testId="scenario-form-format" placeholder="Long métrage · 90 min" />
        <TextInput label="Statut" value={form.status} onChange={set("status")} testId="scenario-form-status" placeholder="En écriture, pitch prêt…" />
      </div>
      <div>
        <TextArea label="Pitch (logline)" value={form.pitch} onChange={set("pitch")} rows={2} testId="scenario-form-pitch" />
        <AiButton field="pitch" title={form.title} getText={() => form.pitch} onResult={set("pitch")} testId="scenario-form-pitch-ai" />
      </div>
      <div>
        <TextArea label="Synopsis (5-8 lignes)" value={form.synopsis} onChange={set("synopsis")} rows={6} testId="scenario-form-synopsis" />
        <AiButton field="synopsis" title={form.title} getText={() => form.synopsis} onResult={set("synopsis")} testId="scenario-form-synopsis-ai" />
      </div>
      <div>
        <TextArea label="Note d'intention" value={form.note_intention} onChange={set("note_intention")} rows={3} testId="scenario-form-note" />
        <AiButton field="note d'intention" title={form.title} getText={() => form.note_intention} onResult={set("note_intention")} testId="scenario-form-note-ai" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <ImageField label="Affiche / poster" value={form.poster} onChange={set("poster")} testId="scenario-form-poster" />
        <PdfField label="Traitement (PDF)" value={form.treatment_pdf} onChange={set("treatment_pdf")} testId="scenario-form-pdf-upload" />
      </div>
      <div>
        <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-3">
          Moodboard &mdash; images associées
        </span>
        <div className="space-y-4">
          {(form.images || []).map((img, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-1">
                <ImageField label={`Image ${i + 1}`} value={img} onChange={setImage(i)} testId={`scenario-form-image-${i}`} />
              </div>
              <button
                type="button"
                data-testid={`scenario-form-image-remove-${i}`}
                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                className="mt-7 text-zinc-500 hover:text-red-400 transition-colors"
                aria-label="Retirer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            data-testid="scenario-form-add-image"
            onClick={() => setForm((f) => ({ ...f, images: [...(f.images || []), ""] }))}
            className="inline-flex items-center gap-2 border border-white/15 text-zinc-300 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-gold hover:text-gold transition-colors"
          >
            <Plus size={13} /> Ajouter une image
          </button>
        </div>
      </div>
      <div className="flex gap-4 pt-2">
        <button
          data-testid="scenario-form-save"
          onClick={save}
          disabled={saving}
          className="bg-gold text-black px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          data-testid="scenario-form-cancel"
          onClick={onCancel}
          className="border border-white/15 text-zinc-300 px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] hover:border-gold hover:text-gold transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};
