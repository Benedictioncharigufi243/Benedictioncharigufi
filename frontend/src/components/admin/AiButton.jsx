import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { streamPost } from "@/lib/api";

export const AiButton = ({ field, getText, title, onResult, testId }) => {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await streamPost("/ai/improve", { field, text: getText(), title }, (full) => onResult(full));
      toast.success("Texte retravaillé par l'IA — vérifiez avant d'enregistrer");
    } catch (e) {
      toast.error(e.message || "L'assistant IA est indisponible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={run}
      disabled={busy}
      className="mt-2 inline-flex items-center gap-2 border border-gold/50 text-gold px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-gold hover:text-black transition-colors disabled:opacity-50"
    >
      <Sparkles size={13} />
      {busy ? "L'IA écrit…" : "Améliorer avec l'IA"}
    </button>
  );
};
