'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number;
}

function createStars(width: number, height: number, count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.4 + 0.3,
    opacity: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 0.002 + 0.001,
    twinkleOffset: Math.random() * Math.PI * 2,
    layer: Math.floor(Math.random() * 3),
  }));
}

export function UniverseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvasEl = canvas;
    const ctx2d = ctx;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = window.innerWidth * dpr;
      canvasEl.height = window.innerHeight * dpr;
      canvasEl.style.width = `${window.innerWidth}px`;
      canvasEl.style.height = `${window.innerHeight}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = window.innerWidth * window.innerHeight;
      const count = Math.min(420, Math.floor(area / 4500));
      starsRef.current = createStars(window.innerWidth, window.innerHeight, count);
    }

    resize();
    window.addEventListener('resize', resize);

    let animationId = 0;
    const start = performance.now();

    function draw(now: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = now - start;

      ctx2d.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        const drift = prefersReducedMotion ? 0 : t * (0.008 + star.layer * 0.006);
        const twinkle = prefersReducedMotion
          ? star.opacity
          : star.opacity * (0.55 + 0.45 * Math.sin(t * star.twinkleSpeed + star.twinkleOffset));

        const x = (star.x + drift * (star.layer + 1)) % w;
        const y = star.y;

        ctx2d.beginPath();
        ctx2d.arc(x, y, star.radius * (1 + star.layer * 0.15), 0, Math.PI * 2);
        ctx2d.fillStyle = `rgba(220, 235, 255, ${twinkle})`;
        ctx2d.fill();

        if (star.radius > 1.2 && twinkle > 0.5) {
          ctx2d.beginPath();
          ctx2d.arc(x, y, star.radius * 2.5, 0, Math.PI * 2);
          ctx2d.fillStyle = `rgba(34, 211, 238, ${twinkle * 0.12})`;
          ctx2d.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="universe-bg" aria-hidden="true">
      <div className="universe-nebula universe-nebula-1" />
      <div className="universe-nebula universe-nebula-2" />
      <div className="universe-nebula universe-nebula-3" />
      <canvas ref={canvasRef} className="universe-stars" />

      <div className="pulsar-orbit">
        <div className="pulsar-anchor">
          <div className="pulsar">
            <div className="pulsar-beam pulsar-beam-a" />
            <div className="pulsar-beam pulsar-beam-b" />
            <div className="pulsar-core" />
            <div className="pulsar-glow" />
            <div className="pulsar-ring" />
          </div>
        </div>
      </div>

      <div className="universe-vignette" />
    </div>
  );
}
