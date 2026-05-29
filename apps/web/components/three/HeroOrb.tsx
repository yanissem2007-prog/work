'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function Orb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.2; });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.6, 128, 128]}>
        <MeshDistortMaterial
          color="#6b7cff"
          distort={0.45}
          speed={1.6}
          roughness={0.15}
          metalness={0.6}
        />
      </Sphere>
    </Float>
  );
}

export function HeroOrb() {
  return (
    <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} className="opacity-60">
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} />
      <Orb />
    </Canvas>
  );
}
