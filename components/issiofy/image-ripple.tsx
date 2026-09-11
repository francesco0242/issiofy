'use client';
/* oxlint-disable next/no-img-element -- This standalone component works outside Next.js. */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
export type ImageRippleProps = {
  src?: string;
  alt?: string;
  strength?: number;
  paused?: boolean;
  autoplay?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};
const artwork =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="680" viewBox="0 0 1000 680"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#102b3a"/><stop offset="1" stop-color="#050e19"/></linearGradient><radialGradient id="g"><stop stop-color="#d0ffdd"/><stop offset=".45" stop-color="#70b6bd"/><stop offset="1" stop-color="#305575"/></radialGradient></defs><rect width="1000" height="680" fill="url(#b)"/><circle cx="530" cy="295" r="210" fill="url(#g)"/><g fill="none" stroke="#d5f7f2" stroke-opacity=".22">' +
      Array.from(
        { length: 24 },
        (_, i) =>
          '<path d="M-80 ' +
          (160 + i * 22) +
          ' Q250 ' +
          (-100 + i * 20) +
          ' 510 ' +
          (240 + i * 13) +
          ' T1100 ' +
          (120 + i * 25) +
          '"/>',
      ).join('') +
      '</g></svg>',
  );
const vertex =
  'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
const fragment = `
precision highp float;
uniform sampler2D image;
uniform vec2 resolution,imageSize,center;
uniform float age,strength;
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;
 float aspect=resolution.x/resolution.y;
 vec2 delta=(uv-center)*vec2(aspect,1.);
 float distance=length(delta);
 float envelope=sin(clamp(age/3.2,0.,1.)*3.14159)*exp(-distance*2.5);
 float front=exp(-pow((distance-age*.24)/.22,2.));
 float ripple=sin(distance*48.-age*12.)*envelope*front*.023*strength;
 uv+=delta/max(distance,.001)*ripple/vec2(aspect,1.);
 float imageAspect=imageSize.x/imageSize.y;
 vec2 scale=vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));
 uv=(uv-.5)*scale+.5;
 vec3 color=texture2D(image,clamp(uv,.001,.999)).rgb;
 color+=ripple*.65;
 gl_FragColor=vec4(color,1.);
}`;
/** Click, touch or hover to disturb the image. Remote images need CORS; otherwise the static image stays visible. */
export default function ImageRipple({
  src = artwork,
  alt = 'An illuminated sphere behind flowing contour lines',
  strength = 1,
  paused = false,
  autoplay = false,
  children,
  className = '',
  style,
}: ImageRippleProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    root = useRef<HTMLButtonElement>(null),
    live = useRef({ paused, strength, autoplay }),
    [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  useEffect(() => {
    live.current = { paused, strength, autoplay };
  }, [paused, strength, autoplay]);
  useEffect(() => {
    const c = canvas.current,
      el = root.current;
    if (!c || !el) return;
    el.dataset.ready = 'false';
    const gl = c.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    let program: WebGLProgram | null = null,
      buffer: WebGLBuffer | null = null,
      texture: WebGLTexture | null = null;
    const shaders: WebGLShader[] = [];
    const dispose = () => {
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
    };
    try {
      for (const [kind, code] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ] as const) {
        const s = gl.createShader(kind);
        if (!s) throw Error('shader');
        shaders.push(s);
        gl.shaderSource(s, code);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
          throw Error('compile');
      }
      program = gl.createProgram();
      if (!program) throw Error('program');
      shaders.forEach((s) => gl.attachShader(program!, s));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('link');
      // oxlint-disable-next-line react/react-compiler -- Graphics API, not a React hook.
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const pos = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } catch {
      dispose();
      return;
    }
    const u = Object.fromEntries(
      ['resolution', 'imageSize', 'center', 'age', 'strength'].map((n) => [
        n,
        gl.getUniformLocation(program!, n),
      ]),
    );
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0,
      previous = 0,
      age = 10,
      loaded = false,
      visible = true,
      lost = false,
      dirty = true,
      wasReduced = false,
      cx = 0.5,
      cy = 0.5,
      iw = 1000,
      ih = 680;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (lost) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        iw = img.naturalWidth;
        ih = img.naturalHeight;
        loaded = true;
        dirty = true;
      } catch {
        loaded = false;
      }
    };
    img.src = src;
    const resize = () => {
      const b = el.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = Math.max(1, Math.round(b.width * dpr));
      c.height = Math.max(1, Math.round(b.height * dpr));
      gl.viewport(0, 0, c.width, c.height);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      dirty = true;
    });
    io.observe(el);
    const trigger = (e: MouseEvent | PointerEvent) => {
      if (live.current.paused || motion.matches) return;
      const b = el.getBoundingClientRect();
      cx =
        e.detail === 0 && e.type === 'click'
          ? 0.5
          : (e.clientX - b.left) / b.width;
      cy =
        e.detail === 0 && e.type === 'click'
          ? 0.5
          : 1 - (e.clientY - b.top) / b.height;
      age = 0;
      dirty = true;
    };
    const lostContext = (e: Event) => {
      e.preventDefault();
      lost = true;
      el.dataset.ready = 'false';
    };
    el.addEventListener('pointerenter', trigger);
    el.addEventListener('click', trigger);
    c.addEventListener('webglcontextlost', lostContext);
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const s = live.current;
      if (wasReduced !== motion.matches) {
        dirty = true;
        wasReduced = motion.matches;
      }
      if (visible && !document.hidden && !lost && loaded) {
        if (!s.paused && !motion.matches) {
          age += dt;
          if (s.autoplay && age > 4.6) {
            age = 0;
            cx = 0.5;
            cy = 0.5;
          }
        }
        if (dirty || (!s.paused && !motion.matches && age < 3.4)) {
          gl.uniform2f(u.resolution, c.width, c.height);
          gl.uniform2f(u.imageSize, iw, ih);
          gl.uniform2f(u.center, cx, cy);
          gl.uniform1f(u.age, motion.matches ? 10 : age);
          gl.uniform1f(u.strength, Math.max(0, Math.min(2, s.strength)));
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          el.dataset.ready = 'true';
          dirty = false;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      img.onload = null;
      img.onerror = null;
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('pointerenter', trigger);
      el.removeEventListener('click', trigger);
      c.removeEventListener('webglcontextlost', lostContext);
      dispose();
    };
  }, [src]);
  return (
    <>
      <style>{`
 .irp-image{position:relative;isolation:isolate;display:block;width:100%;max-width:560px;aspect-ratio:1.5;border-radius:22px;overflow:hidden;padding:0;border:1px solid #ffffff16;background:#102431;cursor:crosshair;text-align:left;color:white;font-family:inherit;box-sizing:border-box}
 .irp-image>img,.irp-image>canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}.irp-image>canvas{opacity:0}.irp-image[data-ready=true]>canvas{opacity:1}
 .irp-caption{position:absolute;inset:auto 0 0;padding:55px 26px 24px;background:linear-gradient(transparent,#07111bc9);pointer-events:none;display:grid;gap:8px}.irp-caption strong{font-size:28px;font-weight:500;letter-spacing:-.035em}.irp-caption small{font-size:12px;letter-spacing:.12em;color:#bcdbdf}
 .irp-image:focus-visible{outline:2px solid #a2dfdb;outline-offset:4px}
 `}</style>
      <button
        type="button"
        ref={root}
        className={'irp-image ' + className}
        style={style}
        aria-label={'Animate image: ' + alt}
      >
        <img
          src={failed ? artwork : src}
          alt={alt}
          onError={() => setFailedSrc(src)}
        />
        <canvas ref={canvas} aria-hidden />
        <span className="irp-caption">
          {children ?? (
            <>
              <small>
                {failed ? 'IMAGE UNAVAILABLE' : 'TOUCH THE SURFACE'}
              </small>
              <strong>Still. Until you move.</strong>
            </>
          )}
        </span>
      </button>
    </>
  );
}
