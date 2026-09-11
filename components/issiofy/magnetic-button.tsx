'use client';
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
} from 'react';
export type MagneticButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  strength?: number;
  paused?: boolean;
  accent?: string;
};
/** The hit area stays fixed while the visible button follows the pointer. */
export default function MagneticButton({
  children = 'Start something great',
  strength = 18,
  paused = false,
  accent = '#b6f3d0',
  className = '',
  style,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null),
    live = useRef({ strength, paused });
  useEffect(() => {
    live.current = { strength, paused };
  }, [strength, paused]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'),
      fine = matchMedia('(pointer:fine)');
    let frame = 0,
      x = 0,
      y = 0,
      tx = 0,
      ty = 0,
      vx = 0,
      vy = 0,
      last = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.67 || 1, 2);
      last = now;
      const stop = live.current.paused || reduced.matches || el.disabled;
      if (stop) tx = ty = x = y = vx = vy = 0;
      else {
        vx = (vx + (tx - x) * 0.13 * dt) * Math.pow(0.68, dt);
        vy = (vy + (ty - y) * 0.13 * dt) * Math.pow(0.68, dt);
        x += vx * dt;
        y += vy * dt;
      }
      el.style.setProperty('--imb-x', x.toFixed(2) + 'px');
      el.style.setProperty('--imb-y', y.toFixed(2) + 'px');
      if (
        !stop &&
        Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.04
      )
        frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const start = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const move = (e: PointerEvent) => {
      if (
        !fine.matches ||
        reduced.matches ||
        live.current.paused ||
        el.disabled
      )
        return;
      const b = el.getBoundingClientRect();
      const s = Math.min(40, Math.max(0, live.current.strength));
      tx = ((e.clientX - b.left) / b.width - 0.5) * s;
      ty = ((e.clientY - b.top) / b.height - 0.5) * s;
      start();
    };
    const reset = () => {
      tx = ty = 0;
      start();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('blur', reset);
    reduced.addEventListener('change', reset);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', reset);
      el.removeEventListener('blur', reset);
      reduced.removeEventListener('change', reset);
    };
  }, []);
  useEffect(() => {
    if (paused && ref.current) {
      ref.current.style.setProperty('--imb-x', '0px');
      ref.current.style.setProperty('--imb-y', '0px');
    }
  }, [paused]);
  return (
    <>
      <style>{`
 .imb-button{--imb-x:0px;--imb-y:0px;display:inline-flex;max-width:100%;padding:18px;border:0;background:none;color:#0c2116;cursor:pointer;font-family:inherit;box-sizing:border-box;border-radius:24px}
 .imb-surface{display:flex;align-items:center;justify-content:center;gap:30px;padding:18px 24px;border-radius:16px;background:var(--imb-accent);box-shadow:inset 0 1px 0 #ffffff80,0 12px 40px #0003;transform:translate(var(--imb-x),var(--imb-y));font-size:15px;font-weight:600;line-height:1.4;min-width:0}
 .imb-icon{display:grid;place-items:center;width:26px;height:26px;flex-shrink:0;transform:translate(calc(var(--imb-x)*.35),calc(var(--imb-y)*.35));transition:rotate .3s}
 .imb-button:hover .imb-icon{rotate:-35deg}.imb-button:active .imb-surface{scale:.97}.imb-button:focus-visible{outline:2px solid var(--imb-accent);outline-offset:2px}.imb-button:disabled{opacity:.45;cursor:not-allowed}
 @media(prefers-reduced-motion:reduce){.imb-surface,.imb-icon{transform:none!important;transition:none;rotate:none!important}.imb-button:active .imb-surface{scale:1}}
 `}</style>
      <button
        type="button"
        {...props}
        ref={ref}
        className={'imb-button ' + className}
        style={{ '--imb-accent': accent, ...style } as CSSProperties}
      >
        <span className="imb-surface">
          <span>{children}</span>
          <span className="imb-icon" aria-hidden>
            ↗
          </span>
        </span>
      </button>
    </>
  );
}
