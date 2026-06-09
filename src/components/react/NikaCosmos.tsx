import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

/**
 * NikaCosmos — the supernovae hero.
 *
 * A three.js field: a deep starfield, drifting blue/cyan cosmic dust, and a
 * pulsing supernova core, with bloom + chromatic-aberration for the
 * ghost-in-the-shell glow. Brand blue (#3B82F6) on near-black.
 *
 * Same ethos as the old HeroAscii it replaces:
 * - prefers-reduced-motion → frozen single frame, no rAF loop
 * - tab-hidden / off-screen → frameloop pauses (R3F `frameloop`)
 * - SSR-safe: this island is `client:only="react"` (Canvas needs window)
 * - Suspense fallback = a static cosmic gradient (no flash of nothing)
 */

const BRAND = '#3B82F6'; // --color-brand · blue-500
const CYAN = '#22D3EE'; // --color-cyan

// The supernova core — a spherical shell of points that breathes.
function Supernova({ still }: { still: boolean }) {
  const pts = useRef<THREE.Points>(null);
  const COUNT = 1400;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // spherical shell with a little jitter → a soft exploding-star look
      const r = 1.1 + Math.pow(Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453), 1) * 0.9;
      const theta = Math.acos(2 * ((i + 0.5) / COUNT) - 1);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i; // golden-angle spiral
      arr[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      arr[i * 3 + 2] = r * Math.cos(theta);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!pts.current || still) return;
    const t = state.clock.elapsedTime;
    pts.current.rotation.y = t * 0.06;
    pts.current.rotation.z = t * 0.02;
    const breathe = 1 + Math.sin(t * 0.6) * 0.06;
    pts.current.scale.setScalar(breathe);
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color={BRAND}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Slow camera-group drift + a whisper of mouse parallax.
function Scene({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const tx = still ? 0 : mouse.current.x * 0.25;
    const ty = still ? 0 : mouse.current.y * 0.2;
    group.current.rotation.y += ((still ? 0 : t * 0.0) + tx - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (ty - group.current.rotation.x) * 0.04;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    mouse.current = { x: (e.pointer?.x ?? 0), y: (e.pointer?.y ?? 0) };
  };

  return (
    <group ref={group} onPointerMove={onMove}>
      <Stars radius={60} depth={50} count={2600} factor={4} saturation={0} fade speed={still ? 0 : 0.4} />
      <Supernova still={still} />
      <Sparkles count={130} scale={[14, 9, 7]} size={3.2} speed={still ? 0 : 0.3} color={BRAND} opacity={0.7} />
      <Sparkles count={70} scale={[11, 7, 6]} size={2.1} speed={still ? 0 : 0.4} color={CYAN} opacity={0.55} />
    </group>
  );
}

export interface NikaCosmosProps {
  className?: string;
}

export default function NikaCosmos({ className }: NikaCosmosProps) {
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setStill(mq.matches);
    const on = () => setStill(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 62 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={still ? 'demand' : 'always'}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene still={still} />
          {!still && (
            <EffectComposer>
              <Bloom intensity={1.15} luminanceThreshold={0.15} luminanceSmoothing={0.5} mipmapBlur />
              <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={new THREE.Vector2(0.0009, 0.0012)}
                radialModulation={false}
                modulationOffset={0}
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
