'use client';
import { useEffect, useRef, type CSSProperties, type ElementType } from 'react';
export type TextRevealProps = {
  text?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  mode?: 'words' | 'lines';
  duration?: number;
  stagger?: number;
  replayKey?: number;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
};
/** Semantic, SSR-visible text. An intersection starts the reveal once per replayKey. */
export default function TextReveal({
  text = 'A few words.\nA lasting impression.',
  as = 'h2',
  mode = 'words',
  duration = 700,
  stagger = 65,
  replayKey = 0,
  paused = false,
  className = '',
  style,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || paused) {
      el.dataset.phase = 'visible';
      return;
    }
    el.dataset.phase = 'waiting';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.phase = 'revealing';
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    const change = () => {
      if (motion.matches) el.dataset.phase = 'visible';
    };
    motion.addEventListener('change', change);
    return () => {
      io.disconnect();
      motion.removeEventListener('change', change);
    };
  }, [replayKey, text, mode, paused]);
  const Tag = as as ElementType;
  let index = 0;
  return (
    <>
      <style>{`
 .itr-text{margin:0;color:#f4f2f8;font-family:inherit;font-weight:500;font-size:clamp(28px,4vw,48px);line-height:1.13;letter-spacing:-.045em;text-wrap:balance}
 .itr-line{display:block}.itr-unit{display:inline-block;white-space:pre-wrap}
 .itr-text[data-phase=waiting] .itr-unit{opacity:0;filter:blur(8px);transform:translateY(18px)}
 .itr-text[data-phase=revealing] .itr-unit{animation:itr-enter var(--itr-duration) cubic-bezier(.16,1,.3,1) both;animation-delay:var(--itr-delay);animation-play-state:var(--itr-play)}
 @keyframes itr-enter{from{opacity:0;filter:blur(8px);transform:translateY(18px)}to{opacity:1;filter:blur(0);transform:translateY(0)}}
 @media(prefers-reduced-motion:reduce){.itr-text .itr-unit{animation:none!important;opacity:1!important;filter:none!important;transform:none!important}}
 `}</style>
      <Tag
        ref={ref}
        className={'itr-text ' + className}
        data-phase="visible"
        style={
          {
            '--itr-duration': Math.max(0, duration) + 'ms',
            '--itr-play': paused ? 'paused' : 'running',
            ...style,
          } as CSSProperties
        }
      >
        {text.split('\n').map((line, i) => (
          <span className="itr-line" key={i}>
            {(mode === 'lines' ? [line] : line.split(/(\s+)/)).map((word, j) =>
              /^\s+$/.test(word) ? (
                word
              ) : (
                <span
                  className="itr-unit"
                  key={j}
                  style={
                    {
                      '--itr-delay':
                        Math.min(2500, index++ * Math.max(0, stagger)) + 'ms',
                    } as CSSProperties
                  }
                >
                  {word}
                </span>
              ),
            )}
          </span>
        ))}
      </Tag>
    </>
  );
}
