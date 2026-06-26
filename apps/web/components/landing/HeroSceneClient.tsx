'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Three.js can't server-render — load the scene client-side only.
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false, loading: () => null });

export function HeroSceneClient() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Hex (three.js can't parse oklch); tuned per theme for depth without noise.
  const color = resolvedTheme === 'dark' ? '#8190ff' : '#5566e8';
  return <HeroScene color={color} />;
}
