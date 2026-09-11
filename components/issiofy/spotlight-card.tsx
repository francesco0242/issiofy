'use client';
import { useRef, type HTMLAttributes, type CSSProperties } from 'react';
export type SpotlightCardProps = HTMLAttributes<HTMLDivElement> & {
  color?: string;
  radius?: number;
  paused?: boolean;
};
/** Wrap any card content. Light follows pointer or keyboard focus. */
export default function SpotlightCard({
  children,
  color = '#b5a0ff',
  radius = 22,
  paused = false,
  className = '',
  style,
  ...props
}: SpotlightCardProps) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      {...props}
      ref={root}
      className={'isp-card ' + className}
      data-paused={paused}
      style={
        {
          '--isp-color': color,
          borderRadius: radius,
          ...style,
        } as CSSProperties
      }
      onPointerMove={(e) => {
        props.onPointerMove?.(e);
        if (paused || e.pointerType === 'touch') return;
        const b = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--isp-x', e.clientX - b.left + 'px');
        e.currentTarget.style.setProperty('--isp-y', e.clientY - b.top + 'px');
      }}
      onPointerLeave={(e) => {
        props.onPointerLeave?.(e);
        e.currentTarget.style.setProperty('--isp-x', '50%');
        e.currentTarget.style.setProperty('--isp-y', '30%');
      }}
    >
      <style>{`
 .isp-card{--isp-x:50%;--isp-y:30%;position:relative;isolation:isolate;box-sizing:border-box;width:100%;border:1px solid #ffffff17;overflow:hidden;background:#111216;color:#f6f6f8}
 .isp-card:before,.isp-card:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1}
 .isp-card:before{background:radial-gradient(300px circle at var(--isp-x) var(--isp-y),color-mix(in srgb,var(--isp-color) 18%,transparent),transparent 75%);opacity:.55;transition:opacity .3s}
 .isp-card:after{border:1px solid transparent;background:radial-gradient(200px circle at var(--isp-x) var(--isp-y),var(--isp-color),transparent 80%) border-box;mask:linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0);mask-composite:exclude;opacity:.6}
 .isp-card:hover:before,.isp-card:focus-within:before{opacity:1}.isp-card:focus-within{outline:2px solid var(--isp-color);outline-offset:3px}
 .isp-default{padding:30px}.isp-emblem{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:var(--isp-color);background:#ffffff07;border:1px solid #ffffff15;font-size:26px;margin-bottom:38px}
 .isp-default h3{font-family:inherit;font-size:24px;font-weight:500;line-height:1.2;letter-spacing:-.035em;margin:0 0 12px}.isp-default p{color:#a5a4b3;line-height:1.6;font-size:15px;margin:0;max-width:32ch}.isp-default footer{display:flex;align-items:center;justify-content:space-between;margin-top:32px;padding-top:18px;border-top:1px solid #ffffff0c;font-size:12px;color:#c5c2d2}
 .isp-card[data-paused=true]:before{transition:none}
 @media(prefers-reduced-motion:reduce){.isp-card{--isp-x:50%!important;--isp-y:30%!important}.isp-card:before{transition:none}}
 `}</style>
      {children ?? (
        <div className="isp-default">
          <div className="isp-emblem" aria-hidden>
            ✳
          </div>
          <h3>A place for your next idea.</h3>
          <p>Bring your tools, your team and your best work together.</p>
          <footer>
            <span>YOUR WORKSPACE</span>
            <span aria-hidden>↗</span>
          </footer>
        </div>
      )}
    </div>
  );
}
