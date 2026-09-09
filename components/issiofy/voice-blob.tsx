'use client';

import { useEffect, useRef } from 'react';

export type VoiceBlobState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type VoiceBlobProps = {
  color?: string;
  state?: VoiceBlobState;
  speed?: number;
  intensity?: number;
  paused?: boolean;
  className?: string;
};

const defaults = /* ISSIOFY_VOICE_DEFAULTS */ {
  color: '#a779ff',
  state: 'speaking',
  speed: 1,
  intensity: 72,
}; /* END_VOICE_DEFAULTS */

const vertex = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() { v_uv = a_position * .5 + .5; gl_Position = vec4(a_position, 0., 1.); }
`;

const fragment = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time, u_state, u_speed, u_intensity;
uniform vec3 u_color;
varying vec2 v_uv;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y), mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float value = 0.0, amplitude = 0.5;
  for(int i = 0; i < 3; i++) { value += noise(p) * amplitude; p = p * 2.03 + 8.1; amplitude *= .5; }
  return value;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  float t = u_time;
  float activity = u_state < .5 ? .10 : (u_state < 1.5 ? .38 : (u_state < 2.5 ? .62 : 1.0));
  float speaking = step(2.5, u_state);
  float voice = speaking * ((.5 + .5 * sin(t * 6.4)) * .55 + (.5 + .5 * sin(t * 3.1 + .8)) * .45);
  uv.y += sin(t * 1.15) * .008 * activity;
  uv.x *= 1.0 + sin(t * 2.2) * .012 * activity;
  float angle = atan(uv.y, uv.x);
  float wobble = sin(angle * 3.0 + t * (1.15 + activity)) * .010;
  wobble += sin(angle * 5.0 - t * 1.42) * .007;
  wobble += sin(angle * 2.0 + t * 2.1) * voice * .012;
  float radius = .34 + wobble * activity + voice * .008;
  float radial = length(uv);
  float outside = max(radial - radius, 0.0);
  float halo = exp(-outside * 27.0) * step(radius, radial) * (.035 + activity * .05);
  if(radial > radius) { gl_FragColor = vec4(u_color * halo, halo); return; }
  float normalizedRadius = radial / max(radius, .001);
  float z = sqrt(max(0.0, 1.0 - normalizedRadius * normalizedRadius));
  vec3 normal = normalize(vec3(uv / radius, z));
  float surfaceNoise = fbm(normal * 2.7 + vec3(t * .18, -t * .14, t * .11));
  normal.xy += (surfaceNoise - .5) * (.08 + activity * .07);
  normal = normalize(normal);
  vec3 lightDirection = normalize(vec3(-.45, .68, 1.0));
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float fresnel = pow(1.0 - max(normal.z, 0.0), 2.45);
  float sheen = pow(max(dot(reflect(-lightDirection, normal), vec3(0,0,1)), 0.0), 32.0);
  float flow = .5 + .5 * sin(normal.x * 3.2 + normal.y * 5.0 + surfaceNoise * 5.0 + t * (1.0 + activity));
  float crossFlow = .5 + .5 * sin(normal.x * 5.4 - normal.z * 3.2 - t * (1.25 + activity));
  vec3 deep = mix(vec3(.025, .008, .085), u_color * .22, .56);
  vec3 electric = mix(u_color, vec3(.34, .12, 1.0), .32);
  vec3 rose = vec3(.92, .28, .82);
  vec3 cyan = vec3(.24, .52, 1.0);
  vec3 spectrum = mix(electric, rose, flow * .58);
  spectrum = mix(spectrum, cyan, pow(crossFlow, 3.0) * .38);
  vec3 color = mix(deep, spectrum, .27 + diffuse * .44);
  color += spectrum * fresnel * (.48 + voice * .28);
  color += vec3(.98, .88, 1.0) * sheen * (.72 + activity * .45);
  color += u_color * voice * .055;
  color = pow(max(color, 0.0), vec3(.82));
  float alpha = smoothstep(1.0, .975, normalizedRadius) * .98;
  gl_FragColor = vec4(color * (.78 + u_intensity * .28), alpha);
}
`;

export default function VoiceBlob({
  color = defaults.color,
  state = defaults.state as VoiceBlobState,
  speed = defaults.speed,
  intensity = defaults.intensity,
  paused = false,
  className,
}: VoiceBlobProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ color, state, speed, intensity, paused });
  useEffect(() => {
    live.current = { color, state, speed, intensity, paused };
  }, [color, state, speed, intensity, paused]);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const gl = target.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    const fallback = () => {
      target.style.background = `radial-gradient(circle at 38% 30%, #e2c9ff 0%, ${live.current.color} 22%, #381263 58%, transparent 73%)`;
    };
    if (!gl) {
      fallback();
      return;
    }
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader unavailable');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error('Shader compilation failed');
      return shader;
    };
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    try {
      const vertexShader = compile(gl.VERTEX_SHADER, vertex);
      const fragmentShader = compile(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram();
      if (!program) throw new Error('Program unavailable');
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error('Program link failed');
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
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    } catch {
      fallback();
      return;
    }
    const uniform = (name: string) => gl.getUniformLocation(program!, name);
    const uniforms = {
      resolution: uniform('u_resolution'),
      time: uniform('u_time'),
      state: uniform('u_state'),
      speed: uniform('u_speed'),
      intensity: uniform('u_intensity'),
      color: uniform('u_color'),
    };
    let width = 0,
      height = 0,
      frame = 0,
      visible = true,
      time = 0,
      previous = performance.now(),
      last = 0,
      dirty = true,
      previousSettings = '';
    const hex = (value: string) => {
      const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : '#a779ff';
      return [1, 3, 5].map(
        (index) => parseInt(safe.slice(index, index + 2), 16) / 255,
      );
    };
    const draw = (now: number) => {
      const settings = live.current;
      const ratio = Math.min(devicePixelRatio || 1, 1.15);
      const rect = target.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * ratio));
      height = Math.max(1, Math.round(rect.height * ratio));
      if (target.width !== width || target.height !== height) {
        target.width = width;
        target.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(
        uniforms.state,
        ['idle', 'listening', 'thinking', 'speaking'].indexOf(settings.state),
      );
      gl.uniform1f(uniforms.speed, settings.speed);
      gl.uniform1f(uniforms.intensity, settings.intensity / 100);
      gl.uniform3fv(uniforms.color, hex(settings.color));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      last = now;
    };
    const resize = new ResizeObserver(() => draw(performance.now()));
    resize.observe(target);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(target);
    const tick = (now: number) => {
      const settings = live.current;
      const key = JSON.stringify(settings);
      if (key !== previousSettings) {
        previousSettings = key;
        dirty = true;
      }
      const delta = Math.min(now - previous, 40);
      previous = now;
      const active = !settings.paused && !motion.matches;
      if (visible && !document.hidden && active)
        time += delta * 0.001 * settings.speed;
      if (visible && !document.hidden && (dirty || active) && now - last > 15) {
        draw(now);
        dirty = false;
      }
      frame = requestAnimationFrame(tick);
    };
    draw(performance.now());
    if (!live.current.paused && !motion.matches)
      frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
