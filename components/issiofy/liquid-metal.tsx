'use client';
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
} from 'react';

export type LiquidMetalProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'color'
> & {
  preset?: 'silver' | 'titanium' | 'violet';
  variant?: 'solid' | 'rim';
  shape?: 'button' | 'circle' | 'badge';
  strength?: number;
  speed?: number;
  paused?: boolean;
  interactive?: boolean;
};
const defaults = /* ISSIOFY_METAL_DEFAULTS */ {
  preset: 'silver',
  strength: 0.9,
  speed: 1,
}; /* END_METAL_DEFAULTS */

const vertex = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution, size, pointer;
uniform float time, strength, preset, rim, radius;
out vec4 outColor;
float box(vec2 p,vec2 b,float r){
 vec2 q=abs(p)-b+r;
 return min(max(q.x,q.y),0.)+length(max(q,0.))-r;
}
float heightField(vec2 p) {
 vec2 u=p/size.y;
 return sin(u.x*2.5+u.y*3.0-time*.63)*.14
  +sin(u.x*4.3-u.y*2.6+sin(u.x*1.7+time*.51))* .065;
}
void main(){
 vec2 p=(gl_FragCoord.xy/resolution-.5)*(size+24.);
 float d=box(p,size*.5-vec2(1.),max(1.,radius-1.));
 float aa=max(fwidth(d),.55);
 float coverage=1.-smoothstep(-aa,aa,d);
 vec2 edgeNormal=normalize(vec2(box(p+vec2(.1,0.),size*.5-1.,radius-1.)-d,
 box(p+vec2(0.,.1),size*.5-1.,radius-1.)-d)+.00001);
 float bevel=exp(-max(-d,0.)/4.5);
 vec2 flow=vec2(heightField(p+vec2(1.,0.))-heightField(p-vec2(1.,0.)),
 heightField(p+vec2(0.,1.))-heightField(p-vec2(0.,1.)))*size.y;
 vec2 cursor=pointer*size*.5;
 flow+=(p-cursor)/size.y*exp(-length(p-cursor)/size.y)*.24;
 vec3 normal=normalize(vec3(flow*strength+edgeNormal*bevel*1.8,1.));
 vec3 ray=reflect(vec3(0.,0.,-1.),normal);
 float reflection=ray.x*.8+ray.y*.6+sin(ray.y*2.+time*.23)*.23;
 float light=pow(.5+.5*sin(reflection*8.+time*.45),3.);
 float strip=exp(-pow((reflection-.22*sin(time*.37))/.12,2.));
 float horizon=smoothstep(-.12,.14,ray.y+sin(time*.21)*.08);
 vec3 color=mix(vec3(.52,.56,.62),vec3(.94,.96,.98),horizon);
 color=mix(color,vec3(.18,.22,.28),light*.48*strength);
 color+=strip*.34*strength;
 color=mix(color,color*vec3(.80,.83,.9),step(.5,preset)*.25);
 color=mix(color,color*vec3(.91,.77,1.),step(1.5,preset)*.60);
 color+=bevel*(.12+.18*max(0.,dot(edgeNormal,normalize(vec2(-.7,1.)))));
 float edge=1.-smoothstep(1.2,2.8,-d);
 if(rim>.5) coverage*=edge;
 float halo=exp(-max(d,0.)*.42)*smoothstep(-.5,1.,d)*.16*strip;
 float alpha=clamp(coverage+halo,0.,1.);
 outColor=vec4(clamp(color,0.,1.),alpha);
}`;

/** Native button with an animated, beveled chrome surface. No external runtime dependencies. */
export default function LiquidMetal({
  preset = defaults.preset as LiquidMetalProps['preset'],
  strength = defaults.strength,
  speed = defaults.speed,
  paused = false,
  interactive = true,
  variant = 'solid',
  shape = 'button',
  children = 'Create with Issiofy',
  className = '',
  style,
  ...buttonProps
}: LiquidMetalProps) {
  const root = useRef<HTMLButtonElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({
    preset,
    strength,
    speed,
    paused,
    interactive,
    variant,
  });
  useEffect(() => {
    live.current = { preset, strength, speed, paused, interactive, variant };
  }, [preset, strength, speed, paused, interactive, variant]);
  useEffect(() => {
    const el = root.current,
      c = canvas.current;
    if (!el || !c) return;
    const gl = c.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null,
      buffer: WebGLBuffer | null = null;
    const dispose = () => {
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    try {
      for (const [type, src] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ] as const) {
        const s = gl.createShader(type);
        if (!s) throw Error('shader');
        shaders.push(s);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
          throw Error(gl.getShaderInfoLog(s) || 'shader');
      }
      program = gl.createProgram();
      if (!program) throw Error('program');
      shaders.forEach((s) => gl.attachShader(program!, s));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('link');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    } catch {
      dispose();
      return;
    }
    const u = Object.fromEntries(
      [
        'resolution',
        'size',
        'pointer',
        'time',
        'strength',
        'preset',
        'rim',
        'radius',
      ].map((n) => [n, gl.getUniformLocation(program!, n)]),
    );
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0,
      last = 0,
      time = 1.4,
      visible = true,
      lost = false,
      dirty = true,
      w = 1,
      h = 1,
      r = 18,
      x = 0,
      y = 0,
      tx = 0,
      ty = 0,
      signature = '';
    const resize = () => {
      w = el.offsetWidth;
      h = el.offsetHeight;
      r = Math.min(
        parseFloat(getComputedStyle(el).borderTopLeftRadius) || 18,
        w / 2,
        h / 2,
      );
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = Math.round((w + 24) * dpr);
      c.height = Math.round((h + 24) * dpr);
      gl.viewport(0, 0, c.width, c.height);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      dirty = true;
    });
    io.observe(el);
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width) * 2 - 1;
      ty = 1 - ((e.clientY - b.top) / b.height) * 2;
      dirty = true;
    };
    const leave = () => {
      tx = ty = 0;
      dirty = true;
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      el.dataset.metalReady = 'false';
    };
    c.addEventListener('webglcontextlost', onLost);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const s = live.current;
      const next = JSON.stringify(s);
      if (next !== signature) {
        signature = next;
        dirty = true;
      }
      const run = !s.paused && !motion.matches;
      if (visible && !document.hidden && !lost && (run || dirty)) {
        if (run) time += dt * Math.max(0, s.speed);
        x += ((run && s.interactive ? tx : 0) - x) * 0.12;
        y += ((run && s.interactive ? ty : 0) - y) * 0.12;
        gl.uniform2f(u.resolution, c.width, c.height);
        gl.uniform2f(u.size, w, h);
        gl.uniform2f(u.pointer, x, y);
        gl.uniform1f(u.time, time);
        gl.uniform1f(u.radius, r);
        gl.uniform1f(u.rim, s.variant === 'rim' ? 1 : 0);
        gl.uniform1f(u.strength, Math.max(0, Math.min(1.5, s.strength)));
        gl.uniform1f(
          u.preset,
          s.preset === 'silver' ? 0 : s.preset === 'titanium' ? 1 : 2,
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        el.dataset.metalReady = 'true';
        dirty = false;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      c.removeEventListener('webglcontextlost', onLost);
      dispose();
    };
  }, []);
  return (
    <>
      <style>{`
 .im-metal{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 26px;border:0;border-radius:18px;background:linear-gradient(155deg,#fafcff,#919daa 45%,#f4f7fb 75%,#727e8c);color:#0b1118;font:600 14px/1.3 inherit;cursor:pointer;box-shadow:0 9px 24px #0004,inset 0 0 0 1px #fff6;transition:transform .2s,box-shadow .2s;max-width:100%}
 .im-metal[data-variant=solid][data-metal-ready=true]{background:transparent}
 .im-metal[data-variant=rim]{background:#191a1e;color:#f6f7fa;box-shadow:inset 0 0 0 1px #7b818b}
 .im-metal[data-shape=circle]{width:54px;height:54px;padding:0;border-radius:999px}
 .im-metal[data-shape=badge]{min-height:30px;padding:0 14px;border-radius:999px;font-size:12px}
 .im-metal:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 13px 32px #0005}
 .im-metal:active:not(:disabled){transform:translateY(0) scale(.98)}
 .im-metal:focus-visible{outline:2px solid #a6bfff;outline-offset:5px}
 .im-metal:disabled{opacity:.5;cursor:not-allowed}
 .im-metal>canvas{position:absolute;left:-12px;top:-12px;width:calc(100% + 24px);height:calc(100% + 24px);z-index:0;pointer-events:none}
 .im-metal-label{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:10px;text-shadow:0 1px 0 #fff5}
 .im-metal[data-variant=rim] .im-metal-label{text-shadow:none}
 @media(prefers-reduced-motion:reduce){.im-metal{transition:none}.im-metal:hover{transform:none}}
 `}</style>
      <button
        type="button"
        {...buttonProps}
        ref={root}
        className={'im-metal ' + className}
        data-variant={variant}
        data-shape={shape}
        style={style as CSSProperties}
      >
        <canvas ref={canvas} aria-hidden="true" />
        <span className="im-metal-label">{children}</span>
      </button>
    </>
  );
}
