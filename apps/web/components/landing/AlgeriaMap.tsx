'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

// Algerian cities as a talent constellation (relative coords in a 0–100 box,
// north at top). Not cartographically exact — an evocative network of the
// real cities WORK is built around.
type City = { id: string; label: string; x: number; y: number; hub?: boolean };
const CITIES: City[] = [
  { id: 'alger', label: 'Alger', x: 47, y: 17, hub: true },
  { id: 'oran', label: 'Oran', x: 21, y: 21 },
  { id: 'constantine', label: 'Constantine', x: 63, y: 16 },
  { id: 'annaba', label: 'Annaba', x: 72, y: 12 },
  { id: 'tlemcen', label: 'Tlemcen', x: 15, y: 26 },
  { id: 'setif', label: 'Sétif', x: 57, y: 20 },
  { id: 'bechar', label: 'Béchar', x: 23, y: 47 },
  { id: 'ouargla', label: 'Ouargla', x: 58, y: 49 },
  { id: 'tamanrasset', label: 'Tamanrasset', x: 54, y: 82 }
];

// Links radiate from Alger (the hub) + a few cross-links.
const LINKS: [string, string][] = [
  ['alger', 'oran'], ['alger', 'constantine'], ['alger', 'setif'],
  ['alger', 'bechar'], ['alger', 'ouargla'], ['constantine', 'annaba'],
  ['oran', 'tlemcen'], ['setif', 'constantine'], ['ouargla', 'tamanrasset'],
  ['bechar', 'tamanrasset']
];

// Stylised Algeria silhouette (wide Saharan body tapering north to the coast).
const ALGERIA_PATH =
  'M16 28 L14 23 L20 19 L31 17 L42 19 L52 16 L62 14 L71 11 L76 16 L79 26 ' +
  'L76 40 L70 52 L64 66 L56 84 L50 88 L44 82 L34 64 L26 50 L19 40 Z';

export function AlgeriaMap() {
  const ref = useRef<SVGSVGElement>(null);
  const pos = (id: string) => CITIES.find((c) => c.id === id)!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll<SVGLineElement>('[data-link]');
      // Draw connections when the map scrolls into view.
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        lines.forEach((line) => {
          const len = line.getTotalLength?.() ?? 100;
          gsap.set(line, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
        });
        gsap.to(lines, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: 'power2.out',
          stagger: 0.08
        });
      }, { threshold: 0.35 });
      io.observe(el);
      return () => io.disconnect();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 90 95" className="w-full h-full overflow-visible" aria-label="Network of Algerian cities">
      <defs>
        <radialGradient id="alg-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* glow + silhouette */}
      <rect x="0" y="0" width="90" height="95" fill="url(#alg-glow)" />
      <path d={ALGERIA_PATH} fill="color-mix(in oklch, var(--accent) 7%, transparent)"
        stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="0.4" />

      {/* connections (animated draw) */}
      {LINKS.map(([a, b], i) => {
        const pa = pos(a), pb = pos(b);
        return (
          <line key={i} data-link x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke="var(--accent)" strokeWidth="0.35" strokeOpacity="0.55" opacity="0" strokeLinecap="round" />
        );
      })}

      {/* city nodes */}
      {CITIES.map((c, i) => (
        <g key={c.id}>
          <motion.circle
            cx={c.x} cy={c.y} r={c.hub ? 1.9 : 1.3}
            fill="var(--accent)"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300, damping: 18 }}
          />
          {/* pulse ring on the hub */}
          {c.hub && (
            <circle cx={c.x} cy={c.y} r="1.9" fill="none" stroke="var(--accent)" strokeWidth="0.3">
              <animate attributeName="r" from="1.9" to="6" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
          <text x={c.x + (c.x > 65 ? -2.5 : 2.5)} y={c.y + 0.5}
            textAnchor={c.x > 65 ? 'end' : 'start'}
            className="fill-[var(--fg-soft)] font-medium"
            style={{ fontSize: '2.4px', letterSpacing: '0.02em' }}>
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
