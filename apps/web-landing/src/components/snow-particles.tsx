'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Snow-like falling particle effect fixed to the viewport.
 * Simulates data/info (binary bits, dots, diamonds) falling down like snow.
 * Visually optimized to be readable on both dark (Hero, Footer) and light (Bento, Pricing) backgrounds.
 */

interface InfoParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  wind: number;
  opacity: number;
  wobbleAmplitude: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  hue: number;
  saturation: number;
  lightness: number;
  /** 0 = circle, 1 = diamond, 2 = '0', 3 = '1' */
  type: number;
}

const PARTICLE_COUNT = 80;

function createParticle(width: number, height: number, startFromTop = false): InfoParticle {
  const hues = [195, 215, 240, 270]; // Cyan, Blue, Indigo, Violet
  const hue = hues[Math.floor(Math.random() * hues.length)]!;
  
  return {
    x: Math.random() * width,
    y: startFromTop ? -(Math.random() * 80 + 10) : Math.random() * height,
    size: Math.random() * 5 + 3.5, // 3.5px to 8.5px
    speed: Math.random() * 0.9 + 0.35, // Gentle falling speed
    wind: (Math.random() - 0.5) * 0.25,
    opacity: Math.random() * 0.45 + 0.3, // 0.3 to 0.75 opacity for clear visibility
    wobbleAmplitude: Math.random() * 30 + 15,
    wobbleSpeed: Math.random() * 0.008 + 0.002,
    wobbleOffset: Math.random() * Math.PI * 2,
    hue,
    saturation: 85,
    lightness: 50, // More saturated/centered lightness so they stand out on light backgrounds too
    type: Math.floor(Math.random() * 4), // Equal mix of circles, diamonds, 0s, and 1s
  };
}

export function SnowParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<InfoParticle[]>([]);
  const dimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const timeRef = useRef<number>(0);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    dimensionsRef.current = { w, h };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(w, h, false)
      );
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize();

    const draw = () => {
      const { w, h } = dimensionsRef.current;
      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 1;
      ctx.clearRect(0, 0, w, h);

      // Add a subtle drop shadow to all drawings so they are highly visible on light backgrounds
      ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      for (const p of particlesRef.current) {
        const wobbleX =
          Math.sin(timeRef.current * p.wobbleSpeed + p.wobbleOffset) *
          p.wobbleAmplitude *
          0.025;

        p.x += p.wind + wobbleX;
        p.y += p.speed;

        // Wrap around when leaving viewport
        if (p.y > h + 15) {
          p.y = -(Math.random() * 40 + 5);
          p.x = Math.random() * w;
        }
        if (p.x < -30) p.x = w + 15;
        if (p.x > w + 30) p.x = -15;

        // Pulsing opacity
        const pulseAlpha =
          p.opacity +
          Math.sin(timeRef.current * 0.015 + p.wobbleOffset) * 0.08;
        const alpha = Math.max(0.2, Math.min(0.85, pulseAlpha));

        const color = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${alpha})`;

        ctx.save();
        ctx.fillStyle = color;

        if (p.type === 0) {
          // Circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 1) {
          // Diamond
          const s = p.size * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s * 0.7, p.y);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - s * 0.7, p.y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Text binary digit (0 or 1)
          const char = p.type === 2 ? '0' : '1';
          ctx.font = `bold ${Math.floor(p.size * 1.5)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, p.x, p.y);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999, // Ensure it sits on top of all page layers
      }}
    />
  );
}
