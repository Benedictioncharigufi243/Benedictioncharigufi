import { useState } from "react";
import { toast } from "sonner";
import { api, imgSrc } from "@/lib/api";

const INPUT =
  "w-full bg-smoke border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-gold/60 outline-none transition-colors";

export const Field = ({ label, children }) => (
  <div className="block">
    <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">{label}</span>
    {children}
  </div>
);

export const TextInput = ({ label, value, onChange, testId, placeholder }) => (
  <Field label={label}>
    <input
      data-testid={testId}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT}
    />
  </Field>
);

export const TextArea = ({ label, value, onChange, rows = 4, testId, hint }) => (
  <Field label={label}>
    <textarea
      data-testid={testId}
      value={value || ""}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`${INPUT} resize-y leading-relaxed`}
    />
    {hint && <p className="mt-1.5 text-xs text-zinc-600">{hint}</p>}
  </Field>
);

export const UploadButton = ({ accept, onUploaded, label = "Téléverser", testId }) => {
  const [busy, setBusy] = useState(false);
  return (
    <label
      data-testid={testId}
      className={`inline-flex cursor-pointer items-center border border-gold/60 text-gold px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-gold hover:text-black transition-colors ${
        busy ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append("file", f);
            const { data } = await api.post("/upload", fd);
            onUploaded(data.path);
            toast.success("Fichier téléversé");
          } catch {
            toast.error("Échec de l'envoi du fichier");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy ? "Envoi…" : label}
    </label>
  );
};

export const ImageField = ({ label, value, onChange, testId }) => (
  <Field label={label}>
    <div className="flex items-start gap-4">
      {value ? (
        <img src={imgSrc(value)} alt="" className="w-20 h-20 object-cover border border-white/10 shrink-0" />
      ) : (
        <div className="w-20 h-20 border border-dashed border-white/15 shrink-0" />
      )}
      <div className="flex-1 space-y-2">
        <input
          data-testid={testId}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL d'image ou fichier téléversé"
          className={`${INPUT} text-xs`}
        />
        <UploadButton accept="image/*" onUploaded={onChange} label="Téléverser une image" testId={`${testId}-upload`} />
      </div>
    </div>
  </Field>
);

export const PdfField = ({ label, value, onChange, testId }) => (
  <Field label={label}>
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-xs text-zinc-500 truncate max-w-[220px]">{value || "Aucun fichier"}</span>
      <UploadButton accept="application/pdf" onUploaded={onChange} label="Téléverser le PDF" testId={testId} />
      {value && (
        <button type="button" onClick={() => onChange("")} className="text-xs text-red-400 underline">
          Retirer
        </button>
      )}
    </div>
  </Field>
);
