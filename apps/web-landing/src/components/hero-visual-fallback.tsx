'use client';

/** CSS-only hero visuals when WebGL is unavailable or still loading. */
export function HeroVisualFallback() {
  return (
    <div className="hero-visual-fallback pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden>
      <div className="hero-fallback-ring hero-fallback-ring-1" />
      <div className="hero-fallback-ring hero-fallback-ring-2" />
      <div className="hero-fallback-ring hero-fallback-ring-3" />
      <div className="hero-fallback-core" />
      <div className="hero-fallback-glow hero-fallback-glow-a" />
      <div className="hero-fallback-glow hero-fallback-glow-b" />
    </div>
  );
}
