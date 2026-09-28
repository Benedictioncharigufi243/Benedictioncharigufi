import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export const LineReveal = ({ children, className = "", delay = 0 }) => (
  <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
    <motion.span
      className={`block ${className}`}
      initial={{ y: "115%" }}
      animate={{ y: 0 }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export const FadeUp = ({ children, className = "", delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.9, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export const PageLoader = () => (
  <div className="min-h-[100svh] bg-ink flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0.2 }}
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 1.6, repeat: Infinity }}
      className="font-serif text-3xl text-gold tracking-wide"
    >
      EB
    </motion.div>
  </div>
);
