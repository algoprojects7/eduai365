'use client';

export function HeroAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="hero-glow-orb hero-glow-orb-blue left-[8%] top-[15%] h-72 w-72" />
      <div className="hero-glow-orb hero-glow-orb-violet right-[5%] top-[25%] h-96 w-96 animation-delay-2000" />
      <div className="hero-glow-orb hero-glow-orb-cyan bottom-[10%] left-[35%] h-64 w-64 animation-delay-4000" />
      <div className="hero-light-beam" />
    </div>
  );
}
