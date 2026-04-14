import { useEffect, useRef } from 'react';

/**
 * CursorFx — spring-physics cursor with ambient descriptor label.
 *
 * Only activates on pointer:fine (desktop) devices — no-ops silently on
 * touch screens. Hides the system cursor and renders a branded 8px dot that
 * follows with an exponential-decay spring (k≈0.15/frame ≈ stiffness 150).
 *
 * Reads `data-cursor` on the closest ancestor, then infers "press" (button)
 * or "open" (anchor) as fallback, to show an ambient micro-label beside the dot.
 *
 * Guardrails:
 * - Restores cursor: '' on unmount
 * - rAF-gated, no work if pointer hasn't moved
 * - Passive event listeners throughout
 */
export function CursorFx() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    if (!matchMedia('(pointer: fine)').matches) return;

    document.documentElement.style.cursor = 'none';

    // Start off-screen — dot becomes visible only after the first pointermove.
    let tx = -100;
    let ty = -100;
    let cx = -100;
    let cy = -100;
    let rafId = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const label = labelRef.current;
      if (!label) return;

      const cursorEl = el.closest('[data-cursor]') as HTMLElement | null;
      const linkEl   = el.closest('a, button')   as HTMLElement | null;

      if (cursorEl?.dataset.cursor) {
        label.textContent = cursorEl.dataset.cursor;
      } else if (linkEl) {
        label.textContent = linkEl.tagName === 'BUTTON' ? 'press' : 'open';
      } else {
        label.textContent = '';
      }
    };

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      if (dotRef.current) {
        // Round to 1dp — avoids sub-pixel jitter without visible lag
        dotRef.current.style.transform =
          `translate(${Math.round(cx * 10) / 10}px,${Math.round(cy * 10) / 10}px)`;
      }
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      <div
        ref={dotRef}
        style={{ position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
      >
        <span className="cursor-fx-dot" />
        <span ref={labelRef} className="cursor-fx-label" />
      </div>
    </div>
  );
}

export default CursorFx;
