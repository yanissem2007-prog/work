'use client';
import { useEffect, useRef } from 'react';

interface Props {
  density?: number;
  className?: string;
  speed?: number;
  color?: string;
}

/**
 * Lightweight canvas particle field — additive blend, respects prefers-reduced-motion,
 * pauses when offscreen, redraws on dpr change.
 */
export function Particles({
  density = 36,
  speed = 0.18,
  color = 'rgba(110, 130, 255, 0.55)',
  className = ''
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    const dots: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    function resize() {
      const r = canvas.getBoundingClientRect();
      w = canvas.width = r.width * dpr;
      h = canvas.height = r.height * dpr;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    }
    function seed() {
      dots.length = 0;
      const count = Math.round((w * h) / (28000 / density));
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed * dpr,
          vy: (Math.random() - 0.5) * speed * dpr,
          r: (Math.random() * 1.6 + 0.4) * dpr
        });
      }
    }
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      // soft links
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.hypot(dx, dy);
          const max = 120 * dpr;
          if (dist < max) {
            ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${(1 - dist / max) * 0.18})`);
            ctx.lineWidth = 0.6 * dpr;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    resize(); seed(); tick();
    const onResize = () => { resize(); seed(); };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      running = false;
    };
  }, [density, speed, color]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
