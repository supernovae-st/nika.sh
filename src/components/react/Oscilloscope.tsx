import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';

const _noise = createNoise3D(() => 0.77);

interface OscilloscopeProps {
  /** Primary value — drives wave amplitude (e.g. test count, 0–600) */
  value?: number;
  /** Secondary accent value — drives a faint second trace */
  accent?: number;
  /** Display height in CSS pixels (default: 80) */
  height?: number;
  className?: string;
  label?: string;
}

/**
 * Oscilloscope — green phosphor CRT trace driven by simplex-noise FBM.
 *
 * The primary `value` (e.g. test count) determines amplitude: flat line
 * at 0, max amplitude at ~600. A secondary accent trace runs at 40% opacity.
 *
 * Canvas sizing: reads actual rendered width via `offsetWidth` so it fills
 * its CSS container correctly regardless of breakpoint. A window `resize`
 * listener redraws the buffer when the container changes.
 *
 * Phosphor persistence: each frame draws a 5.5% opaque black rect, so
 * bright traces decay into warm afterglow over ~18 frames.
 *
 * Guardrails:
 * - rAF pauses when hidden (document.hidden) or scrolled out (IO)
 * - prefers-reduced-motion: static single frame, no loop
 * - HiDPI: pixel buffer is capped at 2× device pixel ratio
 */
export function Oscilloscope({
  value = 369,
  accent,
  height = 80,
  className = '',
  label = 'Oscilloscope trace',
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Measure actual rendered CSS dimensions — CSS controls display size.
    let W = canvas.offsetWidth || 400;
    const H = height;

    const setupBuffer = () => {
      W = canvas.offsetWidth || 400;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      // setTransform is idempotent unlike ctx.scale (which accumulates)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    };
    setupBuffer();

    const prefersReduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Normalise value → amplitude (0 = flat line, 600 = full height)
    const amp       = Math.min((value / 600) * (H * 0.38), H * 0.42);
    const accentAmp = accent != null
      ? Math.min((accent / 600) * (H * 0.22), H * 0.25)
      : amp * 0.3;

    let t = 0;
    let rafId = 0;
    let visible = true;

    const drawFrame = () => {
      // Phosphor decay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
      ctx.fillRect(0, 0, W, H);

      const cy = H / 2;

      const drawTrace = (a: number, alpha: number, freq: number) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.shadowBlur  = 5;
        ctx.shadowColor = 'rgba(0, 255, 65, 0.55)';
        ctx.lineWidth   = 1.2;
        for (let x = 0; x <= W; x++) {
          const nx = x / W;
          const n =
            _noise(nx * 2.8 * freq, t * 0.45, 0) * 0.6 +
            _noise(nx * 6.0 * freq, t * 0.9,  1) * 0.3 +
            _noise(nx * 11  * freq, t * 1.8,  2) * 0.1;
          const y = cy + n * a;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawTrace(amp, 0.88, 1);
      drawTrace(accentAmp, 0.28, 1.6);

      t += 0.013;
    };

    if (prefersReduced) {
      drawFrame();
      return () => {};
    }

    const io = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting; },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVis    = () => { visible = !document.hidden; };
    const onResize = () => { setupBuffer(); };  // rebuffer on window resize

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize, { passive: true });

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (!visible) return;
      drawFrame();
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  }, [value, accent, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`oscilloscope ${className}`}
      // CSS controls display size — no inline width/height override.
      style={{ display: 'block', width: '100%', height: `${height}px` }}
      aria-label={label}
      role="img"
    />
  );
}

export default Oscilloscope;
