import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { waLink } from "@/lib/api";

const LINKS = [
  { to: "/", label: "Accueil", testId: "nav-home-link" },
  { to: "/acting", label: "Acting", testId: "nav-acting-link" },
  { to: "/scenarios", label: "Scénarios", testId: "nav-scenarios-link" },
];

export const Monogram = ({ initials = "EB", size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect x="1" y="1" width="62" height="62" fill="none" stroke="#D4AF37" strokeWidth="2" />
    <text
      x="32"
      y="43"
      fontFamily="Cormorant Garamond, Georgia, serif"
      fontSize={initials.length > 1 ? 28 : 34}
      fill="#D4AF37"
      textAnchor="middle"
    >
      {initials}
    </text>
  </svg>
);

export const Nav = () => {
  const [open, setOpen] = useState(false);
  const content = useContent();
  const location = useLocation();
  const name = content?.name || "benediction Charigufi";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const whatsapp = content?.links?.whatsapp;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      data-testid="main-nav"
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#050505]/60 border-b border-white/5"
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 group">
          <Monogram initials={initials} />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-400 group-hover:text-gold transition-colors">
            {name}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.testId}
              className={({ isActive }) =>
                `font-mono text-[11px] uppercase tracking-[0.25em] transition-colors ${
                  isActive ? "text-gold" : "text-zinc-400 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a
            data-testid="nav-contact-link"
            href={waLink(whatsapp, "Bonjour, je vous contacte depuis votre site.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex border border-gold/70 text-gold px-5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-gold hover:text-black transition-colors"
          >
            Contact
          </a>
          <button
            data-testid="nav-mobile-toggle"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden text-white p-2"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#050505]/95 backdrop-blur-xl">
          <div className="px-6 py-6 flex flex-col gap-5">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`${l.testId}-mobile`}
                className={({ isActive }) =>
                  `font-mono text-xs uppercase tracking-[0.25em] ${isActive ? "text-gold" : "text-zinc-300"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              data-testid="nav-contact-link-mobile"
              href={waLink(whatsapp, "Bonjour, je vous contacte depuis votre site.")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit border border-gold/70 text-gold px-5 py-2 font-mono text-[11px] uppercase tracking-[0.2em]"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
