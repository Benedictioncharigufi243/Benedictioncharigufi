const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const Grain = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-overlay"
    style={{ backgroundImage: NOISE }}
  />
);
