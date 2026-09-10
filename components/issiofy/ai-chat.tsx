'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  RotateCcw,
  Square,
  AudioLines,
  Plus,
  X,
  Code2,
  Sparkles,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  MotionConfig,
} from 'motion/react';
import VoiceBlob from './voice-blob';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AIChatPhase =
  | 'thinking'
  | 'using-tools'
  | 'writing-code'
  | 'generating'
  | 'idle';
export type AIChatProps = {
  autoHeight?: boolean;
  logoSrc?: string;
  accent?: string;
  model?: string;
  models?: string[];
  phase?: AIChatPhase;
  response?: string;
  autoplay?: boolean;
  paused?: boolean;
  compact?: boolean;
  className?: string;
  onSend?: (message: string, model: string) => void;
  onModelChange?: (model: string) => void;
  onStop?: () => void;
};
const MODEL_OPTIONS = ['Issiofy One', 'GPT', 'Claude', 'Gemini'];
const INITIAL =
  'Help me design a calm, beautiful interface for an AI assistant.';
const RESPONSE =
  'Start with the conversation. Give the words room to breathe, keep the controls quiet, and use motion to communicate what the assistant is doing.\n\nA small, living presence is enough: it listens, thinks, and settles when the answer is ready. Pair it with a spacious composer and a model switcher that stays out of the way.\n\nThe result feels responsive, focused, and distinctly yours.';
const CODE =
  'export function Assistant() {\n  return (\n    <AIChat\n      model="Issiofy One"\n      onSend={sendToModel}\n      phase={stream.status}\n      response={stream.text}\n    />\n  );\n}';
const labels: Record<AIChatPhase, string> = {
  thinking: 'Thinking',
  'using-tools': 'Exploring possibilities',
  'writing-code': 'Writing code',
  generating: 'Writing a response',
  idle: 'Response complete',
};
const sequence: AIChatPhase[] = [
  'thinking',
  'using-tools',
  'generating',
  'idle',
];
type Turn = { prompt: string; response: string; model: string };

export function AIThinkingStatus({
  phase,
  compact = false,
}: {
  phase: AIChatPhase;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <span className="ic-status" style={{ fontSize: compact ? 12 : 14 }}>
      {labels[phase]}
      {phase !== 'idle' && (
        <span className="ic-dots" aria-hidden="true">
          ···
        </span>
      )}
    </span>
  );
}
export function AIStreamingText({
  phase,
  text = RESPONSE,
  paused = false,
  onProgress,
}: {
  phase: AIChatPhase;
  text?: string;
  paused?: boolean;
  onProgress?: (value: string) => void;
}) {
  const reduced = useReducedMotion();
  const [length, setLength] = useState(0);
  useEffect(() => {
    if (phase !== 'generating' || paused || reduced) return;
    const timer = setInterval(
      () => setLength((n) => Math.min(text.length, n + 5)),
      24,
    );
    return () => clearInterval(timer);
  }, [phase, text, paused, reduced]);
  const visible = phase === 'idle' || reduced ? text : text.slice(0, length);
  useEffect(() => {
    onProgress?.(visible);
  }, [visible, onProgress]);
  return (
    <div className="ic-answer">
      {visible}
      {phase === 'generating' && !reduced && (
        <span className="ic-caret" aria-hidden="true" />
      )}
    </div>
  );
}
function answerFor(prompt: string) {
  if (/code|react|component|kod|komponent/i.test(prompt))
    return (
      'Here is a compact starting point. Keep the conversation state in your application and pass the live response into the component.\n\n' +
      CODE +
      '\n\nConnect sendToModel to your backend. The interface handles the presentation; your endpoint supplies the response.'
    );
  return RESPONSE;
}

export default function AIChat({
  autoHeight = false,
  logoSrc = '/issiofy-logo.png',
  accent = '#a779ff',
  model = 'Issiofy One',
  models = MODEL_OPTIONS,
  phase: controlledPhase,
  response,
  autoplay = true,
  paused = false,
  compact = false,
  className = '',
  onSend,
  onModelChange,
  onStop,
}: AIChatProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<AIChatPhase>(
    autoplay ? 'thinking' : 'idle',
  );
  const [selection, setSelected] = useState<string | null>(null);
  const selected = selection ?? model;
  const [draft, setDraft] = useState('');
  const [prompt, setPrompt] = useState(INITIAL);
  const [history, setHistory] = useState<Turn[]>([]);
  const [run, setRun] = useState(0);
  const [voice, setVoice] = useState(false);
  const [details, setDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [stopped, setStopped] = useState<string | null>(null);
  const streamed = useRef('');
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const current = controlledPhase ?? phase;
  const busy = current !== 'idle';
  const answer = stopped ?? response ?? answerFor(prompt);
  useEffect(() => {
    if (controlledPhase || onSend || paused || voice || current === 'idle')
      return;
    const durations: Record<AIChatPhase, number> = {
      thinking: 1300,
      'using-tools': 1200,
      'writing-code': 1500,
      generating: Math.max(2800, answer.length * 5.2),
      idle: 0,
    };
    const timer = setTimeout(
      () =>
        setPhase(
          current === 'writing-code'
            ? 'generating'
            : (sequence[sequence.indexOf(current) + 1] ?? 'idle'),
        ),
      reduced ? 180 : durations[current],
    );
    return () => clearTimeout(timer);
  }, [current, controlledPhase, onSend, paused, voice, answer, reduced, run]);
  useEffect(() => {
    const el = viewport.current;
    if (!el || autoHeight) return;
    const observer = new ResizeObserver(() => {
      if (follow.current) el.scrollTop = el.scrollHeight;
    });
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [autoHeight]);
  function send(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setHistory((items) => [
      ...items,
      { prompt, response: answer, model: selected },
    ]);
    const value = draft.trim();
    setStopped(null);
    streamed.current = '';
    setPrompt(value);
    setDraft('');
    setVoice(false);
    setDetails(false);
    setRun((n) => n + 1);
    setPhase('thinking');
    follow.current = true;
    onSend?.(value, selected);
  }
  function replay() {
    setStopped(null);
    streamed.current = '';
    setPhase('thinking');
    setRun((n) => n + 1);
    setDetails(false);
    follow.current = true;
    onSend?.(prompt, selected);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
    } catch {
      setError('Copy unavailable. Select the response to copy it.');
    }
  }
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={
          'ic-chat ' +
          (autoHeight ? 'ic-auto ' : '') +
          (compact ? 'ic-compact ' : '') +
          className
        }
        style={{ '--ai-accent': accent } as CSSProperties}
        data-paused={paused}
      >
        <style>{STYLES}</style>
        <header className="ic-header">
          <Select
            value={selected}
            onValueChange={(value) => {
              if (value) {
                setSelected(value);
                onModelChange?.(value);
              }
            }}
            disabled={busy}
          >
            <SelectTrigger aria-label="Choose model" className="ic-model">
              <SelectValue>{selected}</SelectValue>
            </SelectTrigger>
            <SelectContent
              className="border-white/10 bg-[#202022] text-white"
              align="start"
            >
              {[...new Set([model, ...models])].map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ic-demo">Interactive demo</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="New conversation"
            className="ic-icon"
            onClick={() => {
              setStopped(null);
              streamed.current = '';
              setHistory([]);
              setPrompt(INITIAL);
              setRun((n) => n + 1);
              setPhase('idle');
              setDraft('');
            }}
          >
            <Plus size={18} />
          </Button>
        </header>
        <div
          ref={viewport}
          className="ic-scroll"
          onScroll={(e) => {
            const el = e.currentTarget;
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 70;
          }}
        >
          <div className="ic-thread">
            {history.map((turn, i) => (
              <div className="ic-turn" key={i}>
                <div className="ic-user">{turn.prompt}</div>
                <div className="ic-old-model">{turn.model}</div>
                <div className="ic-answer">{turn.response}</div>
              </div>
            ))}
            <motion.div
              key={prompt + run}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ic-user">{prompt}</div>
              <div className="ic-assistant-heading">
                <motion.button
                  type="button"
                  className="ic-brand"
                  aria-label="Animate Issiofy logo"
                  whileHover={{ scale: 1.15, rotate: 12 }}
                  whileTap={{ scale: 0.9, rotate: -15 }}
                  animate={
                    paused || reduced
                      ? { y: 0, rotate: 0 }
                      : {
                          y: busy ? [0, -3, 0] : 0,
                          rotate: busy ? [0, 6, -6, 0] : 0,
                        }
                  }
                  transition={{ duration: 2.6, repeat: busy ? Infinity : 0 }}
                  onClick={() => setVoice((v) => !v)}
                >
                  {/* Native image keeps this exported React component framework-independent. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoSrc} alt="Issiofy" width={38} height={38} />
                </motion.button>
                <span>{selected}</span>
                <span className="ic-assistant-label">Assistant</span>
              </div>
              <button
                type="button"
                className="ic-thought"
                onClick={() => setDetails((v) => !v)}
                aria-expanded={details}
              >
                <AIThinkingStatus phase={current} compact={compact} />
                <ChevronDown
                  size={14}
                  style={{ transform: details ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              <AnimatePresence initial={false}>
                {details && (
                  <motion.div
                    className="ic-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <p>
                      <Check size={13} /> Understanding your request
                    </p>
                    <p>
                      <Sparkles size={13} /> Exploring the visual direction
                    </p>
                    <p>
                      <Code2 size={13} /> Preparing the response
                    </p>
                    <small>Sample activity for this component preview.</small>
                  </motion.div>
                )}
              </AnimatePresence>
              {(current === 'generating' || current === 'idle') && (
                <AIStreamingText
                  key={run}
                  phase={current}
                  text={answer}
                  onProgress={(value) => {
                    streamed.current = value;
                  }}
                  paused={paused}
                />
              )}
              {!busy && (
                <motion.div
                  className="ic-actions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ic-icon"
                    aria-label={copied ? 'Copied' : 'Copy response'}
                    onClick={copy}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ic-icon"
                    aria-label="Regenerate response"
                    onClick={replay}
                  >
                    <RotateCcw size={15} />
                  </Button>
                  <span>{copied ? 'Copied' : 'Demo response'}</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
        <div className="ic-bottom">
          <AnimatePresence>
            {voice && (
              <motion.div
                className="ic-voice"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <div style={{ width: 48, height: 48 }}>
                  <VoiceBlob state="listening" color={accent} paused={paused} />
                </div>
                <div>
                  <strong>Voice presence</strong>
                  <p>Listening animation preview · microphone is off</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close voice preview"
                  onClick={() => setVoice(false)}
                >
                  <X size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={send} className="ic-composer">
            <textarea
              aria-label="Message"
              rows={2}
              value={draft}
              placeholder="Ask anything, or build something…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="ic-composer-controls">
              <span className="ic-private">
                {busy
                  ? 'A little thought goes a long way.'
                  : 'Your next idea starts here.'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ic-icon"
                aria-label="Preview voice animation"
                aria-pressed={voice}
                onClick={() => setVoice((v) => !v)}
              >
                <AudioLines size={18} />
              </Button>
              <Button
                type={busy ? 'button' : 'submit'}
                size="icon-sm"
                className="ic-send"
                aria-label={busy ? 'Stop response' : 'Send message'}
                disabled={!busy && !draft.trim()}
                onClick={
                  busy
                    ? () => {
                        setStopped(streamed.current || 'Response stopped.');
                        setPhase('idle');
                        onStop?.();
                      }
                    : undefined
                }
              >
                {busy ? (
                  <Square size={14} fill="currentColor" />
                ) : (
                  <ArrowUp size={19} />
                )}
              </Button>
            </div>
          </form>
          <output className="ic-footnote">
            {error || 'Demo conversation · connect your own model API'}
          </output>
        </div>
      </div>
    </MotionConfig>
  );
}
const STYLES = `
.ic-chat{height:100%;width:100%;max-width:900px;margin:auto;display:flex;flex-direction:column;overflow:hidden;border:1px solid #ffffff14;border-radius:22px;background:#141414;color:#f5f5f5;font-family:inherit;text-align:left}
.ic-header{height:62px;flex-shrink:0;display:flex;align-items:center;gap:14px;padding:0 20px;border-bottom:1px solid #ffffff09}.ic-model{border:0!important;background:transparent!important;color:#fafafa!important;font-size:16px!important;font-weight:600!important;box-shadow:none!important}.ic-demo{margin-left:auto;font-size:11px;color:#969696;border:1px solid #ffffff12;padding:4px 8px;border-radius:6px}.ic-icon{color:#ababab!important;background:transparent}.ic-icon:hover{color:white!important;background:#ffffff0b!important}
.ic-scroll{min-height:0;flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#ffffff20 transparent;overscroll-behavior:contain}.ic-thread{max-width:720px;margin:auto;padding:28px 30px 20px;overflow-wrap:anywhere}.ic-turn{margin-bottom:28px}.ic-user{margin:0 0 25px auto;width:fit-content;max-width:85%;background:#272727;border:1px solid #ffffff06;padding:12px 18px;border-radius:19px 19px 5px 19px;font-size:15px;line-height:1.65;white-space:pre-wrap}.ic-assistant-heading{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;margin-bottom:6px}.ic-brand{width:40px;height:40px;padding:0;border:0;background:transparent;cursor:pointer;flex-shrink:0}.ic-brand img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 10px #a779ff30)}.ic-presence{width:38px;height:38px;flex-shrink:0}.ic-assistant-label{color:#858585;font-size:12px;font-weight:400}.ic-thought{display:flex;align-items:center;gap:9px;background:none;border:0;color:#b0b0b0;padding:6px 0;margin-bottom:12px;cursor:pointer;font-family:inherit}.ic-thought svg{transition:transform .2s}.ic-status{display:inline-flex;align-items:center;gap:6px}.ic-dots{animation:ic-breathe 1.5s infinite;font-size:18px;letter-spacing:2px}.ic-details{border-left:1px solid #ffffff20;padding-left:16px;margin-bottom:18px;overflow:hidden;color:#aaa}.ic-details p{display:flex;align-items:center;gap:9px;font-size:13px;padding:5px 0;margin:0}.ic-details small{display:block;font-size:11px;color:#888;padding:8px 0}.ic-answer{font-size:16px;line-height:1.85;color:#e6e6e6;white-space:pre-wrap}.ic-caret{display:inline-block;width:6px;height:16px;border-radius:3px;background:var(--ai-accent);vertical-align:-2px;margin-left:4px;animation:ic-breathe .8s infinite}.ic-actions{display:flex;align-items:center;gap:3px;margin-top:16px}.ic-actions>span{font-size:11px;color:#858585;margin-left:6px}.ic-old-model{color:#aaa;font-size:12px;margin-bottom:10px}
.ic-bottom{padding:10px 22px 12px;background:linear-gradient(transparent,#141414 14%);flex-shrink:0}.ic-composer{border:1px solid #ffffff23;border-radius:20px;background:#202020;padding:12px 14px;box-shadow:0 4px 20px #00000015;transition:border-color .2s}.ic-composer:focus-within{border-color:#ffffff50}.ic-composer textarea{display:block;resize:none;width:100%;min-height:48px;max-height:120px;background:transparent;border:0;outline:0;color:#f5f5f5;font:inherit;font-size:15px;line-height:1.5;padding:0}.ic-composer textarea::placeholder{color:#a0a0a0}.ic-composer-controls{display:flex;align-items:center;gap:8px;margin-top:5px}.ic-private{font-size:11px;color:#929292;margin-right:auto}.ic-send{background:#f5f5f5!important;color:#161616!important;border-radius:50%!important;width:34px!important;height:34px!important}.ic-send:disabled{opacity:.35}.ic-footnote{display:block;font-size:11px!important;text-align:center;color:#8f8f8f!important;margin:9px 0 0!important}.ic-voice{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:8px 12px;border:1px solid #ffffff15;border-radius:16px;background:#202020}.ic-voice strong{font-size:13px}.ic-voice p{font-size:11px;color:#aaa;margin:4px 0}.ic-voice>button{margin-left:auto}.ic-chat button:focus-visible{outline:2px solid var(--ai-accent);outline-offset:3px}.ic-compact .ic-header{height:42px;padding:0 10px}.ic-compact .ic-thread{padding:14px}.ic-compact .ic-user{font-size:12px;padding:8px 12px;margin-bottom:12px}.ic-compact .ic-bottom{padding:8px}.ic-compact .ic-composer textarea{min-height:25px;font-size:12px}.ic-compact .ic-composer{padding:8px 10px}.ic-compact .ic-answer{font-size:13px}.ic-compact .ic-demo,.ic-compact .ic-footnote,.ic-compact .ic-private{display:none}.ic-compact .ic-brand{width:40px;height:40px;padding:0;border:0;background:transparent;cursor:pointer;flex-shrink:0}.ic-brand img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 10px #a779ff30)}.ic-presence{width:28px;height:28px}.ic-chat[data-paused=true] *{animation-play-state:paused!important}@keyframes ic-breathe{50%{opacity:.3}}
@media(prefers-reduced-motion:reduce){.ic-chat *{animation:none!important;transition:none!important}}@media(max-width:600px){.ic-header{padding:0 12px}.ic-thread{padding:20px 16px}.ic-bottom{padding:8px 12px}.ic-answer{font-size:15px}.ic-user{max-width:92%;font-size:14px}.ic-demo{font-size:10px}.ic-private{font-size:10px}}
.ic-chat.ic-auto{height:auto;min-height:520px;overflow:hidden}
.ic-auto .ic-scroll{flex:0 0 auto;overflow:visible;min-height:0}
.ic-auto .ic-header{height:52px}
.ic-auto .ic-thread{padding:18px 26px 14px;max-width:780px}
.ic-auto .ic-user{margin-bottom:16px;padding:10px 15px;font-size:14px;line-height:1.5}
.ic-auto .ic-answer{font-size:15px;line-height:1.65}
.ic-auto .ic-assistant-heading{margin-bottom:2px}.ic-auto .ic-brand{width:32px;height:32px}
.ic-auto .ic-thought{margin-bottom:8px}.ic-auto .ic-actions{margin-top:10px}
.ic-auto .ic-bottom{border-radius:0 0 22px 22px;margin-top:auto;padding:8px 18px 12px}
.ic-auto .ic-composer textarea{min-height:30px;height:30px;font-size:14px}
.ic-auto .ic-composer{padding:10px 12px}.ic-auto .ic-footnote{margin-top:7px!important}

`;
