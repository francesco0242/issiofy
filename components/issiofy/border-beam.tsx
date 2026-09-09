'use client';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
const defaults = /* ISSIOFY_BEAM */ {
  color: '#a779ff',
  speed: 1,
  intensity: 65,
}; /* END_BEAM */
export type BeamSize = 'sm' | 'md' | 'line' | 'pulse-inner' | 'pulse-outside';
export type BeamColorVariant =
  | 'colorful'
  | 'mono'
  | 'ocean'
  | 'sunset'
  | 'silver'
  | 'gold'
  | 'titanium';
export type BeamTheme = 'dark' | 'light';
export type BorderBeamProps = {
  children?: ReactNode;
  color?: string;
  speed?: number;
  intensity?: number;
  strength?: number;
  radius?: number;
  paused?: boolean;
  active?: boolean;
  size?: BeamSize;
  colorVariant?: BeamColorVariant;
  theme?: BeamTheme;
  className?: string;
  style?: CSSProperties;
};
/** Light sampled along the actual rounded perimeter, with a continuous tapered tail. */
export default function BorderBeam({
  children,
  color = defaults.color,
  speed = defaults.speed,
  intensity = defaults.intensity,
  strength,
  radius = 20,
  paused = false,
  active = true,
  size = 'md',
  colorVariant = 'colorful',
  theme = 'dark',
  className,
  style,
}: BorderBeamProps) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({
    color,
    speed,
    intensity,
    strength,
    radius,
    paused,
    active,
    size,
    colorVariant,
    theme,
  });
  useEffect(() => {
    live.current = {
      color,
      speed,
      intensity,
      strength,
      radius,
      paused,
      active,
      size,
      colorVariant,
      theme,
    };
  }, [
    color,
    speed,
    intensity,
    strength,
    radius,
    paused,
    active,
    size,
    colorVariant,
    theme,
  ]);
  useEffect(() => {
    const el = root.current,
      c = canvas.current;
    if (!el || !c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0,
      height = 0,
      frame = 0,
      time = 0.8,
      last = performance.now(),
      visible = true,
      dirty = true;
    const pad = 20;
    function resize() {
      width = el!.clientWidth;
      height = el!.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c!.width = Math.round((width + pad * 2) * dpr);
      c!.height = Math.round((height + pad * 2) * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      dirty = true;
    });
    io.observe(el);
    let signature = '';
    function draw(now: number) {
      const s = live.current,
        next = JSON.stringify(s);
      if (signature !== next) {
        signature = next;
        dirty = true;
      }
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const running =
        visible && !document.hidden && !s.paused && s.active && !motion.matches;
      if (running) time += dt * Math.max(0.2, s.speed);
      if (visible && !document.hidden && (running || dirty)) {
        dirty = false;
        ctx!.clearRect(0, 0, width + pad * 2, height + pad * 2);
        const w = width - 1,
          h = height - 1,
          r = Math.max(0, Math.min(s.radius - 0.5, w / 2, h / 2));
        const a = w - 2 * r,
          b = h - 2 * r,
          q = (Math.PI * r) / 2,
          total = 2 * a + 2 * b + 4 * q;
        function point(distance: number) {
          let d = ((distance % total) + total) % total;
          if (d < a) return [r + d, 0];
          d -= a;
          if (d < q) {
            const t = -Math.PI / 2 + d / Math.max(r, 0.001);
            return [w - r + Math.cos(t) * r, r + Math.sin(t) * r];
          }
          d -= q;
          if (d < b) return [w, r + d];
          d -= b;
          if (d < q) {
            const t = d / Math.max(r, 0.001);
            return [w - r + Math.cos(t) * r, h - r + Math.sin(t) * r];
          }
          d -= q;
          if (d < a) return [w - r - d, h];
          d -= a;
          if (d < q) {
            const t = Math.PI / 2 + d / Math.max(r, 0.001);
            return [r + Math.cos(t) * r, h - r + Math.sin(t) * r];
          }
          d -= q;
          if (d < b) return [0, h - r - d];
          d -= b;
          const t = Math.PI + d / Math.max(r, 0.001);
          return [r + Math.cos(t) * r, r + Math.sin(t) * r];
        }
        if (total > 0) {
          const power = Math.max(
            0,
            Math.min(1, s.strength ?? s.intensity / 100),
          );
          const colors =
            s.colorVariant === 'silver'
              ? ['#626975', '#f5f7ff', '#818999']
              : s.colorVariant === 'gold'
                ? ['#695434', '#fff0bc', '#b59254']
                : s.colorVariant === 'titanium'
                  ? ['#57545e', '#e8ddeb', '#9293ad']
                  : s.colorVariant === 'mono'
                    ? [s.color, s.color, s.color]
                    : s.colorVariant === 'ocean'
                      ? ['#5eead4', '#60a5fa', '#a5b4fc']
                      : s.colorVariant === 'sunset'
                        ? ['#fb7185', '#f0abfc', '#fdba74']
                        : [s.color, '#b8a0ed', '#7dd3d0'];
          const rgb = colors.map((hex) => {
            const value = hex.replace('#', '');
            const full =
              value.length === 3
                ? value
                    .split('')
                    .map((c) => c + c)
                    .join('')
                : value;
            return [0, 2, 4].map(
              (i) => parseInt(full.slice(i, i + 2), 16) || 0,
            );
          });
          const length =
            total * (s.size === 'line' ? 0.48 : s.size === 'sm' ? 0.3 : 0.38);
          const head = (time / 4.3) * total;
          const pulse = s.size.startsWith('pulse')
            ? 0.7 + 0.3 * Math.sin(time * 2)
            : 1;
          for (let layer = 0; layer < 2; layer++) {
            ctx!.lineWidth = layer === 0 ? 5 : 1.25;
            ctx!.lineCap = 'round';
            ctx!.shadowBlur = layer === 0 ? 10 : 0;
            const steps = Math.min(180, Math.max(64, Math.ceil(length / 2)));
            for (let i = 0; i < steps; i++) {
              const u = i / steps,
                envelope = Math.pow(Math.sin(Math.PI * u), 1.7) * power * pulse;
              const p = point(head - length + u * length),
                n = point(head - length + ((i + 1) / steps) * length);
              const stop = Math.min(1, Math.floor(u * 2)),
                blend = u * 2 - stop;
              const col =
                'rgb(' +
                rgb[stop]
                  .map((v, j) => Math.round(v + (rgb[stop + 1][j] - v) * blend))
                  .join(',') +
                ')';
              ctx!.globalAlpha = envelope * (layer === 0 ? 0.18 : 0.95);
              ctx!.strokeStyle = col;
              ctx!.shadowColor = col;
              ctx!.beginPath();
              ctx!.moveTo(p[0] + pad + 0.5, p[1] + pad + 0.5);
              ctx!.lineTo(n[0] + pad + 0.5, n[1] + pad + 0.5);
              ctx!.stroke();
            }
          }
          ctx!.globalAlpha = 1;
          ctx!.shadowBlur = 0;
        }
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
    };
  }, []);
  return (
    <div
      ref={root}
      className={className}
      data-issiofy-beam=""
      style={{
        position: 'relative',
        isolation: 'isolate',
        borderRadius: radius,
        background: theme === 'light' ? '#fafafa' : '#161618',
        boxShadow:
          'inset 0 0 0 1px ' + (theme === 'light' ? '#00000015' : '#ffffff12'),
        color: theme === 'light' ? '#18181b' : '#f4f4f5',
        ...style,
      }}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -20,
          top: -20,
          width: 'calc(100% + 40px)',
          height: 'calc(100% + 40px)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <div style={{ position: 'relative', borderRadius: 'inherit' }}>
        {children}
      </div>
    </div>
  );
}

/** Brushed-metal light with a bright reflection and a restrained tail. */
export function MetallicBorder({
  metal = 'silver',
  ...props
}: Omit<BorderBeamProps, 'colorVariant'> & {
  metal?: 'silver' | 'gold' | 'titanium';
}) {
  return <BorderBeam {...props} colorVariant={metal} />;
}
