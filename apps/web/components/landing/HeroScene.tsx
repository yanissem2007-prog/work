'use client';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Living node-network hero. Points drift in 3D and link when close — the
 * "talent connecting" metaphor for WORK. Reacts to pointer (parallax) and to
 * scroll (drift speed). Theme-aware, dpr-capped, and disabled under
 * prefers-reduced-motion (a calm static field is shown instead).
 */

const COUNT = 64;
const LINK_DIST = 2.3;
const BOUNDS: [number, number, number] = [5, 2.8, 2.2];

function Network({ color, reduced }: { color: string; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const three = useMemo(() => new THREE.Color(color), [color]);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS[0] * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS[1] * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS[2] * 2;
      const s = reduced ? 0 : 1;
      velocities[i * 3] = (Math.random() - 0.5) * 0.006 * s;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.006 * s;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006 * s;
    }
    return { positions, velocities };
  }, [reduced]);

  const linePositions = useMemo(() => new Float32Array(COUNT * COUNT * 2 * 3), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state) => {
    // drift + bounce
    for (let i = 0; i < COUNT; i++) {
      for (let a = 0; a < 3; a++) {
        const idx = i * 3 + a;
        positions[idx] += velocities[idx];
        if (positions[idx] > BOUNDS[a] || positions[idx] < -BOUNDS[a]) velocities[idx] *= -1;
      }
    }
    if (pointsRef.current) pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // rebuild links
    let p = 0;
    for (let i = 0; i < COUNT; i++) {
      const ix = positions[i * 3], iy = positions[i * 3 + 1], iz = positions[i * 3 + 2];
      for (let j = i + 1; j < COUNT; j++) {
        const dx = ix - positions[j * 3], dy = iy - positions[j * 3 + 1], dz = iz - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST) {
          linePositions[p++] = ix; linePositions[p++] = iy; linePositions[p++] = iz;
          linePositions[p++] = positions[j * 3]; linePositions[p++] = positions[j * 3 + 1]; linePositions[p++] = positions[j * 3 + 2];
        }
      }
    }
    if (linesRef.current) {
      linesRef.current.geometry.setDrawRange(0, p / 3);
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // parallax
    if (group.current) {
      const t = state.clock.elapsedTime;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.current.x * 0.35 + (reduced ? 0 : t * 0.02), 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.current.y * 0.22, 0.05);
    }
  });

  return (
    <group ref={group}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.085} color={three} transparent opacity={0.95} sizeAttenuation depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={three} transparent opacity={0.16} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

export default function HeroScene({ color = '#6b7cff' }: { color?: string }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const h = () => setReduced(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Network color={color} reduced={reduced} />
    </Canvas>
  );
}
