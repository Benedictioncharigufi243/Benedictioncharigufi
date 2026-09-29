import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TextInput, TextArea, ImageField, PdfField } from "./Fields";
import { AiButton } from "./AiButton";

const SPEC_GROUPS = ["Mensurations", "Apparence", "Langues", "Accents", "Skills", "Mobilité"];

const specsToText = (rows) => (rows || []).map(([k, v]) => `${k}: ${v}`).join("\n");
const textToSpecs = (t) =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i === -1 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    });

export const ActingForm = ({ content }) => {
  const [form, setForm] = useState(content);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setLink = (k) => (v) => setForm((f) => ({ ...f, links: { ...(f.links || {}), [k]: v } }));
  const setGallery = (i, key) => (v) =>
    setForm((f) => {
      const g = [...(f.gallery || [])];
      g[i] = { ...g[i], [key]: v };
      return { ...f, gallery: g };
    });
  const setSpec = (group) => (v) => setForm((f) => ({ ...f, specs: { ...(f.specs || {}), [group]: textToSpecs(v) } }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/content", { data: form });
      toast.success("Contenu enregistré");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h3 className="font-serif text-2xl text-white mb-6">Identité</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <TextInput label="Nom complet" value={form.name} onChange={set("name")} testId="admin-name-input" />
          <TextInput label="Ligne de rôle" value={form.role_line} onChange={set("role_line")} testId="admin-role-input" />
          <TextInput label="Localisation" value={form.location_line} onChange={set("location_line")} testId="admin-location-input" />
          <TextInput
            label="Bande démo (URL YouTube non répertoriée)"
            value={form.demo_reel_url}
            onChange={set("demo_reel_url")}
            testId="admin-reel-input"
          />
        </div>
        <div className="mt-6 space-y-6">
          <div>
            <TextArea label="Texte d'introduction" value={form.intro} onChange={set("intro")} testId="admin-intro-input" />
            <AiButton field="introduction" title={form.name} getText={() => form.intro} onResult={set("intro")} testId="admin-intro-ai" />
          </div>
          <div>
            <TextArea label="Bio" value={form.bio} onChange={set("bio")} rows={5} testId="admin-bio-input" />
            <AiButton field="biographie" title={form.name} getText={() => form.bio} onResult={set("bio")} testId="admin-bio-ai" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-2xl text-white mb-6">Images</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ImageField label="Accueil — côté acteur" value={form.hero_actor_image} onChange={set("hero_actor_image")} testId="admin-hero-actor" />
          <ImageField label="Accueil — côté scénariste" value={form.hero_scenario_image} onChange={set("hero_scenario_image")} testId="admin-hero-scenario" />
          <ImageField label="Portrait principal" value={form.portrait_main} onChange={set("portrait_main")} testId="admin-portrait" />
          <PdfField label="CV (PDF téléchargeable)" value={form.cv_pdf} onChange={set("cv_pdf")} testId="admin-cv-upload" />
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {(form.gallery || []).map((g, i) => (
            <div key={i} className="border border-white/10 p-4 space-y-4">
              <TextInput label={`Galerie ${i + 1} — étiquette`} value={g.label} onChange={setGallery(i, "label")} testId={`admin-gallery-label-${i}`} />
              <ImageField label={`Galerie ${i + 1} — photo`} value={g.url} onChange={setGallery(i, "url")} testId={`admin-gallery-url-${i}`} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-serif text-2xl text-white mb-2">Fiche technique</h3>
        <p className="text-xs text-zinc-600 mb-6">Une ligne par caractéristique, au format « Label: Valeur ».</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPEC_GROUPS.map((group) => (
            <TextArea
              key={group}
              label={group}
              rows={6}
              value={specsToText(form.specs?.[group])}
              onChange={setSpec(group)}
              testId={`admin-spec-${group.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}`}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-serif text-2xl text-white mb-6">Contact &amp; liens</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <TextInput label="WhatsApp (format international, ex : 243990604665)" value={form.links?.whatsapp} onChange={setLink("whatsapp")} testId="admin-whatsapp-input" />
          <TextInput label="Email" value={form.links?.email} onChange={setLink("email")} testId="admin-email-input" />
          <TextInput label="Instagram (URL)" value={form.links?.instagram} onChange={setLink("instagram")} testId="admin-instagram-input" />
          <TextInput label="IMDb (URL)" value={form.links?.imdb} onChange={setLink("imdb")} testId="admin-imdb-input" />
        </div>
      </section>

      <button
        data-testid="admin-save-content"
        onClick={save}
        disabled={saving}
        className="bg-gold text-black px-10 py-3.5 font-mono text-xs uppercase tracking-[0.25em] hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </div>
  );
};
