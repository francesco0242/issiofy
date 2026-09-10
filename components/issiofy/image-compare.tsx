'use client';
import { useState, useId, type CSSProperties } from 'react';
export type ImageCompareProps = {
  before?: string;
  after?: string;
  beforeAlt?: string;
  afterAlt?: string;
  initialPosition?: number;
  onPositionChange?: (value: number) => void;
  className?: string;
  style?: CSSProperties;
};
/** A native range input keeps the reveal usable with pointer, touch and keyboard. */
export default function ImageCompare({
  before,
  after,
  beforeAlt = 'Before',
  afterAlt = 'After',
  initialPosition = 48,
  onPositionChange,
  className = '',
  style,
}: ImageCompareProps) {
  const [position, setPosition] = useState(
    Math.max(0, Math.min(100, initialPosition)),
  );
  const id = useId();
  const scene = (enhanced: boolean) => (
    <div className={'ix-scene ' + (enhanced ? 'ix-after' : 'ix-before')}>
      <div className="ix-nav">
        <span>Forma®</span>
        <span>Studio / 2026</span>
      </div>
      <div className="ix-orbit" aria-hidden />
      <div className="ix-copy">
        <span>INDEPENDENT BY DESIGN</span>
        <strong>
          Make room
          <br />
          for the unexpected.
        </strong>
        <span className="ix-cta">Discover the studio ↗</span>
      </div>
    </div>
  );
  return (
    <div className={'ix-compare ' + className} style={style}>
      <style>{`
 .ix-compare{position:relative;width:100%;max-width:650px;aspect-ratio:1.6;min-height:240px;border-radius:16px;overflow:hidden;border:1px solid #ffffff18;isolation:isolate;font-family:inherit}
 .ix-layer{position:absolute;inset:0}.ix-layer img{width:100%;height:100%;object-fit:cover}.ix-scene{width:100%;height:100%;padding:24px;position:relative;overflow:hidden;box-sizing:border-box}
 .ix-before{background:#1e2229;color:#aeb5c0}.ix-after{background:#e9eef2;color:#132332}
 .ix-nav{display:flex;justify-content:space-between;font-size:11px;position:relative;z-index:1}.ix-nav span:first-child{font-size:16px;font-weight:600}
 .ix-copy{position:absolute;left:24px;top:32%;display:grid;gap:16px;z-index:1}.ix-copy>span:first-child{font-size:8px;letter-spacing:.13em}.ix-copy strong{font-size:clamp(24px,3vw,38px);line-height:1.05;letter-spacing:-1.3px;font-weight:500}.ix-cta{font-size:10px}
 .ix-after .ix-orbit{position:absolute;width:260px;height:260px;right:-90px;top:26%;border-radius:50%;border:45px solid #277c9d;box-shadow:inset 14px 14px 16px #082d60,15px 20px 30px #21587c40;transform:rotate(-30deg) scaleY(.68);background:#99c6d2}
 .ix-before .ix-orbit{position:absolute;width:160px;height:160px;right:-30px;top:32%;border:1px solid #465263;border-radius:4px}
 .ix-handle{position:absolute;top:0;bottom:0;width:2px;background:#fff;pointer-events:none;box-shadow:0 0 12px #0003}
 .ix-handle span{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:36px;height:44px;border-radius:10px;display:grid;place-items:center;background:#fff;color:#253146;box-shadow:0 4px 20px #0003;font-size:20px}
 .ix-range{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0;z-index:5;touch-action:pan-y}
 .ix-compare:focus-within{outline:2px solid #c4b5fd;outline-offset:4px}
 .ix-label{position:absolute;bottom:14px;padding:5px 8px;border:1px solid #ffffff25;border-radius:5px;background:#1119;color:#fff;font:10px monospace;pointer-events:none}
 `}</style>
      <div className="ix-layer">
        {after ? <img src={after} alt={afterAlt} /> : scene(true)}
      </div>
      <div
        className="ix-layer"
        style={{ clipPath: 'inset(0 ' + (100 - position) + '% 0 0)' }}
      >
        {before ? <img src={before} alt={beforeAlt} /> : scene(false)}
      </div>
      <div className="ix-handle" style={{ left: position + '%' }} aria-hidden>
        <span>↔</span>
      </div>
      <span className="ix-label" style={{ left: 14 }}>
        BEFORE
      </span>
      <span className="ix-label" style={{ right: 14 }}>
        AFTER
      </span>
      <input
        id={id}
        className="ix-range"
        type="range"
        min={0}
        max={100}
        value={position}
        aria-label="Before and after reveal"
        aria-valuetext={position + '% before image'}
        onChange={(e) => {
          const v = Number(e.target.value);
          setPosition(v);
          onPositionChange?.(v);
        }}
      />
    </div>
  );
}
