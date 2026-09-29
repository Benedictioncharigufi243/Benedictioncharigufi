export const Marquee = ({ items }) => (
  <div className="overflow-hidden border-y border-white/5 py-5 select-none" aria-hidden>
    <div className="flex w-max animate-marquee">
      {[0, 1].map((half) => (
        <div key={half} className="flex shrink-0 items-center">
          {items.map((t, j) => (
            <span
              key={j}
              className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-500"
            >
              <span className="mx-8">{t}</span>
              <span className="text-gold">&#10022;</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);
