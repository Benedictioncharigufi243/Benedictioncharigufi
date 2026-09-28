import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { streamPost } from "@/lib/api";
import { useContent } from "@/hooks/useContent";

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const content = useContent();
  const bottomRef = useRef(null);
  const sessionRef = useRef(null);

  if (!sessionRef.current && typeof window !== "undefined") {
    let id = localStorage.getItem("eb_chat_session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("eb_chat_session", id);
    }
    sessionRef.current = id;
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Bonjour ! Je suis l'assistant de ${content?.name || "l'artiste"}. Une question sur son profil d'acteur ou ses scénarios ?`,
        },
      ]);
    }
  }, [open, content, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      await streamPost("/chat", { session_id: sessionRef.current, message: text }, (full) => {
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: full };
          return c;
        });
      });
    } catch {
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = {
          role: "assistant",
          content: "Désolé, l'assistant est momentanément indisponible. Contactez-nous directement sur WhatsApp.",
        };
        return c;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        data-testid="chat-widget-button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Assistant"
        className="fixed bottom-6 right-6 z-[65] w-14 h-14 bg-gold text-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:bg-gold-light transition-colors"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-[65] w-[calc(100vw-3rem)] max-w-sm h-[60vh] max-h-[520px] bg-coal border border-white/10 flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <span className="w-2 h-2 bg-gold animate-pulse" aria-hidden />
              <div>
                <p className="font-serif text-lg leading-none">Assistant</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500 mt-1">
                  Casting &amp; scénarios
                </p>
              </div>
            </div>
            <div data-lenis-prevent className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span
                    data-testid={`chat-message-${i}`}
                    className={`inline-block max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-gold text-black"
                        : "bg-smoke text-zinc-200 border border-white/5"
                    }`}
                  >
                    {m.content || (busy && i === messages.length - 1 ? "…" : "")}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Votre question…"
                className="flex-1 bg-smoke border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-gold/60 outline-none transition-colors"
              />
              <button
                data-testid="chat-send-button"
                onClick={send}
                disabled={busy}
                aria-label="Envoyer"
                className="bg-gold text-black px-4 flex items-center justify-center hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
