import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';

/**
 * HeroDots — Three.js animated dot grid background.
 *
 * Inspired by AI Hero Background (21st.dev) + cinema.md aesthetic
 * (NERV/GITS dither overlay). Hexagonal jittered dot grid with
 * roundedSquareWave radial pulse animation, RGB shift + bloom.
 *
 * Adapted to Nika narrative palette: navy #0B0D17 base, orange #FF6B1A dots.
 *
 * Performance: lazy-mounted via Astro `client:visible`. Disposes cleanly
 * on unmount. Respects prefers-reduced-motion (static grid, no animation).
 */
export default function HeroDots() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    while (container.firstChild) container.removeChild(container.firstChild);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0b0d17, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();

    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.45,
      0.9,
      0.12,
    );
    const rgbShift = new ShaderPass(RGBShiftShader);
    rgbShift.uniforms['amount'].value = 0.0012;
    rgbShift.uniforms['angle'].value = Math.PI / 4;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(rgbShift);

    // Hexagonal dot grid — Bayer-jittered for that "intentional dither" feel
    const GRID = {
      cols: 110,
      rows: 110,
      jitter: 0.3,
      hexOffset: 0.5,
      dotRadius: 0.025,
      spacing: 0.6,
    };

    const total = GRID.cols * GRID.rows;
    const geometry = new THREE.CircleGeometry(GRID.dotRadius, 8);

    // Two materials: warm orange (primary) + cool muted (background pattern)
    const warmMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b1a, // --color-nika-orange
      transparent: true,
      opacity: 1,
    });

    const coolMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a4e5c, // --color-dim-star
      transparent: true,
      opacity: 0.4,
    });

    const dots = new THREE.InstancedMesh(geometry, coolMaterial, total);
    dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(dots);

    // Per-instance color override — sparse warm dots scattered through cool grid
    const colorAttr = new Float32Array(total * 3);
    for (let i = 0; i < total; i++) {
      const isWarm = Math.random() < 0.06; // ~6% of dots are orange
      if (isWarm) {
        colorAttr[i * 3] = 1.0;       // R
        colorAttr[i * 3 + 1] = 0.42;  // G — #FF6B1A
        colorAttr[i * 3 + 2] = 0.10;  // B
      } else {
        colorAttr[i * 3] = 0.29;      // R — #4A4E5C
        colorAttr[i * 3 + 1] = 0.31;  // G
        colorAttr[i * 3 + 2] = 0.36;  // B
      }
    }
    dots.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);

    const basePos = new Float32Array(total * 2);
    const distArr = new Float32Array(total);

    const xOffset = (GRID.cols - 1) * GRID.spacing * 0.5;
    const yOffset = (GRID.rows - 1) * GRID.spacing * 0.5;

    let idx = 0;
    const dummy = new THREE.Object3D();

    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++, idx++) {
        let x = c * GRID.spacing - xOffset;
        let y = r * GRID.spacing - yOffset;
        y += (c % 2) * GRID.hexOffset * GRID.spacing;
        x += (Math.random() - 0.5) * GRID.jitter;
        y += (Math.random() - 0.5) * GRID.jitter;
        basePos[idx * 2] = x;
        basePos[idx * 2 + 1] = y;
        const len = Math.hypot(x, y);
        const ang = Math.atan2(y, x);
        const oct = 0.5 * Math.cos(ang * 8.0);
        distArr[idx] = len + oct * 0.75;
        dummy.position.set(x, y, 0);
        dummy.updateMatrix();
        dots.setMatrixAt(idx, dummy.matrix);
      }
    }

    function roundedSquareWave(t: number, delta: number, a: number, f: number) {
      return ((2 * a) / Math.PI) * Math.atan(Math.sin(2 * Math.PI * t * f) / delta);
    }

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow pulse — chrysalis "breathing" rhythm
      const speed = 0.35;
      const amp = 0.55;
      const freq = 0.22;
      const falloff = 0.04;
      const phase = (Math.sin(2 * Math.PI * t * freq) + 1) * 0.5;
      rgbShift.uniforms['amount'].value = 0.0008 + phase * 0.0018;

      const mat = new THREE.Matrix4();
      const pos = new THREE.Vector3();

      for (let i = 0; i < total; i++) {
        const x0 = basePos[i * 2];
        const y0 = basePos[i * 2 + 1];
        const dist = distArr[i];
        const localDelta = THREE.MathUtils.lerp(
          0.06,
          0.22,
          Math.min(1.0, dist / 65.0),
        );
        const tt = t * speed - dist * falloff;
        const k = 1 + roundedSquareWave(tt, localDelta, amp, freq);
        pos.set(x0 * k, y0 * k, 0);
        mat.set(1, 0, 0, pos.x, 0, 1, 0, pos.y, 0, 0, 1, 0, 0, 0, 0, 1);
        dots.setMatrixAt(i, mat);
      }
      dots.instanceMatrix.needsUpdate = true;
      composer.render();
    };

    const renderStaticOnce = () => {
      composer.render();
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      const worldHeight = 10;
      const worldWidth = worldHeight * aspect;
      camera.left = -worldWidth / 2;
      camera.right = worldWidth / 2;
      camera.top = worldHeight / 2;
      camera.bottom = -worldHeight / 2;
      camera.near = -100;
      camera.far = 100;
      camera.position.set(0, 0, 10);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloom.setSize(w, h);
      if (reducedMotion) renderStaticOnce();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    if (reducedMotion) {
      renderStaticOnce();
    } else {
      animate();
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      while (container.firstChild) container.removeChild(container.firstChild);
      geometry.dispose();
      warmMaterial.dispose();
      coolMaterial.dispose();
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-70"
      aria-hidden="true"
    />
  );
}
