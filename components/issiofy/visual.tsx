'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

export type VisualVariant =
  | 'ribbons'
  | 'aurora'
  | 'particles'
  | 'grid'
  | 'silk';

export type VisualProps = {
  variant?: VisualVariant;
  color?: string;
  speed?: number;
  intensity?: number;
  paused?: boolean;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const defaults = /* ISSIOFY_VISUAL_DEFAULTS */ {
  variant: 'ribbons',
  color: '#a779ff',
  speed: 1,
  intensity: 65,
}; /* END_VISUAL_DEFAULTS */

const vertexShader = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_mode;
uniform float u_intensity;
uniform vec3 u_color;

#define PI 3.14159265359

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return fract(vec2(n, n * 34.345));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = turn * p * 2.03 + 8.1;
    amplitude *= 0.5;
  }
  return value;
}

mat2 rotate2d(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

vec3 tint(float position) {
  vec3 cool = mix(u_color, vec3(0.25, 0.52, 1.0), 0.24);
  vec3 warm = mix(u_color, vec3(1.0, 0.34, 0.78), 0.20);
  return mix(cool, warm, smoothstep(0.0, 1.0, position));
}

vec3 ribbons(vec2 p, float t) {
  p += u_pointer * .055;
  vec3 col=vec3(0.);
  for(int i=0;i<3;i++) {
    float f=float(i), phase=p.x*2.1+t*.38+f*.85;
    float spine=sin(phase)*.23+sin(p.x*3.2-t*.22+f)*.08+(f-1.)*.11;
    float width=.06+.035*(.5+.5*cos(phase*1.2));
    float q=(p.y-spine)/width;
    float body=1.-smoothstep(.86,1.,abs(q));
    float bevel=pow(max(0.,1.-q*q),.6);
    float spec=pow(max(0.,cos(q*2.4+phase*.65)),22.);
    vec3 metal=mix(u_color*.22,tint(f*.35),bevel);
    col=mix(col,metal*.55+spec*vec3(.86,.94,1.)*.65,body);
    col+=u_color*exp(-abs(abs(q)-.94)*24.)*.12;
  }
  return col;
}

vec3 aurora(vec2 p, float t) {
  p+=u_pointer*.045;
  vec3 col=vec3(0.);
  for(int i=0;i<4;i++) {
    float f=float(i);
    float wave=sin(p.x*2.+t*.17+f*.8)*.16;
    wave+=sin(p.x*4.5-t*.13+f)*.045;
    float y=p.y-wave+.05+f*.06;
    float curtain=exp(-abs(y)*5.)*smoothstep(-.24,.015,y);
    float threads=.35+.65*noise(vec2(p.x*48.+sin(p.x*4.+t*.12)*4.,f*7.+t*.08));
    vec3 hue=mix(u_color,vec3(.25,.48,.98),f/4.);
    col+=hue*curtain*threads*(.35+u_intensity*.35);
    col+=mix(hue,vec3(.82,1.,.9),.35)*exp(-abs(y)*75.)*.15;
  }
  return col;
}

float particleLayer(vec2 p, float t, float scale, float drift) {
  p *= scale;
  p = rotate2d(t * drift) * p;
  vec2 cell = floor(p);
  vec2 local = fract(p) - 0.5;
  vec2 point = hash22(cell) - 0.5;
  point += 0.16 * vec2(sin(t * 0.7 + hash21(cell) * 12.0), cos(t * 0.5 + hash21(cell + 4.0) * 9.0));
  float d = length(local - point);
  float star = exp(-d * d * 820.0);
  star += exp(-abs(local.x - point.x) * 95.0) * exp(-abs(local.y - point.y) * 12.0) * 0.09;
  star += exp(-abs(local.y - point.y) * 95.0) * exp(-abs(local.x - point.x) * 12.0) * 0.09;
  return star * smoothstep(0.62, 0.98, hash21(cell + 17.4));
}

vec3 stardust(vec2 p, float t) {
  p += u_pointer * .055;
  float r = length(p);
  vec2 swirl = rotate2d((0.56 - r) * 2.4 + t * 0.065) * p;
  float stars =
    particleLayer(swirl, t, 18.0, 0.018) +
    particleLayer(swirl + 8.0, t, 29.0, -0.012) * 0.65 +
    particleLayer(swirl - 13.0, t, 43.0, 0.008) * 0.38;
  float dust = fbm(swirl * 4.2 + vec2(t * .025, -t * .035));
  float galaxy = exp(-abs(p.y - sin(p.x * 2.1 + t * 0.09) * 0.10) * 5.4) * exp(-r * 1.25);
  vec3 color = tint(.5 + .5 * sin(swirl.x * 1.7 + swirl.y * .8)) * galaxy * dust * 0.32;
  color += mix(u_color, vec3(1.0), 0.68) * stars * (0.55 + galaxy);
  color += u_color * exp(-r * 3.5) * 0.025;
  return color;
}

vec3 waveGrid(vec2 p, float t) {
  p+=u_pointer*.035;
  float z=1./max(.16,p.y+.66);
  vec2 g=vec2(p.x*z*3.,z*1.8-t*.25);
  g.y+=sin(g.x*.75+t*.65)*(.12+u_intensity*.22);
  vec2 d=abs(fract(g)-.5);
  float thickness=clamp(z*.0015,.008,.06);
  float line=1.-smoothstep(thickness,thickness*2.5,min(d.x,d.y));
  float dots=exp(-dot(d,d)*3500.);
  float fade=smoothstep(-.45,-.15,p.y)*(1.-smoothstep(.35,.8,p.y));
  float scan=exp(-pow(fract(g.y*.065-t*.1)-.5,2.)*160.);
  vec3 col=u_color*(line*.24+dots*.55)*fade;
  col+=mix(u_color,vec3(1.),.5)*line*scan*fade*.7;
  return col;
}

vec3 silk(vec2 p, float t) {
  p=rotate2d(-.4+u_pointer.x*.08)*p;
  float flow=sin(p.x*2.2+t*.24)*.2+sin(p.x*4.1-t*.17)*.055;
  float fold=p.y+flow;
  float warp=fbm(vec2(p.x*.8+t*.035,fold*1.8));
  float ridges=sin(fold*(14.+u_intensity*7.)+warp*3.);
  float sheen=pow(.5+.5*cos(fold*15.+warp*3.+p.x*.7),14.);
  float light=.12+.32*pow(.5+.5*ridges,2.);
  vec3 col=u_color*light;
  col+=mix(u_color,vec3(1.,.94,.83),.6)*sheen*.55;
  float weave=noise(p*vec2(230.,360.));
  col*=.95+weave*.05;
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  p.x *= 1.06;
  float t = u_time;
  vec3 color = vec3(0.0);

  if (u_mode < 0.5) color = ribbons(p, t);
  else if (u_mode < 1.5) color = aurora(p, t);
  else if (u_mode < 2.5) color = stardust(p, t);
  else if (u_mode < 3.5) color = waveGrid(p, t);
  else color = silk(p, t);

  float vignette = 1.0 - smoothstep(0.28, 0.92, length(uv - 0.5));
  color *= 0.72 + vignette * 0.45;
  color *= mix(0.56, 1.28, u_intensity);
  color = color / (1.0 + color);
  color = pow(color, vec3(0.84));
  gl_FragColor = vec4(color, clamp(max(max(color.r, color.g), color.b) * 2.2, 0.0, 1.0));
}
`;

const modeByVariant: Record<VisualVariant, number> = {
  ribbons: 0,
  aurora: 1,
  particles: 2,
  grid: 3,
  silk: 4,
};

function colorToRgb(color: string) {
  const normalized = color.trim().replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => part + part)
          .join('')
      : normalized;
  if (!/^[0-9a-f]{6}$/i.test(value)) return [0.655, 0.475, 1] as const;
  return [0, 2, 4].map(
    (index) => parseInt(value.slice(index, index + 2), 16) / 255,
  ) as [number, number, number];
}

export default function Visual(props: VisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  useEffect(() => {
    live.current = props;
  }, [props]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let buffer: WebGLBuffer | null = null;
    let frame = 0;
    let width = 0;
    let height = 0;
    let time = 2.8;
    let previous = performance.now();
    let visible = true;
    let contextLost = false;
    let dirty = true;
    let lastSignature = '';

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const current = () => ({ ...defaults, ...live.current });

    const fallback = () => {
      const settings = current();
      const backgrounds: Record<VisualVariant, string> = {
        ribbons:
          'radial-gradient(ellipse at 50% 54%, ' +
          settings.color +
          '55, transparent 62%)',
        aurora:
          'linear-gradient(165deg, transparent 25%, ' +
          settings.color +
          '50 55%, #55d9c733 72%, transparent)',
        particles:
          'radial-gradient(ellipse, ' + settings.color + '33, transparent 62%)',
        grid:
          'linear-gradient(180deg, transparent, ' +
          settings.color +
          '30 70%, transparent)',
        silk:
          'radial-gradient(ellipse at 50% 50%, ' +
          settings.color +
          '66, transparent 62%)',
      };
      canvas.style.background =
        backgrounds[settings.variant as VisualVariant] || backgrounds.ribbons;
    };

    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      });
      if (!gl) {
        fallback();
        return;
      }

      const compile = (type: number, source: string) => {
        const shader = gl!.createShader(type);
        if (!shader) throw new Error('WebGL shader unavailable');
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
          const message = gl!.getShaderInfoLog(shader);
          gl!.deleteShader(shader);
          throw new Error(message || 'WebGL shader compilation failed');
        }
        return shader;
      };

      vertex = compile(gl.VERTEX_SHADER, vertexShader);
      fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
      program = gl.createProgram();
      if (!program) throw new Error('WebGL program unavailable');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
          gl.getProgramInfoLog(program) || 'WebGL program link failed',
        );
      }
      // oxlint-disable-next-line react/react-compiler -- WebGL useProgram is a graphics API, not a React hook.
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } catch {
      fallback();
      if (buffer) gl?.deleteBuffer(buffer);
      if (program) gl?.deleteProgram(program);
      if (vertex) gl?.deleteShader(vertex);
      if (fragment) gl?.deleteShader(fragment);
      return;
    }

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      time: gl.getUniformLocation(program, 'u_time'),
      mode: gl.getUniformLocation(program, 'u_mode'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      color: gl.getUniformLocation(program, 'u_color'),
    };
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };

    const render = () => {
      if (!gl || !program || !width || !height || contextLost) return;
      const settings = current();
      const variant = settings.variant as VisualVariant;
      const rgb = colorToRgb(settings.color);
      pointer.x += (pointerTarget.x - pointer.x) * 0.055;
      pointer.y += (pointerTarget.y - pointer.y) * 0.055;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.mode, modeByVariant[variant] ?? 0);
      gl.uniform1f(
        uniforms.intensity,
        Math.max(0, Math.min(1, settings.intensity / 100)),
      );
      gl.uniform3f(uniforms.color, rgb[0], rgb[1], rgb[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const baseRatio = Math.min(devicePixelRatio || 1, 1.5);
      const areaRatio = Math.min(
        1,
        Math.sqrt(
          1_500_000 / (rect.width * rect.height * baseRatio * baseRatio),
        ),
      );
      const ratio = Math.max(0.75, baseRatio * areaRatio);
      width = Math.max(1, Math.round(rect.width * ratio));
      height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        dirty = true;
      }
    });

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    const onPointerMove = (event: PointerEvent) => {
      if (current().interactive === false) return;
      const rect = canvas.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerTarget.y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    };
    const onPointerLeave = () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      fallback();
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('webglcontextlost', onContextLost);
    resize.observe(canvas);
    intersection.observe(canvas);

    const tick = (now: number) => {
      const settings = current();
      const signature = JSON.stringify([
        settings.variant,
        settings.color,
        settings.intensity,
        settings.paused,
      ]);
      if (signature !== lastSignature) {
        lastSignature = signature;
        dirty = true;
      }
      const running =
        visible &&
        !document.hidden &&
        !settings.paused &&
        !reducedMotion.matches &&
        !contextLost;
      if (running) {
        time +=
          Math.min(now - previous, 40) *
          0.001 *
          Math.max(0.1, Math.min(2.5, settings.speed));
        render();
      } else if (visible && dirty) {
        render();
        dirty = false;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (buffer) gl?.deleteBuffer(buffer);
      if (program) gl?.deleteProgram(program);
      if (vertex) gl?.deleteShader(vertex);
      if (fragment) gl?.deleteShader(fragment);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={props.className}
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        ...props.style,
      }}
    />
  );
}
