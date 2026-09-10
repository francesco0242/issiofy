'use client';
import { useState, type CSSProperties } from 'react';
export type CodeFile = { name: string; language?: string; code: string };
export type CodeBlockProps = {
  files?: CodeFile[];
  className?: string;
  style?: CSSProperties;
};
const samples: CodeFile[] = [
  {
    name: 'page.tsx',
    language: 'tsx',
    code: 'import { Suspense } from "react";\nimport { Dashboard } from "./dashboard";\n\nexport default function Page() {\n  return (\n    <Suspense fallback={<Skeleton />}>\n      <Dashboard />\n    </Suspense>\n  );\n}',
  },
  {
    name: 'install.sh',
    language: 'shell',
    code: 'npx shadcn@latest add \\\n  https://issiofy.com/r/code-block',
  },
];
/** Dependency-free code tabs with line numbers and clipboard feedback. */
export default function CodeBlock({
  files = samples,
  className = '',
  style,
}: CodeBlockProps) {
  const [index, setIndex] = useState(0),
    [status, setStatus] = useState('');
  const active = files[Math.min(index, files.length - 1)];
  const copy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.code);
      setStatus('Copied');
    } catch {
      setStatus('Copy unavailable');
    }
  };
  const highlight = (text: string) =>
    text
      .split(
        /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|export|default|function|return|const|async|await)\b|\/\/.*$)/g,
      )
      .map((s, i) => (
        <span
          key={i}
          style={{
            color: /^["']/.test(s)
              ? '#a5d6ba'
              : /^(import|from|export|default|function|return|const|async|await)$/.test(
                    s,
                  )
                ? '#c4b5fd'
                : s.startsWith('//')
                  ? '#737e8c'
                  : undefined,
          }}
        >
          {s}
        </span>
      ));
  return (
    <section
      className={'ic-code ' + className}
      style={style}
      aria-label="Code example"
    >
      <style>{`
 .ic-code{width:100%;max-width:640px;border:1px solid #ffffff17;border-radius:16px;background:#101216;overflow:hidden;box-shadow:0 20px 50px #0003;color:#d9e2ee;font-family:inherit}
 .ic-code-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 15px;border-bottom:1px solid #ffffff0c;background:#ffffff03}
 .ic-code-tabs{display:flex;gap:18px;overflow:auto}.ic-code-tabs button{font:12px monospace;color:#7e8896;white-space:nowrap;padding:16px 0;border:0;border-bottom:2px solid transparent;background:none;cursor:pointer}
 .ic-code-tabs button[aria-selected=true]{color:#e2e8f0;border-bottom-color:#b8a2e7}.ic-copy{font:12px inherit;color:#a8b1be;border:1px solid #ffffff16;border-radius:7px;padding:6px 9px;white-space:nowrap;cursor:pointer;background:#ffffff04}
 .ic-code pre{padding:23px 20px;margin:0;overflow:auto;line-height:1.85;font:12px/1.9 ui-monospace,SFMono-Regular,Consolas,monospace}
 .ic-line{display:flex;min-height:23px}.ic-ln{user-select:none;width:26px;flex-shrink:0;color:#444e5e;margin-right:12px;text-align:right}.ic-code-foot{padding:10px 18px;border-top:1px solid #ffffff0b;display:flex;justify-content:space-between;color:#6f7986;font:10px monospace}
 .ic-code button:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}
 `}</style>
      <div className="ic-code-head">
        <div className="ic-code-tabs" role="tablist" aria-label="Example files">
          {files.map((f, i) => (
            <button
              type="button"
              role="tab"
              aria-selected={i === index}
              key={f.name}
              onClick={() => {
                setIndex(i);
                setStatus('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const next =
                    (i + (e.key === 'ArrowRight' ? 1 : -1) + files.length) %
                    files.length;
                  setIndex(next);
                  setStatus('');
                  (
                    e.currentTarget.parentElement?.children[next] as HTMLElement
                  )?.focus();
                }
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="ic-copy">
          {status || 'Copy code'}
        </button>
      </div>
      {active ? (
        <pre role="tabpanel" aria-label={active.name}>
          <code>
            {active.code.split('\n').map((line, i) => (
              <span key={i} className="ic-line">
                <span className="ic-ln" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{highlight(line)}</span>
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      ) : (
        <p style={{ padding: 24 }}>No code to display.</p>
      )}
      <footer className="ic-code-foot">
        <span>{active?.language?.toUpperCase() || 'TEXT'}</span>
        <output>{status || 'SELECT · COPY · SHIP'}</output>
      </footer>
    </section>
  );
}
