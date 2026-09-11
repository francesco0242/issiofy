'use client';
import { useId, useState, type CSSProperties } from 'react';
export type ExpandableItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  color?: string;
  href?: string;
  linkLabel?: string;
};
export type ExpandableCardsProps = {
  items?: ExpandableItem[];
  defaultOpen?: string | null;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  onOpenChange?: (id: string | null) => void;
};
const samples: ExpandableItem[] = [
  {
    id: 'orbit',
    title: 'Orbit',
    category: 'BRAND & DIGITAL',
    description:
      'A new identity for teams working beyond the ordinary. From the first sketch to the final interaction.',
    color: '#b3a0ff',
  },
  {
    id: 'forma',
    title: 'Forma',
    category: 'PRODUCT DESIGN',
    description:
      'A focused workspace that brings projects, people and ideas into one clear view.',
    color: '#9ee6cb',
  },
  {
    id: 'index',
    title: 'Index',
    category: 'EDITORIAL SYSTEM',
    description:
      'A home for stories worth exploring. Built around expressive typography and thoughtful details.',
    color: '#ffc58f',
  },
];
/** Expand in place. Focus stays on the native trigger; hidden links leave the tab order. */
export default function ExpandableCards({
  items = samples,
  defaultOpen = 'orbit',
  paused = false,
  className = '',
  style,
  onOpenChange,
}: ExpandableCardsProps) {
  const [open, setOpen] = useState<string | null>(defaultOpen),
    uid = useId();
  return (
    <div className={'iex-list ' + className} style={style} data-paused={paused}>
      <style>{`
 .iex-list{display:grid;gap:10px;width:100%;max-width:500px;color:#f5f5f8;font-family:inherit;box-sizing:border-box}
 .iex-item{overflow:hidden;border-radius:18px;background:#14151a;border:1px solid #ffffff12}
 .iex-trigger{display:flex;width:100%;align-items:center;gap:18px;padding:16px;text-align:left;cursor:pointer;color:inherit;background:none;border:0;font-family:inherit}
 .iex-art{position:relative;flex-shrink:0;display:grid;place-items:center;width:62px;height:62px;border-radius:12px;background:radial-gradient(ellipse at 20% 10%,var(--iex-color),#26232e 85%);overflow:hidden;transition:width .5s cubic-bezier(.2,.8,.2,1),height .5s cubic-bezier(.2,.8,.2,1)}
 .iex-art svg{width:78%;height:78%;color:#ffffffb0;rotate:-18deg;transition:rotate .6s}.iex-item[data-open=true] .iex-art{width:90px;height:90px}.iex-item[data-open=true] .iex-art svg{rotate:12deg}
 .iex-title{flex:1;min-width:0}.iex-title strong{display:block;font-size:21px;font-weight:500;letter-spacing:-.025em}.iex-title small{display:block;font-size:11px;letter-spacing:.09em;color:#a5a4b0;margin-top:6px}
 .iex-plus{font-size:24px;font-weight:300;color:#aaa8b5;transition:rotate .4s}.iex-item[data-open=true] .iex-plus{rotate:45deg}
 .iex-collapse{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .5s cubic-bezier(.2,.8,.2,1),opacity .35s}
 .iex-item[data-open=true] .iex-collapse{grid-template-rows:1fr;opacity:1}.iex-inner{overflow:hidden;min-height:0}.iex-body{padding:2px 24px 24px}
 .iex-body p{margin:0;font-size:14px;line-height:1.7;color:#b4b2c0}.iex-body a{display:inline-flex;align-items:center;gap:18px;color:var(--iex-color);font-size:14px;margin-top:18px;text-decoration:none}
 .iex-trigger:focus-visible{outline:2px solid var(--iex-color);outline-offset:-3px;border-radius:16px}.iex-body a:focus-visible{outline:2px solid var(--iex-color);outline-offset:4px}
 .iex-list[data-paused=true] *{transition:none}
 @media(prefers-reduced-motion:reduce){.iex-list *{transition:none!important}}
 @media(max-width:420px){.iex-trigger{gap:12px;padding:14px}.iex-title strong{font-size:19px}.iex-title small{font-size:10px}.iex-body{padding:0 18px 18px}.iex-item[data-open=true] .iex-art{width:72px;height:72px}}
 `}</style>
      {items.map((item, i) => {
        const expanded = open === item.id,
          panel = uid + '-' + i;
        return (
          <article
            className="iex-item"
            key={item.id}
            data-open={expanded}
            style={{ '--iex-color': item.color ?? '#b3a0ff' } as CSSProperties}
          >
            <button
              type="button"
              className="iex-trigger"
              aria-expanded={expanded}
              aria-controls={panel}
              onClick={() => {
                const next = expanded ? null : item.id;
                setOpen(next);
                onOpenChange?.(next);
              }}
            >
              <span className="iex-art" aria-hidden>
                <svg viewBox="0 0 100 100" fill="none">
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="35"
                    ry="19"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="35"
                    ry="19"
                    stroke="currentColor"
                    strokeWidth="2"
                    transform="rotate(60 50 50)"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="35"
                    ry="19"
                    stroke="currentColor"
                    strokeWidth="2"
                    transform="rotate(120 50 50)"
                  />
                  <circle cx="50" cy="50" r="6" fill="currentColor" />
                </svg>
              </span>
              <span className="iex-title">
                <strong>{item.title}</strong>
                <small>{item.category}</small>
              </span>
              <span className="iex-plus" aria-hidden>
                +
              </span>
            </button>
            <div
              className="iex-collapse"
              id={panel}
              inert={!expanded}
              aria-hidden={!expanded}
            >
              <div className="iex-inner">
                <div className="iex-body">
                  <p>{item.description}</p>
                  {item.href && (
                    <a href={item.href}>
                      {item.linkLabel ?? 'Explore project'}{' '}
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
