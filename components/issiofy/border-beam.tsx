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
          const phase = (time / 5.8) * Math.PI * 2;
          const gradient = ctx!.createConicGradient(
            phase,
            pad + width / 2,
            pad + height / 2,
          );
          const rgba = (n: number, alpha: number) =>
            'rgba(' + rgb[n].join(',') + ',' + alpha + ')';
          gradient.addColorStop(0, rgba(0, 0));
          gradient.addColorStop(0.12, rgba(0, 0.12));
          gradient.addColorStop(0.27, rgba(0, 0.65));
          gradient.addColorStop(0.38, rgba(1, 1));
          gradient.addColorStop(0.44, rgba(2, 0.8));
          gradient.addColorStop(0.5, rgba(2, 0));
          gradient.addColorStop(1, rgba(2, 0));
          const path = new Path2D();
          path.roundRect(pad + 0.5, pad + 0.5, w, h, r);
          const pulse = s.size.startsWith('pulse')
            ? 0.8 + 0.2 * Math.sin(time * 2)
            : 1;
          ctx!.strokeStyle = gradient;
          ctx!.shadowBlur = 0;
          ctx!.filter = 'blur(5px)';
          ctx!.lineWidth = s.size === 'line' ? 2 : 7;
          ctx!.globalAlpha = power * 0.55 * pulse;
          ctx!.stroke(path);
          ctx!.filter = 'none';
          ctx!.lineWidth = s.size === 'sm' ? 1.5 : 2;
          ctx!.globalAlpha = Math.min(1, power * 1.4) * pulse;
          ctx!.stroke(path);
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
