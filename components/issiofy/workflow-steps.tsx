'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
export type WorkflowStep = {
  id: string;
  title: string;
  description?: string;
  status: 'queued' | 'running' | 'done' | 'error';
};
export type WorkflowStepsProps = {
  steps?: WorkflowStep[];
  autoplay?: boolean;
  paused?: boolean;
  accent?: string;
  className?: string;
  style?: CSSProperties;
};
const initial: WorkflowStep[] = [
  {
    id: 'read',
    title: 'Read the brief',
    description: 'Context and requirements',
    status: 'done',
  },
  {
    id: 'build',
    title: 'Build the interface',
    description: 'Components and interactions',
    status: 'running',
  },
  {
    id: 'review',
    title: 'Review the result',
    description: 'Ready for your feedback',
    status: 'queued',
  },
];
const labels = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  error: 'Needs attention',
};
/** Controlled pipeline UI; autoplay is an optional, explicitly enabled demo. No work is executed. */
export default function WorkflowSteps({
  steps,
  autoplay = false,
  paused = false,
  accent = '#a4e7cc',
  className = '',
  style,
}: WorkflowStepsProps) {
  const [phase, setPhase] = useState(1),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!autoplay || paused || steps) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    if (ref.current) io.observe(ref.current);
    const timer = setInterval(() => {
      if (!motion.matches && visible && !document.hidden)
        setPhase((p) => (p + 1) % 4);
    }, 1900);
    return () => {
      clearInterval(timer);
      io.disconnect();
    };
  }, [autoplay, paused, steps]);
  const list =
    steps ??
    initial.map((s, i) => ({
      ...s,
      status: (i < phase
        ? 'done'
        : i === phase
          ? 'running'
          : 'queued') as WorkflowStep['status'],
    }));
  const complete = list.filter((s) => s.status === 'done').length;
  return (
    <div
      ref={ref}
      className={'iwf-flow ' + className}
      data-paused={paused}
      style={{ '--iwf-accent': accent, ...style } as CSSProperties}
    >
      <style>{`
 .iwf-flow{width:100%;max-width:430px;box-sizing:border-box;font-family:inherit;color:#efeff4;background:#111518;border:1px solid #ffffff14;border-radius:22px;padding:26px}
 .iwf-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:22px;border-bottom:1px solid #ffffff0e;gap:12px}.iwf-head strong{font-weight:500;font-size:15px}.iwf-head span{color:#97a2a3;font-size:12px}
 .iwf-list{list-style:none;margin:24px 0;padding:0}.iwf-step{position:relative;display:flex;gap:16px;padding:0 0 28px}.iwf-step:last-child{padding-bottom:0}
 .iwf-step:not(:last-child):before{content:"";position:absolute;left:15px;top:37px;bottom:6px;width:1px;background:#ffffff13;transition:background .4s}.iwf-step[data-status=done]:before{background:var(--iwf-accent)}
 .iwf-mark{position:relative;display:grid;place-items:center;width:32px;height:32px;flex-shrink:0;border:1px solid #ffffff1c;border-radius:50%;font-size:13px;color:#7e8b8e;box-sizing:border-box;transition:background .4s,color .4s}
 .iwf-step[data-status=done] .iwf-mark{background:var(--iwf-accent);color:#0c2018;border-color:transparent}
 .iwf-step[data-status=running] .iwf-mark{color:var(--iwf-accent);border-color:var(--iwf-accent)}.iwf-step[data-status=running] .iwf-mark:after{content:"";position:absolute;inset:-5px;border:1px solid var(--iwf-accent);border-radius:50%;animation:iwf-pulse 1.8s ease-out infinite}
 .iwf-step[data-status=error] .iwf-mark{color:#ff9c9c;border-color:#ff9c9c}.iwf-info{min-width:0;flex:1}.iwf-info strong{display:block;font-size:15px;font-weight:500;line-height:1.4}.iwf-info p{font-size:12px;color:#869296;margin:5px 0 0;line-height:1.5}
 .iwf-status{font-size:11px;color:#8c999b;padding-top:5px;white-space:nowrap}.iwf-step[data-status=running] .iwf-status{color:var(--iwf-accent)}.iwf-step[data-status=error] .iwf-status{color:#ff9c9c}
 .iwf-progress{height:3px;background:#ffffff0a;border-radius:3px;overflow:hidden}.iwf-progress span{display:block;height:100%;background:var(--iwf-accent);transition:width .5s ease}
 .iwf-footer{display:flex;justify-content:space-between;margin-top:12px;color:#8e9b9c;font-size:12px}
 @keyframes iwf-pulse{from{opacity:.5;scale:.88}to{opacity:0;scale:1.35}}
 .iwf-flow[data-paused=true] *,.iwf-flow[data-paused=true] *:after{animation-play-state:paused;transition:none}
 @media(prefers-reduced-motion:reduce){.iwf-flow *,.iwf-flow *:after{animation:none!important;transition:none!important}}
 @media(max-width:400px){.iwf-flow{padding:20px}.iwf-status{display:none}.iwf-step{gap:12px}}
 `}</style>
      <header className="iwf-head">
        <strong>From prompt to product</strong>
        <span>{String(list.length).padStart(2, '0')} STEPS</span>
      </header>
      <ol className="iwf-list">
        {list.map((s, i) => (
          <li
            className="iwf-step"
            key={s.id}
            data-status={s.status}
            aria-current={s.status === 'running' ? 'step' : undefined}
          >
            <span className="iwf-mark" aria-hidden>
              {s.status === 'done' ? '✓' : s.status === 'error' ? '!' : i + 1}
            </span>
            <div className="iwf-info">
              <strong>{s.title}</strong>
              {s.description && <p>{s.description}</p>}
              <span className="iwf-status">{labels[s.status]}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="iwf-progress" aria-hidden>
        <span
          style={{
            width: (list.length ? (complete / list.length) * 100 : 0) + '%',
          }}
        />
      </div>
      <div className="iwf-footer">
        <output aria-live={autoplay ? 'off' : 'polite'}>
          {complete === list.length && list.length
            ? 'Ready for review'
            : complete + ' of ' + list.length + ' completed'}
        </output>
        <span>{autoplay ? 'Demo pipeline' : 'Workflow'}</span>
      </div>
    </div>
  );
}
