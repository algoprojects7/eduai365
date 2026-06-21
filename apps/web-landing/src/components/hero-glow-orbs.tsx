'use client';

export function HeroGlowOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="hero-orb hero-orb-blue animate-orb-drift-1" />
      <div className="hero-orb hero-orb-violet animate-orb-drift-2" />
      <div className="hero-orb hero-orb-cyan animate-orb-drift-3" />
    </div>
  );
}
