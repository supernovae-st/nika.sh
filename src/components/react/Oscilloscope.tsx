import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';

const _noise = createNoise3D(() => 0.77);

interface OscilloscopeProps {
  /** Primary value — drives wave amplitude (e.g. test count, 0–600) */
  value?: number;
  /** Secondary accent value — drives a faint second trace */
  accent?: number;
  width?: number;
  height?: number;
  className?: string;
  /** aria-label for the canvas */
  label?: string;
}

/**
 * Oscilloscope — green phosphor CRT trace driven by simplex-noise FBM.
 *
 * The primary `value` (e.g. test count) determines amplitude: a flat line
 * at 0, max amplitude at 600. A secondary accent trace runs at 40% opacity
 * for depth.
 *
 * Phosphor persistence: each frame draws a 5% opaque black rect over the
 * canvas, so bright traces decay into a warm afterglow over ~20 frames.
 *
 * Canvas is scaled to devicePixelRatio (capped at 2×) for crisp text
 * and line rendering on HiDPI displays.
 *
 * Guardrails:
 * - rAF-gated, pauses when hidden (document.hidden)
 * - IntersectionObserver pauses when scrolled out of view
 * - prefers-reduced-motion: static single frame, no loop
 */
export function Oscilloscope({
  value = 369,
  accent,
  width = 400,
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

    // HiDPI setup
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Fill initial black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const prefersReduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Normalize value to amplitude (0 = flat, 600 = full height)
    const amp = Math.min((value / 600) * (height * 0.38), height * 0.42);
    const accentAmp = accent != null
      ? Math.min((accent / 600) * (height * 0.22), height * 0.25)
      : amp * 0.3;

    let t = 0;
    let rafId = 0;
    let visible = true;

    const drawFrame = () => {
      // Phosphor decay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
      ctx.fillRect(0, 0, width, height);

      const cy = height / 2;

      const drawTrace = (a: number, alpha: number, freq: number) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.shadowBlur  = 5;
        ctx.shadowColor = 'rgba(0, 255, 65, 0.6)';
        ctx.lineWidth   = 1.2;

        for (let x = 0; x <= width; x++) {
          const nx = x / width;
          const n =
            _noise(nx * 2.8 * freq, t * 0.45, 0) * 0.6 +
            _noise(nx * 6.0 * freq, t * 0.9, 1)  * 0.3 +
            _noise(nx * 11  * freq, t * 1.8, 2)  * 0.1;
          const y = cy + n * a;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Primary trace
      drawTrace(amp, 0.88, 1);
      // Accent trace (faint, higher frequency)
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

    const onVis = () => { visible = !document.hidden; };
    document.addEventListener('visibilitychange', onVis);

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
    };
  }, [value, accent, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`oscilloscope ${className}`}
      aria-label={label}
      role="img"
    />
  );
}

export default Oscilloscope;
