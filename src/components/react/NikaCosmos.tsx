import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Stars, Sparkles, Edges } from '@react-three/drei';
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

// ---------------------------------------------------------------------------
// THE SEED — an obsidian verb-shard. A faceted icosahedron with a cyan
// fresnel rim, glowing facet edges, and four verb-nodes (infer · exec ·
// invoke · agent) that pulse in sequence and fire threads of light from the
// core. The whole thing IGNITES as you scroll: the metamorphosis seed.
// ---------------------------------------------------------------------------

// Scroll-driven ignition: 0.15 at the top → 1 across the first viewport.
function scrollIgnite(): number {
  if (typeof window === 'undefined') return 0.15;
  const vh = window.innerHeight || 800;
  const y = window.scrollY || 0;
  return Math.min(1, 0.15 + (y / (vh * 0.7)) * 0.85);
}

// Normalized scroll across the first viewport → 0..1. Drives the camera dolly
// (we fall INTO the field as the page begins) for an other-world depth pull.
function scrollDepth(): number {
  if (typeof window === 'undefined') return 0;
  const vh = window.innerHeight || 800;
  return Math.min(1, (window.scrollY || 0) / vh);
}

// Scroll VELOCITY — the field reacts to how hard you move. Accumulated on each
// scroll event, decayed every frame. 0 at rest → ~1 when scrolling fast. Lets
// the supernova flare and the shard spin up: you FEEL the energy of motion.
let _scrollVel = 0;
let _lastY = 0;
if (typeof window !== 'undefined') {
  _lastY = window.scrollY || 0;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY || 0;
      _scrollVel = Math.min(1, _scrollVel + Math.abs(y - _lastY) * 0.012);
      _lastY = y;
    },
    { passive: true },
  );
}
const scrollVel = () => _scrollVel;
const decayVel = () => {
  _scrollVel *= 0.9;
};

const SHARD_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const SHARD_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIgnite;
  uniform vec3 uRim;
  uniform vec3 uCore;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // sharper fresnel = a harder obsidian edge; thin secondary rim for depth
    float fres = 1.0 - max(dot(vNormal, vView), 0.0);
    float f = pow(fres, 3.4);
    float edge = smoothstep(0.55, 0.95, fres) * 0.4;
    float pulse = 0.5 + 0.5 * sin(uTime * 1.2);
    vec3 col = mix(uCore, uRim, (f + edge) * (0.3 + 0.7 * uIgnite));
    col += uRim * f * uIgnite * pulse * 0.85;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Four verbs ignite at tetrahedral vertices around the seed.
const VERB_DIRS = [
  new THREE.Vector3(1, 1, 1),
  new THREE.Vector3(1, -1, -1),
  new THREE.Vector3(-1, 1, -1),
  new THREE.Vector3(-1, -1, 1),
].map((v) => v.normalize().multiplyScalar(1.85));

function VerbShard({ still }: { still: boolean }) {
  const shard = useRef<THREE.Mesh>(null);
  const nodes = useRef<Array<THREE.Mesh | null>>([null, null, null, null]);
  const threads = useRef<THREE.LineSegments>(null);
  const ig = useRef(still ? 0.6 : 0.15);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIgnite: { value: still ? 0.6 : 0.15 },
      uRim: { value: new THREE.Color(CYAN) },
      uCore: { value: new THREE.Color('#02030a') },
    }),
    [still],
  );

  const threadGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(VERB_DIRS.length * 6);
    VERB_DIRS.forEach((v, i) => {
      arr.set([0, 0, 0, v.x, v.y, v.z], i * 6);
    });
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    const target = still ? 0.6 : scrollIgnite();
    ig.current += (target - ig.current) * 0.06;
    uniforms.uIgnite.value = ig.current;

    if (shard.current && !still) {
      shard.current.rotation.y = t * 0.12 + scrollVel() * 1.1; // spin up with energy
      shard.current.rotation.x = Math.sin(t * 0.2) * 0.18;
    }
    nodes.current.forEach((n, i) => {
      if (!n) return;
      const p = still ? 0.7 : 0.5 + 0.5 * Math.sin(t * 1.6 - i * 1.9);
      n.scale.setScalar((0.05 + 0.06 * p) * (0.4 + 0.6 * ig.current));
      (n.material as THREE.MeshBasicMaterial).opacity = (0.25 + 0.75 * p) * ig.current;
    });
    if (threads.current) {
      (threads.current.material as THREE.LineBasicMaterial).opacity = 0.1 + 0.4 * ig.current;
    }
  });

  return (
    <group>
      <mesh ref={shard} scale={1.15}>
        <icosahedronGeometry args={[1, 0]} />
        <shaderMaterial uniforms={uniforms} vertexShader={SHARD_VERT} fragmentShader={SHARD_FRAG} />
        <Edges threshold={1} color={CYAN} />
      </mesh>
      <lineSegments ref={threads} geometry={threadGeo}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {VERB_DIRS.map((v, i) => (
        <mesh
          key={i}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          position={v}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? BRAND : CYAN}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

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
    const v = scrollVel();
    pts.current.rotation.y = t * 0.06 + v * 0.4;
    pts.current.rotation.z = t * 0.02;
    // breathe normally, FLARE with scroll energy
    const breathe = 1 + Math.sin(t * 0.6) * 0.06 + v * 0.18;
    pts.current.scale.setScalar(breathe);
    (pts.current.material as THREE.PointsMaterial).opacity = 0.9 + v * 0.1;
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

// THE DRUM — concentric shockwave rings that ripple outward from the Seed.
// The Joy Boy "drum of liberation" made visible: a slow pulse through the
// cosmos. Tilted (not flat) so it reads as a 3D wave, never a clock-face.
// Amplitude swells with scroll velocity. Silent (invisible) when still.
function ShockRings({ still }: { still: boolean }) {
  const rings = useRef<Array<THREE.Mesh | null>>([null, null, null]);
  const N = 3;

  useFrame((state) => {
    if (still) return;
    const t = state.clock.elapsedTime;
    const energy = 0.55 + 0.45 * scrollVel();
    rings.current.forEach((r, i) => {
      if (!r) return;
      const phase = (t * 0.16 + i / N) % 1; // 0..1 sawtooth, phase-offset
      const s = 0.5 + phase * 6.8;
      r.scale.set(s, s, s);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (1 - phase) * 0.16 * energy;
      r.rotation.z = t * 0.05 + i * 2.1;
    });
  });

  return (
    <group>
      {Array.from({ length: N }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          rotation={[Math.PI / 2.5, 0, 0]}
        >
          <torusGeometry args={[1, 0.012, 8, 110]} />
          <meshBasicMaterial
            color={CYAN}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Slow camera-group drift + mouse parallax + a scroll-driven dolly that
// falls into the field. Exponential fog gives the scene real depth — distant
// stars dissolve into a brand-tinted haze (the "other world").
function Scene({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const far = useRef<THREE.Group>(null); // far dust — parallaxes least
  const near = useRef<THREE.Group>(null); // near dust — parallaxes most
  const mouse = useRef({ x: 0, y: 0 });
  const depth = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tx = still ? 0 : mouse.current.x * 0.25;
    const ty = still ? 0 : mouse.current.y * 0.2;

    if (group.current) {
      group.current.rotation.y += (tx - group.current.rotation.y) * 0.04;
      group.current.rotation.x += (ty - group.current.rotation.x) * 0.04;
    }
    // Depth parallax: far layer counter-drifts gently, near layer leads.
    if (far.current) far.current.rotation.y = t * 0.008 + tx * 0.4;
    if (near.current) {
      near.current.rotation.y = -t * 0.02 + tx * 1.6;
      near.current.rotation.x = ty * 1.4;
    }

    decayVel();

    // Scroll dolly — fall INTO the field (z 6 → 4.2) + slight breath.
    const targetDepth = still ? 0 : scrollDepth();
    depth.current += (targetDepth - depth.current) * 0.05;
    const breath = still ? 0 : Math.sin(t * 0.5) * 0.06;
    state.camera.position.z = 6 - depth.current * 1.8 + breath;
    state.camera.position.y = depth.current * 0.5;
    state.camera.lookAt(0, 0, 0);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    mouse.current = { x: e.pointer?.x ?? 0, y: e.pointer?.y ?? 0 };
  };

  return (
    <group ref={group} onPointerMove={onMove}>
      {/* exponential depth haze — distant field dissolves into brand-dark */}
      <fogExp2 attach="fog" args={['#04060e', still ? 0.0 : 0.062]} />

      <group ref={far}>
        <Stars radius={70} depth={60} count={3200} factor={4} saturation={0} fade speed={still ? 0 : 0.35} />
      </group>
      <Supernova still={still} />
      <ShockRings still={still} />
      <VerbShard still={still} />
      <Sparkles count={130} scale={[14, 9, 7]} size={3.2} speed={still ? 0 : 0.3} color={BRAND} opacity={0.7} />
      <group ref={near}>
        <Sparkles count={90} scale={[9, 6, 5]} size={2.1} speed={still ? 0 : 0.5} color={CYAN} opacity={0.6} />
      </group>
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
