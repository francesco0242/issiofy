'use client';
import { useEffect, useRef } from 'react';

export const palettes = {
  heather: { name: 'Heather', colors: ['#e9dcf2', '#9575b5', '#352244'] },
  greenwood: { name: 'Greenwood', colors: ['#e6dfc5', '#8c9d77', '#193c2e'] },
  sandstone: { name: 'Sandstone', colors: ['#f8e1bd', '#d49776', '#693e2e'] },
  harbor: { name: 'Harbor', colors: ['#dceaf0', '#76a7bf', '#173c52'] },
  rosewater: { name: 'Rosewater', colors: ['#ffe0dd', '#ce899e', '#713147'] },
  slate: { name: 'Slate', colors: ['#e1e3e7', '#8b8f99', '#343942'] },
} as const;
export type Palette = keyof typeof palettes;
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type AtmosphereSettings = {
  palette: Palette; distortion: number; swirl: number; grainMix: number;
  grainOverlay: number; orbState: OrbState; glow: number;
};
export type AtmosphereProps = Partial<AtmosphereSettings> & {
  variant?: 'gradient' | 'orb'; speed?: number; intensity?: number;
  paused?: boolean; className?: string;
};

// The export endpoint replaces only this JSON object, preserving the renderer.
const defaults = /* ISSIOFY_DEFAULTS */ {"variant":"gradient","palette":"heather","distortion":65,"swirl":35,"grainMix":15,"grainOverlay":12,"orbState":"idle","glow":65,"speed":1,"intensity":65} /* END_DEFAULTS */;

const vertex = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0., 1.); }
`;
const fragment = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time, u_mode, u_distortion, u_swirl, u_grainMix, u_grainOverlay, u_state, u_glow, u_intensity;
uniform vec3 u_light, u_mid, u_dark;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
mat2 rotate(float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
void main() {
  vec2 uv=gl_FragCoord.xy/u_resolution;
  float t=u_time;
  vec3 col;
  if(u_mode<.5) {
    vec2 p=(uv-.5)*vec2(u_resolution.x/u_resolution.y,1.);
    float r=length(p);
    p=rotate(u_swirl*4.*exp(-r*1.5)+t*.09)*p;
    p+=u_distortion*.32*vec2(sin(p.y*4.2+t*.4),cos(p.x*3.8-t*.35));
    float wave=sin(p.x*3.2+p.y*1.5+sin(p.y*3.3-t*.22)*u_distortion*1.3+t*.18);
    float blend=smoothstep(-.8,.8,wave);
    float grain=hash(gl_FragCoord.xy);
    blend=clamp(blend+(grain-.5)*u_grainMix*.4,0.,1.);
    col=mix(u_light,u_mid,smoothstep(.0,.6,blend));
    col=mix(col,u_dark,smoothstep(.35,.98,blend));
    col+=(grain-.5)*u_grainOverlay*.22;
    col*=.85+u_intensity*.23;
    gl_FragColor=vec4(col,1.);
  } else {
    vec2 p=(gl_FragCoord.xy-.5*u_resolution)/min(u_resolution.x,u_resolution.y);
    float activity=u_state<.5?.18:u_state<1.5?.45:u_state<2.5?.62:1.;
    float breath=sin(t*(1.1+activity*2.))* .008 * activity;
    float radius=.347+breath;
    float r=length(p)/radius;
    float halo=exp(-max(r-1.,0.)*17.)*.06*u_glow;
    if(r>1.) { gl_FragColor=vec4(u_mid*halo, min(halo,.12)); return; }
    float z=sqrt(max(0.,1.-r*r));
    vec3 normal=vec3(p/radius,z);
    vec2 q=rotate(t*(.055+activity*.08))*normal.xy;
    q+=vec2(z*.3,sin(t*.15)*.1);
    float angle=atan(q.y,q.x)+u_swirl*2.5*z;
    float cloud=sin(angle*2.5+t*.5+sin(z*7.+t*.2)*u_distortion*2.);
    cloud=pow(max(0.,cloud),4.)*pow(1.-z,.7);
    col=vec3(.012,.013,.022)+u_dark*.025;
    col+=u_mid*cloud*(.14+u_glow*.42);
    float rim=pow(1.-z,5.);
    vec3 spectral=.5+.5*cos(vec3(0.,2.1,4.2)+angle*2.2+t*.15);
    col+=mix(u_mid,spectral,.5)*rim*(.25+u_glow*.4);
    float reflection=exp(-length((normal.xy-vec2(-.3,.58))*vec2(4.,7.))*2.);
    col+=u_light*reflection*.36;
    float crescent=exp(-abs(length(normal.xy-vec2(.14,-.07))-.94)*45.);
    col+=u_mid*crescent*.055*u_glow;
    for(int layer=0;layer<2;layer++) {
      float depth=float(layer);
      vec2 stars=rotate(t*(.035+activity*.09)*(depth>.5?-1.:1.))*q*(28.+depth*16.);
      vec2 cell=floor(stars), local=fract(stars);
      vec2 pos=vec2(hash(cell+depth),hash(cell+vec2(34.,62.)+depth));
      float d=length(local-pos);
      float visible=step(.76,hash(cell+vec2(92.,12.)+depth));
      float twinkle=.45+.55*sin(t*(.65+activity)+hash(cell)*22.);
      float point=exp(-d*d*(850.-depth*400.))*visible*(.3+z*.7);
      col+=mix(u_light,vec3(1.),.7)*point*twinkle*(.55+u_intensity);
      col+=u_mid*exp(-d*d*60.)*visible*.05*u_glow;
    }
    float pulse=u_state>2.5?(sin(t*7.)*.5+.5)*(sin(t*3.7)*.5+.5):.08;
    col+=u_mid*cloud*pulse*.17;
    col+=(hash(gl_FragCoord.xy)-.5)*u_grainOverlay*.045;
    float alpha=1.-smoothstep(.99,1.,r);
    gl_FragColor=vec4(col,alpha);
  }
}
`;

export default function Atmosphere(props: AtmosphereProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  useEffect(() => { live.current = props; }, [props]);
  useEffect(() => {
    const canvas=ref.current;
    if(!canvas) return;
    let animation=0, visible=true, lost=false, width=0, height=0, time=0, previous=0, lastDraw=0, dirty=true;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});
    const fallback=() => {
      const values={...defaults,...live.current};
      const p=palettes[values.palette as Palette] || palettes.heather;
      const orb=values.variant==='orb';
      canvas.style.background=orb
        ? 'radial-gradient(circle at 42% 37%, '+p.colors[1]+' 0%, #090811 36%, transparent 37%)'
        : 'radial-gradient(ellipse at 25% 20%, '+p.colors[0]+', '+p.colors[1]+' 45%, '+p.colors[2]+')';
    };
    if(!gl) {fallback();return;}
    const shader=(type:number,text:string) => {
      const s=gl.createShader(type); if(!s) throw new Error('Shader unavailable');
      gl.shaderSource(s,text);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Shader compilation failed');}
      return s;
    };
    let program:WebGLProgram|null=null, buffer:WebGLBuffer|null=null;
    let vertexShader:WebGLShader|null=null, fragmentShader:WebGLShader|null=null;
    const cleanup=() => {if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(vertexShader)gl.deleteShader(vertexShader);if(fragmentShader)gl.deleteShader(fragmentShader);};
    try {
      vertexShader=shader(gl.VERTEX_SHADER,vertex);
      fragmentShader=shader(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram(); if(!program)throw new Error('Program unavailable');
      gl.attachShader(program,vertexShader);gl.attachShader(program,fragmentShader);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader link failed');
      // oxlint-disable-next-line react/react-compiler -- WebGL useProgram is a graphics API, not a React hook.
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    }catch{cleanup();fallback();return;}
    const uniforms=Object.fromEntries(['resolution','time','mode','distortion','swirl','grainMix','grainOverlay','state','glow','intensity','light','mid','dark'].map(name=>[name,gl.getUniformLocation(program!,'u_'+name)]));
    let lastSettings='';
    const draw=() => {
      if(!width||!height||lost)return;
      const settings={...defaults,...live.current};
      const p=palettes[settings.palette as Palette] || palettes.heather;
      const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
      gl.uniform2f(uniforms.resolution,width,height);
      gl.uniform1f(uniforms.time,time);
      gl.uniform1f(uniforms.mode,settings.variant==='orb'?1:0);
      gl.uniform1f(uniforms.state,Math.max(0,['idle','listening','thinking','speaking'].indexOf(settings.orbState)));
      for(const key of ['distortion','swirl','grainMix','grainOverlay','glow','intensity'] as const)gl.uniform1f(uniforms[key],settings[key]/100);
      gl.uniform3fv(uniforms.light,rgb(p.colors[0]));gl.uniform3fv(uniforms.mid,rgb(p.colors[1]));gl.uniform3fv(uniforms.dark,rgb(p.colors[2]));
      gl.drawArrays(gl.TRIANGLES,0,6);
    };
    const resize=new ResizeObserver(()=>{
      const rect=canvas.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,1.5);
      width=Math.round(rect.width*ratio);height=Math.round(rect.height*ratio);canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);dirty=true;
    });
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});
    const onLost=(event:Event)=>{event.preventDefault();lost=true;fallback();};
    canvas.addEventListener('webglcontextlost',onLost);
    const tick=(now:number)=>{
      const settings={...defaults,...live.current};
      const key=JSON.stringify(settings);
      if(key!==lastSettings){dirty=true;lastSettings=key;}
      if(visible&&!document.hidden&&!lost&&!settings.paused&&!motion.matches)time+=Math.min(now-previous,40)*.001*settings.speed;
      if(visible&&!document.hidden&&!lost&&(dirty||(!settings.paused&&!motion.matches))&&now-lastDraw>=32) {
        draw();dirty=false;lastDraw=now;
      }
      previous=now;animation=requestAnimationFrame(tick);
    };
    resize.observe(canvas);observer.observe(canvas);
    if (live.current.paused || motion.matches) { draw(); } else animation=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(animation);resize.disconnect();observer.disconnect();canvas.removeEventListener('webglcontextlost',onLost);cleanup();};
  },[]);
  return <canvas ref={ref} className={props.className} aria-hidden="true" style={{width:'100%',height:'100%',display:'block'}}/>;
}


