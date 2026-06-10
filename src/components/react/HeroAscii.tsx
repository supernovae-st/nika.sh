import { useEffect, useRef, useState } from 'react';
import { createNoise3D } from 'simplex-noise';

/**
 * HeroAscii — the selectable-text hero.
 *
 * Renders a <pre> grid of ramp characters driven by a 3D simplex FBM
 * flow field with domain warp + mouse-proximity brightening. Updates at
 * ~30fps via rAF. Single textContent write per frame (no per-char DOM).
 *
 * The punchline: it's REAL TEXT. Cmd-A selects it. Cmd-C copies it.
 * That is the exact dev-tool ethos — everything inspectable, everything
 * plain. Pair with Departure Mono and brand-blue on near-black.
 *
 * Guardrails:
 * - IntersectionObserver gates rAF when scrolled out of view
 * - document visibility pauses animation when tab is hidden
 * - prefers-reduced-motion renders a single static frame, no loop
 * - iOS / low-memory / no-WebGL still works — this is plain DOM text
 */

// Character ramp — darkest → brightest. 9 steps including leading space.
const RAMP = ' .·∙•░▒▓█';

export interface HeroAsciiProps {
  cols?: number;
  rows?: number;
  speed?: number;
  label?: string;
  className?: string;
}

export function HeroAscii({
  cols = 140,
  rows = 36,
  speed = 1,
  label = 'Nika is alive — live dithered flow field rendered in Unicode.',
  className = '',
}: HeroAsciiProps) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    const node: HTMLPreElement | null = preRef.current;
    if (!node) return;
    const target: HTMLPreElement = node;

    const prefersReduced = typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;

    const noise3D = createNoise3D(() => 0.42);

    const state = {
      visible: true,
      mx: 0.5,
      my: 0.5,
      rafId: 0,
      lastDraw: 0,
    };

    const rampLast = RAMP.length - 1;
    const scale = 0.06;
    const warpScale = 0.09;

    function frame(t: number) {
      const out = new Array<string>(rows);
      const time = t * 0.00015 * speed;
      for (let y = 0; y < rows; y++) {
        const cy = (y / rows - 0.5) * 2.2;
        let row = '';
        for (let x = 0; x < cols; x++) {
          const cx = (x / cols - 0.5) * 4;

          const warp = noise3D(cx * warpScale, cy * warpScale, time);
          const nx = cx * scale + warp * 0.6;
          const ny = cy * scale + warp * 0.6;

          let v = 0, amp = 0.5, freq = 1;
          for (let o = 0; o < 3; o++) {
            v += amp * noise3D(nx * freq, ny * freq, time + o * 0.7);
            amp *= 0.5;
            freq *= 2.02;
          }
          v = (v + 0.875) / 1.75;

          const dx = (x / cols) - state.mx;
          const dy = (y / rows) - state.my;
          const d = Math.sqrt(dx * dx + dy * dy);
          const spotlight = Math.max(0, 1 - d * 2.4);
          v += spotlight * 0.28;

          const vignette = 1 - Math.min(1, Math.abs(cy / 1.4));
          v *= 0.55 + 0.45 * vignette;

          const idx = v <= 0 ? 0 : v >= 1 ? rampLast : Math.floor(v * (rampLast + 0.9999));
          row += RAMP[idx];
        }
        out[y] = row;
      }
      target.textContent = out.join('\n');
    }

    if (prefersReduced) {
      frame(0);
      return () => {};
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) state.visible = e.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(target);

    const onVisibility = () => {
      if (document.hidden) state.visible = false;
      else if (target.getBoundingClientRect().top < window.innerHeight) state.visible = true;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onPointer = (e: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      state.mx = (e.clientX - rect.left) / rect.width;
      state.my = (e.clientY - rect.top)  / rect.height;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const FRAME_MS = 1000 / 30;

    const loop = (t: number) => {
      state.rafId = requestAnimationFrame(loop);
      if (!state.visible) return;
      if (t - state.lastDraw < FRAME_MS) return;
      state.lastDraw = t;
      frame(t);
    };
    state.rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.rafId);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [cols, rows, speed]);

  const staticPlaceholder = buildStaticFrame(cols, rows);

  return (
    <pre
      ref={preRef}
      className={`ascii-hero ${className}`}
      aria-label={label}
      data-hydrated={hydrated ? 'true' : 'false'}
      style={{ minHeight: `calc(${rows} * 1em * 1)` }}
    >
      {staticPlaceholder}
    </pre>
  );
}

function buildStaticFrame(cols: number, rows: number): string {
  const out: string[] = [];
  for (let y = 0; y < rows; y++) {
    const cy = (y / rows - 0.5) * 2;
    let row = '';
    for (let x = 0; x < cols; x++) {
      const cx = (x / cols - 0.5) * 2;
      const r = Math.sqrt(cx * cx + cy * cy);
      const v = Math.max(0, 1 - r * 1.4);
      const idx = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length));
      row += RAMP[idx];
    }
    out.push(row);
  }
  return out.join('\n');
}

export default HeroAscii;
