'use client';
import { useState, useRef, type CSSProperties } from 'react';
export type UploadItem = {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'queued' | 'uploading' | 'complete' | 'error';
};
export type UploadQueueProps = {
  items?: UploadItem[];
  onFiles?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  style?: CSSProperties;
};
const examples: UploadItem[] = [
  {
    id: '1',
    name: 'brand-guidelines.pdf',
    size: '2.4 MB',
    progress: 100,
    status: 'complete',
  },
  {
    id: '2',
    name: 'homepage-design.fig',
    size: '8.1 MB',
    progress: 64,
    status: 'uploading',
  },
];
/** Controlled upload UI. Your onFiles handler owns the transfer; this component never uploads files. */
export default function UploadQueue({
  items,
  onFiles,
  onRemove,
  accept,
  maxSizeMB = 25,
  className = '',
  style,
}: UploadQueueProps) {
  const [local, setLocal] = useState<UploadItem[]>(examples),
    [drag, setDrag] = useState(false),
    [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const list = items ?? local;
  const add = (files: File[]) => {
    const allowed = files.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    setMessage(
      allowed.length < files.length
        ? 'Some files exceed ' + maxSizeMB + ' MB.'
        : onFiles
          ? 'Files selected.'
          : 'Files selected. Connect onFiles to start uploading.',
    );
    if (items === undefined)
      setLocal((prev) => [
        ...prev,
        ...allowed.map((f, i) => ({
          id: Date.now() + '-' + i,
          name: f.name,
          size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
          progress: 0,
          status: 'queued' as const,
        })),
      ]);
    if (allowed.length) onFiles?.(allowed);
  };
  return (
    <section
      className={'iu-queue ' + className}
      style={style}
      aria-label="File upload"
    >
      <style>{`
 .iu-queue{width:100%;max-width:440px;border:1px solid #ffffff18;border-radius:18px;padding:22px;background:#121418;color:#e2e6ed;font-family:inherit;box-shadow:0 18px 45px #0003}
 .iu-head{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:500;margin-bottom:18px}.iu-head span{font-size:11px;color:#7a8697}
 .iu-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;padding:22px;border:1px dashed #475569;border-radius:12px;background:#ffffff02;color:#c8d0dc;cursor:pointer;font:13px inherit;transition:background .2s,border-color .2s}
 .iu-drop[data-drag=true],.iu-drop:hover{border-color:#a78bfa;background:#a78bfa09}.iu-drop:focus-visible{outline:2px solid #a78bfa;outline-offset:3px}.iu-drop b{font-size:24px;font-weight:400;color:#b5a2da}.iu-drop small{font-size:10px;color:#7c8797}
 .iu-list{display:grid;gap:16px;margin:20px 0 0;padding:0;list-style:none}.iu-item{display:grid;grid-template-columns:32px minmax(0,1fr) 24px;gap:11px;align-items:center}
 .iu-file-icon{height:36px;border:1px solid #ffffff18;border-radius:7px;display:grid;place-items:center;font:8px monospace;color:#c3b5df;background:#a78bfa0a}
 .iu-file-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iu-file-meta{font:10px monospace;color:#758399;margin-top:4px}
 .iu-progress{height:3px;background:#ffffff09;border-radius:3px;margin-top:9px;overflow:hidden}.iu-progress span{display:block;height:100%;background:#ad97da;border-radius:inherit;transition:width .3s}
 .iu-remove{background:none;border:0;color:#7f8a9a;cursor:pointer;padding:5px;font-size:16px}
 .iu-message{font-size:11px;line-height:1.5;color:#929caf;margin-top:16px}.iu-sample{font-size:10px;color:#606b7a;margin-top:14px}
 @media(prefers-reduced-motion:reduce){.iu-progress span{transition:none}}
 `}</style>
      <div className="iu-head">
        Project files <span>{list.length} files</span>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="iu-drop"
        data-drag={drag}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(Array.from(e.dataTransfer.files));
        }}
      >
        <b aria-hidden>↥</b>
        <span>Drop files here or browse</span>
        <small>Up to {maxSizeMB} MB per file</small>
      </button>
      <ul className="iu-list">
        {list.map((item) => (
          <li className="iu-item" key={item.id}>
            <span className="iu-file-icon" aria-hidden>
              {item.name.split('.').at(-1)?.toUpperCase().slice(0, 3)}
            </span>
            <div>
              <div className="iu-file-name">{item.name}</div>
              <div className="iu-file-meta">
                {item.size} ·{' '}
                {item.status === 'complete'
                  ? 'Complete'
                  : item.status === 'uploading'
                    ? Math.round(item.progress) + '%'
                    : item.status === 'error'
                      ? 'Failed'
                      : 'Queued'}
              </div>
              {item.status === 'uploading' && (
                <div
                  className="iu-progress"
                  role="progressbar"
                  aria-label={item.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.max(0, item.progress))}
                >
                  <span
                    style={{
                      width: Math.min(100, Math.max(0, item.progress)) + '%',
                    }}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              className="iu-remove"
              aria-label={'Remove ' + item.name}
              onClick={() => {
                if (items === undefined)
                  setLocal((v) => v.filter((f) => f.id !== item.id));
                onRemove?.(item.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {message && (
        <div className="iu-message" role="status">
          {message}
        </div>
      )}
      {items === undefined && (
        <div className="iu-sample">Example queue · no files are sent</div>
      )}
    </section>
  );
}
