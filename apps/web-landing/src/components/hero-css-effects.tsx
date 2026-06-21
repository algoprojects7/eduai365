'use client';

/** Visible CSS-only hero effects when WebGL is unavailable or as a base layer. */
export function HeroCssEffects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-css-ring hero-css-ring-1 animate-hero-ring-1" />
      <div className="hero-css-ring hero-css-ring-2 animate-hero-ring-2" />
      <div className="hero-css-orb hero-css-orb-1 animate-orb-drift-1" />
      <div className="hero-css-orb hero-css-orb-2 animate-orb-drift-2" />
      <div className="hero-css-orb hero-css-orb-3 animate-orb-drift-3" />
      <div className="hero-css-core animate-hero-core-pulse" />
    </div>
  );
}
