import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileText, ExternalLink } from "lucide-react";
import { LineReveal, FadeUp } from "@/components/Reveal";
import { api, imgSrc, waLink } from "@/lib/api";
import { useContent } from "@/hooks/useContent";

const Chip = ({ children }) => (
  <span className="border border-white/15 text-zinc-300 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
    {children}
  </span>
);

const ProjectCard = ({ p, index, onOpen }) => (
  <FadeUp delay={(index % 3) * 0.08}>
    <button
      data-testid={`scenario-card-${p.id}`}
      onClick={onOpen}
      className="group relative block w-full text-left overflow-hidden border border-white/5 bg-coal hover:border-gold/50 transition-colors duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={imgSrc(p.poster)}
          alt={p.title}
          loading="lazy"
          className="w-full h-full object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {p.genre && <Chip>{p.genre}</Chip>}
            {p.format && <Chip>{p.format}</Chip>}
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-white leading-tight">{p.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gold" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">{p.status}</span>
          </div>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed line-clamp-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            {p.pitch}
          </p>
        </div>
      </div>
    </button>
  </FadeUp>
);

const ProjectModal = ({ p, whatsapp, onClose }) => {
  useEffect(() => {
    window.__lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.__lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      data-testid="scenario-modal"
      className="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        data-lenis-prevent
        className="relative w-full max-w-5xl max-h-[88vh] overflow-y-auto bg-coal border border-white/10 grid md:grid-cols-[2fr_3fr]"
      >
        <button
          data-testid="scenario-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 border border-white/15 text-white p-2 hover:border-gold hover:text-gold transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
        <div className="relative min-h-[240px]">
          <img src={imgSrc(p.poster)} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-coal/60 hidden md:block" />
        </div>
        <div className="p-8 lg:p-10">
          <div className="flex flex-wrap gap-2 mb-5">
            {p.genre && <Chip>{p.genre}</Chip>}
            {p.format && <Chip>{p.format}</Chip>}
            {p.status && (
              <span className="border border-gold/50 text-gold px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
                {p.status}
              </span>
            )}
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl text-white leading-tight">{p.title}</h3>
          {p.pitch && (
            <p data-testid="scenario-modal-pitch" className="mt-6 font-serif italic text-xl text-gold leading-relaxed">
              &laquo;&nbsp;{p.pitch}&nbsp;&raquo;
            </p>
          )}
          {p.synopsis && (
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-3">Synopsis</p>
              <p data-testid="scenario-modal-synopsis" className="text-zinc-300 leading-relaxed text-[15px]">
                {p.synopsis}
              </p>
            </div>
          )}
          {p.note_intention && (
            <blockquote className="mt-6 border-l-2 border-gold pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2">Note d&rsquo;intention</p>
              <p className="text-zinc-400 italic leading-relaxed text-[15px]">{p.note_intention}</p>
            </blockquote>
          )}
          {(p.images || []).length > 0 && (
            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-3">Moodboard</p>
              <div className="grid grid-cols-3 gap-2">
                {p.images.map((img, i) => (
                  <img
                    key={i}
                    src={imgSrc(img)}
                    alt=""
                    loading="lazy"
                    data-testid={`scenario-moodboard-${i}`}
                    className="w-full aspect-square object-cover border border-white/5"
                  />
                ))}
              </div>
            </div>
          )}
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              data-testid="scenario-treatment-button"
              href={waLink(whatsapp, `Bonjour, je souhaite lire le traitement de « ${p.title} ».`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gold text-black px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:bg-gold-light transition-colors"
            >
              <FileText size={15} /> Lire le traitement
            </a>
            {p.treatment_pdf && (
              <a
                data-testid="scenario-pdf-button"
                href={imgSrc(p.treatment_pdf)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 border border-white/20 text-white px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:border-gold hover:text-gold transition-colors"
              >
                <ExternalLink size={15} /> Voir le PDF
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Scenarios() {
  const [projects, setProjects] = useState(null);
  const [active, setActive] = useState(null);
  const content = useContent();

  useEffect(() => {
    api
      .get("/scenarios")
      .then((r) => setProjects(r.data))
      .catch(() => setProjects([]));
  }, []);

  return (
    <main data-testid="scenarios-page" className="bg-ink min-h-screen">
      <header className="pt-36 lg:pt-44 pb-14 lg:pb-20 px-6 lg:px-12 max-w-screen-2xl mx-auto">
        <FadeUp>
          <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
            &Eacute;criture &mdash; Projets disponibles
          </span>
        </FadeUp>
        <h1 className="mt-6 font-serif text-6xl sm:text-7xl lg:text-8xl leading-[0.92] tracking-tight">
          <LineReveal delay={0.15}>Mes</LineReveal>
          <LineReveal delay={0.28} className="italic text-gold">
            sc&eacute;narios
          </LineReveal>
        </h1>
        <FadeUp delay={0.3}>
          <p className="mt-8 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            Longs m&eacute;trages, s&eacute;ries et courts m&eacute;trages enracin&eacute;s dans le Kivu et Kinshasa.
            Chaque projet est pr&ecirc;t &agrave; &ecirc;tre lu &mdash; le traitement vous attend sur WhatsApp.
          </p>
        </FadeUp>
      </header>

      <section className="max-w-screen-2xl mx-auto px-6 lg:px-12 pb-32">
        {!projects ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] bg-coal border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p data-testid="scenarios-empty" className="text-zinc-500 text-center py-24 font-mono text-sm uppercase tracking-[0.25em]">
            Aucun projet pour le moment
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} p={p} index={i} onOpen={() => setActive(p)} />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {active && (
          <ProjectModal p={active} whatsapp={content?.links?.whatsapp} onClose={() => setActive(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}
