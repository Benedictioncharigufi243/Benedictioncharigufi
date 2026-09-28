import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LineReveal, FadeUp, PageLoader } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { useContent } from "@/hooks/useContent";
import { imgSrc } from "@/lib/api";

const Panel = ({ title, sub, cta, to, image, delay, testId, parallax = 90 }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, parallax]);
  return (
    <Link
      to={to}
      data-testid={testId}
      className="group relative flex-1 hover:flex-[1.4] transition-[flex] duration-700 ease-out overflow-hidden min-h-[50svh] block"
    >
      <motion.img
        src={imgSrc(image)}
        alt={title}
        style={{ y }}
        initial={{ scale: 1.18 }}
        animate={{ scale: 1.1 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 brightness-[0.45] group-hover:brightness-[0.6] transition-[filter] duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
      <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-14">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.8 }}
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold mb-4"
        >
          {sub}
        </motion.span>
        <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight text-white">
          <LineReveal delay={delay}>{title}</LineReveal>
        </h2>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.5, duration: 0.8 }}
          className="mt-8 inline-flex w-fit items-center gap-3 border border-gold/70 text-gold px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] group-hover:bg-gold group-hover:text-black transition-colors duration-300"
        >
          {cta} <ArrowRight size={14} />
        </motion.span>
      </div>
    </Link>
  );
};

export default function Home() {
  const content = useContent();
  if (!content) return <PageLoader />;

  return (
    <main data-testid="home-page" className="bg-ink">
      <section className="relative h-[100svh] flex flex-col lg:flex-row">
        <div className="pointer-events-none absolute inset-x-0 top-20 lg:top-24 z-20 text-center">
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ delay: 0.2, duration: 1.2 }}
            className="font-mono text-[11px] uppercase text-zinc-300 drop-shadow"
          >
            Je suis
          </motion.p>
        </div>
        <Panel
          title="Acteur"
          sub="Devant la caméra"
          cta="Voir mon book acting"
          to="/acting"
          image={content.hero_actor_image}
          delay={0.35}
          testId="home-acting-entry"
        />
        <div className="hidden lg:block w-px bg-gold/30 relative z-10" />
        <Panel
          title="Scénariste"
          sub="Derrière les mots"
          cta="Voir mes scénarios"
          to="/scenarios"
          image={content.hero_scenario_image}
          delay={0.5}
          testId="home-scenarios-entry"
          parallax={150}
        />
      </section>

      <Marquee
        items={[
          "Acteur",
          "Scénariste",
          "Goma",
          "Kinshasa",
          "Lingala",
          "Swahili",
          "Français",
          "Anglais",
          "Boxe",
          "Combat scénique",
        ]}
      />

      <section className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-28 lg:py-40 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <FadeUp>
            <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight">
              Deux m&eacute;tiers.
              <br />
              <em className="text-gold">Une m&ecirc;me voix.</em>
            </h2>
          </FadeUp>
        </div>
        <div className="lg:col-span-7 space-y-6">
          <FadeUp delay={0.1}>
            <p className="text-lg text-zinc-300 leading-relaxed">{content.intro}</p>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="text-zinc-500 leading-relaxed">{content.bio}</p>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
