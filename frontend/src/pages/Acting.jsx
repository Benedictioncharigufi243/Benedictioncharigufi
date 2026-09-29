import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageCircle, Mail, Instagram, Film, Download } from "lucide-react";
import { LineReveal, FadeUp, PageLoader } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { useContent } from "@/hooks/useContent";
import { imgSrc, youtubeEmbed, waLink } from "@/lib/api";

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-");

const Corner = ({ className }) => (
  <span className={`absolute w-5 h-5 border-gold ${className}`} aria-hidden />
);

export default function Acting() {
  const content = useContent();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 110]);

  if (!content) return <PageLoader />;

  const [first, ...rest] = (content.name || "").split(" ");
  const specs = content.specs || {};
  const links = content.links || {};
  const skills = (specs["Skills"] || []).map(([k]) => k);
  const languages = (specs["Langues"] || []).map(([k]) => k);
  const gallery = content.gallery || [];

  return (
    <main data-testid="acting-page" className="bg-ink">
      {/* HERO */}
      <section ref={heroRef} className="relative pt-28 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-7">
            <FadeUp>
              <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
                Book Acting &mdash; {content.location_line}
              </span>
            </FadeUp>
            <h1 className="mt-6 font-serif text-6xl sm:text-7xl lg:text-8xl leading-[0.92] tracking-tight">
              <LineReveal delay={0.15}>{first}</LineReveal>
              <LineReveal delay={0.28} className="italic text-gold">
                {rest.join(" ")}
              </LineReveal>
            </h1>
            <FadeUp delay={0.25}>
              <p className="mt-8 max-w-xl text-lg text-zinc-400 leading-relaxed">{content.intro}</p>
            </FadeUp>
            <FadeUp delay={0.35}>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  data-testid="acting-hero-whatsapp-button"
                  href={waLink(links.whatsapp, "Bonjour, je vous contacte pour un projet de casting.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gold text-black px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:bg-gold-light transition-colors"
                >
                  <MessageCircle size={15} /> Me contacter
                </a>
                <a
                  data-testid="acting-hero-reel-link"
                  href="#bande-demo"
                  className="inline-flex items-center gap-3 border border-white/20 text-white px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:border-gold hover:text-gold transition-colors"
                >
                  <Film size={15} /> Voir la bande d&eacute;mo
                </a>
              </div>
            </FadeUp>
          </div>
          <div className="lg:col-span-5">
            <FadeUp delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 border border-gold/40 translate-x-5 translate-y-5" aria-hidden />
                <div className="relative overflow-hidden">
                  <motion.img
                    src={imgSrc(content.portrait_main)}
                    alt={`Portrait de ${content.name}`}
                    style={{ y: imgY }}
                    data-testid="acting-main-portrait"
                    className="w-full aspect-[4/5] object-cover scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* DEMO REEL */}
      <section id="bande-demo" className="py-20 lg:py-28 scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <FadeUp>
            <div className="flex items-end justify-between gap-6 mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">Bande d&eacute;mo</h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">90 secondes</span>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div data-testid="acting-demo-reel" className="relative border border-white/10 p-2 bg-coal">
              <Corner className="top-0 left-0 border-t-2 border-l-2 -translate-x-px -translate-y-px" />
              <Corner className="top-0 right-0 border-t-2 border-r-2 translate-x-px -translate-y-px" />
              <Corner className="bottom-0 left-0 border-b-2 border-l-2 -translate-x-px translate-y-px" />
              <Corner className="bottom-0 right-0 border-b-2 border-r-2 translate-x-px translate-y-px" />
              <div className="aspect-video">
                <iframe
                  src={youtubeEmbed(content.demo_reel_url)}
                  title="Bande d&eacute;mo"
                  className="w-full h-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-20 lg:py-28">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <FadeUp>
            <div className="flex items-end justify-between gap-6 mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">Galerie</h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                Portraits &amp; personnages
              </span>
            </div>
          </FadeUp>
          <div data-testid="acting-gallery" className="grid grid-cols-12 gap-4">
            {gallery.map((g, i) => (
              <FadeUp
                key={i}
                delay={i * 0.06}
                className={
                  i === 0
                    ? "col-span-12 md:col-span-8"
                    : i === 1
                      ? "col-span-12 md:col-span-4"
                      : "col-span-6"
                }
              >
                <figure className="group relative overflow-hidden border border-white/5 bg-coal">
                  <img
                    src={imgSrc(g.url)}
                    alt={g.label}
                    loading="lazy"
                    data-testid={`acting-gallery-image-${i}`}
                    className={`w-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ${
                      i < 2 ? "aspect-[16/10]" : "aspect-[3/4]"
                    }`}
                  />
                  <figcaption className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-300">
                    {g.label}
                  </figcaption>
                </figure>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FICHE TECHNIQUE */}
      <section className="py-20 lg:py-28 border-t border-white/5">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <FadeUp>
            <div className="flex items-end justify-between gap-6 mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">Fiche technique</h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">20 secondes suffisent</span>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-14">
            {Object.entries(specs).map(([group, rows]) => (
              <FadeUp key={group}>
                <div data-testid={`spec-group-${slug(group)}`}>
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold mb-5">{group}</h3>
                  <dl>
                    {(rows || []).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-6 py-2.5 border-b border-white/5">
                        <dt className="text-sm text-zinc-500">{k}</dt>
                        <dd className="text-sm text-white text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={[...skills, ...languages]} />

      {/* CONTACT */}
      <section id="contact" className="py-28 lg:py-40 text-center scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6">
          <FadeUp>
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold">Disponible pour castings</span>
            <h2 className="mt-6 font-serif text-5xl sm:text-6xl leading-[1.02] tracking-tight">
              Un r&ocirc;le ? <em className="text-gold">Parlons-en.</em>
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <a
                data-testid="contact-whatsapp-button"
                href={waLink(links.whatsapp, "Bonjour, je vous contacte pour un projet de casting.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gold text-black px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:bg-gold-light transition-colors"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
              <a
                data-testid="contact-email-button"
                href={`mailto:${links.email || ""}`}
                className="inline-flex items-center gap-3 border border-white/20 text-white px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:border-gold hover:text-gold transition-colors"
              >
                <Mail size={15} /> Email
              </a>
              <a
                data-testid="contact-instagram-button"
                href={links.instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 border border-white/20 text-white px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:border-gold hover:text-gold transition-colors"
              >
                <Instagram size={15} /> Instagram
              </a>
              <a
                data-testid="contact-imdb-button"
                href={links.imdb || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 border border-white/20 text-white px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:border-gold hover:text-gold transition-colors"
              >
                <Film size={15} /> IMDb
              </a>
              {content.cv_pdf && (
                <a
                  data-testid="cv-download-button"
                  href={imgSrc(content.cv_pdf)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 border border-gold/60 text-gold px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] hover:bg-gold hover:text-black transition-colors"
                >
                  <Download size={15} /> T&eacute;l&eacute;charger mon CV
                </a>
              )}
            </div>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
