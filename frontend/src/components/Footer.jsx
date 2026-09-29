import { Link } from "react-router-dom";
import { useContent } from "@/hooks/useContent";
import { waLink } from "@/lib/api";

export const Footer = () => {
  const content = useContent();
  const name = content?.name || "Exaucé Baleke";
  const links = content?.links || {};
  const year = new Date().getFullYear();

  return (
    <footer data-testid="site-footer" className="border-t border-white/5 bg-coal">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16 grid md:grid-cols-3 gap-12">
        <div>
          <p className="font-serif text-3xl text-white">{name}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-gold">
            {content?.role_line || "Acteur — Scénariste"}
          </p>
          <p className="mt-4 text-sm text-zinc-500">{content?.location_line || "Goma — Kinshasa, RDC"}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500 mb-5">Contact direct</p>
          <ul className="space-y-3 text-sm">
            <li>
              <a data-testid="footer-whatsapp-link" href={waLink(links.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-gold transition-colors">
                WhatsApp
              </a>
            </li>
            <li>
              <a data-testid="footer-email-link" href={`mailto:${links.email || ""}`} className="text-zinc-300 hover:text-gold transition-colors">
                {links.email || "Email"}
              </a>
            </li>
            <li>
              <a data-testid="footer-instagram-link" href={links.instagram || "#"} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-gold transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a data-testid="footer-imdb-link" href={links.imdb || "#"} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-gold transition-colors">
                IMDb
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col justify-between gap-8">
          <ul className="space-y-3 text-sm">
            <li><Link to="/acting" data-testid="footer-acting-link" className="text-zinc-300 hover:text-gold transition-colors">Book acting</Link></li>
            <li><Link to="/scenarios" data-testid="footer-scenarios-link" className="text-zinc-300 hover:text-gold transition-colors">Projets de scénarios</Link></li>
            <li><Link to="/admin" data-testid="footer-admin-link" className="text-zinc-600 hover:text-gold transition-colors">Administration</Link></li>
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600">
            &copy; {year} {name} &mdash; Tous droits r&eacute;serv&eacute;s
          </p>
        </div>
      </div>
    </footer>
  );
};
