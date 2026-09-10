'use client';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
export type InteractionProps = {
  variant?: 'hologram' | 'equalizer';
  color?: string;
  speed?: number;
  intensity?: number;
  paused?: boolean;
  interactive?: boolean;
  level?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};
const defaults = /* ISSIOFY_VISUAL_DEFAULTS */ {
  variant: 'hologram',
  color: '#a779ff',
  speed: 1,
  intensity: 65,
}; /* END_VISUAL_DEFAULTS */
export default function Visual({
  variant = defaults.variant as 'hologram' | 'equalizer',
  color = defaults.color,
  speed = defaults.speed,
  intensity = defaults.intensity,
  paused = false,
  interactive = true,
  level,
  children,
  className = '',
  style,
}: InteractionProps) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ color, speed, intensity, paused, interactive, level });
  useEffect(() => {
    live.current = { color, speed, intensity, paused, interactive, level };
  }, [color, speed, intensity, paused, interactive, level]);
  useEffect(() => {
    const el = root.current,
      c = canvas.current;
    if (!el) return;
    const ctx = c?.getContext('2d');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0,
      h = 0,
      frame = 0,
      t = 1.8,
      last = 0,
      visible = true,
      dirty = true,
      tx = 0,
      ty = 0,
      x = 0,
      y = 0,
      amplitude = 0.6,
      signature = '';
    const resize = () => {
      if (!c || !ctx) return;
      const r = c.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const d = Math.min(devicePixelRatio || 1, 2);
      c.width = w * d;
      c.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c || el);
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      dirty = true;
    });
    io.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      dirty = true;
    };
    const leave = () => {
      tx = ty = 0;
      dirty = true;
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const s = live.current;
      const next = JSON.stringify(s);
      if (next !== signature) {
        dirty = true;
        signature = next;
      }
      const run = !s.paused && !motion.matches;
      if (visible && !document.hidden && (run || dirty)) {
        if (run) t += dt * Math.max(0, s.speed);
        x += ((s.interactive && run ? tx : 0) - x) * 0.1;
        y += ((s.interactive && run ? ty : 0) - y) * 0.1;
        const autoX = run ? Math.sin(t * 0.45) * 0.12 : 0,
          autoY = run ? Math.cos(t * 0.4) * 0.1 : 0;
        el.style.setProperty('--ix', String(x + autoX));
        el.style.setProperty('--iy', String(y + autoY));
        el.style.setProperty('--light-x', 50 + (x + autoX) * 32 + '%');
        el.style.setProperty('--light-y', 50 + (y + autoY) * 32 + '%');
        if (c && ctx && variant === 'equalizer' && w && h) {
          const target =
            s.level === undefined
              ? 0.52 + 0.21 * Math.sin(t * 1.15) + 0.12 * Math.cos(t * 2.7)
              : Math.min(1, Math.max(0, s.level));
          amplitude += (target - amplitude) * Math.min(1, dt * 10);
          ctx.clearRect(0, 0, w, h);
          const count = 55,
            gap = w / (count + 2),
            bw = Math.max(2, gap * 0.52),
            cy = h * 0.5;
          const gradient = ctx.createLinearGradient(0, 0, w, h);
          gradient.addColorStop(0, '#4f7c92');
          gradient.addColorStop(0.35, s.color);
          gradient.addColorStop(0.52, '#e8fff5');
          gradient.addColorStop(0.75, s.color);
          gradient.addColorStop(1, '#497880');
          ctx.fillStyle = '#ffffff0c';
          for (let i = 0; i < count; i++)
            for (let j = -6; j <= 6; j++) {
              ctx.beginPath();
              ctx.arc((i + 1.5) * gap, cy + j * 9, 0.7, 0, Math.PI * 2);
              ctx.fill();
            }
          for (let i = 0; i < count; i++) {
            const u = i / (count - 1),
              envelope = Math.pow(Math.sin(Math.PI * u), 1.1);
            const wave =
              0.32 +
              0.42 * Math.pow(Math.sin(u * 11 - t * 2.8), 2) +
              0.26 * Math.pow(Math.sin(u * 23 + t * 1.8), 2);
            const bh =
              3 +
              Math.min(h * 0.86, 145) *
                envelope *
                wave *
                amplitude *
                (s.intensity / 65);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.4 + 0.6 * envelope;
            ctx.beginPath();
            ctx.roundRect(
              (i + 1.5) * gap - bw / 2,
              cy - bh / 2,
              bw,
              bh,
              bw / 2,
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        dirty = false;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [variant]);
  return (
    <div
      ref={root}
      className={'ii-stage ' + className}
      style={{ '--foil-accent': color, ...style } as CSSProperties}
    >
      <style>{`
 .ii-stage{width:100%;height:100%;min-height:180px;display:grid;place-items:center;perspective:900px;position:relative;font-family:inherit;padding:24px;box-sizing:border-box}
 .ii-card{position:relative;width:min(100%,356px);aspect-ratio:1.52;border-radius:20px;padding:25px;isolation:isolate;overflow:hidden;background:#16191e;color:#eff3fa;border:1px solid #ffffff30;box-shadow:0 24px 44px #0005,inset 0 1px 0 #ffffff2c;transform:rotateX(calc(var(--iy,0)*-9deg)) rotateY(calc(var(--ix,0)*12deg))}
 .ii-card:before{content:'';position:absolute;z-index:-1;inset:-80%;background:repeating-conic-gradient(from 20deg at var(--light-x,50%) var(--light-y,50%),#7772a5 0deg,#5da7a0 35deg,#dfb4b0 70deg,#6b84b0 110deg,#7772a5 180deg);opacity:.28;filter:saturate(.7);transform:translate(calc(var(--ix,0)*8%),calc(var(--iy,0)*8%))}
 .ii-card:after{content:'';pointer-events:none;position:absolute;inset:0;background:radial-gradient(ellipse at var(--light-x,50%) var(--light-y,50%),#fff5,transparent 55%),repeating-linear-gradient(115deg,#fff0 0 2px,#fff1 3px,transparent 4px);mix-blend-mode:soft-light}
 .ii-card-content{height:100%;display:flex;flex-direction:column;justify-content:space-between;position:relative}
 .ii-card-top,.ii-card-foot{display:flex;justify-content:space-between;align-items:center;gap:14px;font-size:10px;letter-spacing:.14em;color:#d0d3db}
 .ii-card-foot{letter-spacing:.08em;font-family:monospace;color:#a4b3c0;font-size:11px}
 .ii-card-title{font-size:26px;line-height:1.08;font-weight:500;letter-spacing:-1px}
 .ii-seal{position:absolute;right:0;top:40px;width:80px;height:80px;border-radius:50%;background:repeating-radial-gradient(circle,#ffffff15 0 1px,transparent 2px 4px),conic-gradient(from 20deg,#a7b7cd,#b7a4c7,#b4dacc,#d9bc9f,#9eb3d2,#a7b7cd);display:grid;place-items:center;box-shadow:inset 0 0 15px #fff4;transform:rotate(calc(var(--ix,0)*30deg));color:#283344}
 .ii-seal svg{width:38px;height:38px}
 .ii-meter{width:min(100%,390px);padding:24px;border:1px solid #ffffff14;border-radius:22px;background:radial-gradient(ellipse at 50% 55%,#6ee7c709,transparent 65%),#111517;box-shadow:0 20px 50px #0004}
 .ii-meter-head,.ii-meter-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}
 .ii-meter-head{font-size:12px;color:#8caaa5}.ii-meter-head span:first-child{display:flex;align-items:center;gap:9px}.ii-meter-head i{width:6px;height:6px;background:#86e5ba;border-radius:50%;box-shadow:0 0 10px #86e5ba66}
 .ii-meter canvas{display:block;width:100%;height:145px}
 .ii-meter-foot{padding-top:12px;border-top:1px solid #ffffff0a;color:#d0d9d8;font-size:13px}
 .ii-meter-foot span:last-child{font:10px monospace;color:#6e8885}
 @media(max-width:520px){.ii-stage{padding:20px}.ii-card{padding:20px}.ii-card-title{font-size:24px}.ii-seal{width:64px;height:64px;top:37px}.ii-meter{padding:20px}.ii-meter canvas{height:120px}}
 @media(prefers-reduced-motion:reduce){.ii-card,.ii-seal{transform:none!important}}
 `}</style>
      {variant === 'hologram' ? (
        <div className="ii-card">
          <div className="ii-card-content">
            {children ?? (
              <>
                <div className="ii-card-top">
                  <span>ISSIOFY®</span>
                  <span>DEVELOPER PASS</span>
                </div>
                <div className="ii-card-title">
                  Built for
                  <br />
                  what comes next.
                </div>
                <div className="ii-card-foot">
                  <span>MEMBER / 0001</span>
                  <span>∞ ACCESS</span>
                </div>
                <div className="ii-seal" aria-hidden>
                  <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 2v36M2 20h36M7 7l26 26M7 33 33 7M12 2l16 36M2 12l36 16M2 28l36-16M12 38 28 2" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="ii-meter">
          <div className="ii-meter-head">
            <span>
              <i />
              VOICE CHANNEL
            </span>
            <span>01 / LIVE</span>
          </div>
          <canvas ref={canvas} aria-hidden="true" />
          <div className="ii-meter-foot">
            <span>
              {children ??
                (level === undefined
                  ? 'A little voice. A lot of presence.'
                  : 'Audio input')}
            </span>
            <span>{level === undefined ? 'DEMO SIGNAL' : 'LIVE LEVEL'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
