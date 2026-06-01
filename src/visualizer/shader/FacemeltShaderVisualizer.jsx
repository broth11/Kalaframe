import { useEffect, useRef } from "react";

const VERT_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_progress;
uniform int   u_mode;       // 0=calm 1=active 2=exam
uniform float u_intensity;  // 0=low 1=normal 2=high
uniform float u_reducedMotion;

uniform vec3 u_pal0;
uniform vec3 u_pal1;
uniform vec3 u_pal2;
uniform vec3 u_pal3;
uniform vec3 u_pal4;
uniform vec3 u_pal5;

// ---- noise helpers ----
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),              hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2  shift = vec2(100.0);
  mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p  = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// ---- palette ----
vec3 palColor(float t) {
  t = clamp(t * 5.9999, 0.0, 5.9999);
  int  idx = int(t);
  float f  = fract(t);
  vec3 c0, c1;
  if      (idx == 0) { c0 = u_pal0; c1 = u_pal1; }
  else if (idx == 1) { c0 = u_pal1; c1 = u_pal2; }
  else if (idx == 2) { c0 = u_pal2; c1 = u_pal3; }
  else if (idx == 3) { c0 = u_pal3; c1 = u_pal4; }
  else               { c0 = u_pal4; c1 = u_pal5; }
  return mix(c0, c1, smoothstep(0.0, 1.0, f));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  // flip Y so top is top
  uv.y = 1.0 - uv.y;

  // --- mode / intensity parameters ---
  float speed      = u_mode == 2 ? 0.18 : (u_mode == 0 ? 0.55 : 0.90);
  float dispAmt    = u_mode == 2 ? 0.10 : (u_mode == 0 ? 0.22 : 0.34);
  float tendrilStr = u_mode == 2 ? 0.07 : (u_mode == 0 ? 0.18 : 0.28);
  float contrast   = u_mode == 2 ? 0.55 : (u_mode == 0 ? 0.78 : 1.00);

  // intensity multiplier
  float intMul = u_intensity < 0.5 ? 0.55 : (u_intensity > 1.5 ? 1.55 : 1.00);
  dispAmt    *= intMul;
  tendrilStr *= intMul;
  speed      *= intMul;
  contrast   *= clamp(intMul * 0.8 + 0.2, 0.4, 1.2);

  // reduced motion
  float t = u_time * speed * (1.0 - u_reducedMotion * 0.95);

  // --- slow global drift: liquid thermal current ---
  vec2 drift = vec2(
    sin(t * 0.035) * 0.03,
    cos(t * 0.025) * 0.022
  ) * (1.0 - u_reducedMotion * 0.95);

  // --- UV distortion (melt field) ---
  // Clamp UV to safe interior to avoid sharp edge artifacts from palette discontinuity
  vec2 safeUv = clamp(uv, 0.005, 0.995);
  vec2 p = safeUv + drift;

  // broad horizontal sway
  p.x += (noise(vec2(safeUv.y * 2.5, t * 0.35)) - 0.5) * 0.06 * dispAmt * 3.0;

  // downward melt displacement driven by fBM
  float melt = fbm(vec2(safeUv.x * 3.5, safeUv.y * 1.2 - t * 0.09));
  p.y += melt * dispAmt * smoothstep(0.0, 1.0, safeUv.y);

  // tendrils: narrow downward pulls (~25% stronger than before)
  float tendA = fbm(vec2(safeUv.x * 9.0 + 1.3, safeUv.y * 2.1 + t * 0.07));
  float tendB = fbm(vec2(safeUv.x * 13.0 - 2.7, safeUv.y * 1.8 - t * 0.05));
  float tendrils = smoothstep(0.58, 0.90, tendA) + smoothstep(0.60, 0.93, tendB) * 0.7;
  p.y += tendrils * tendrilStr;

  // secondary fine wobble
  p.x += (fbm(vec2(p.y * 4.0, t * 0.22)) - 0.5) * 0.03 * dispAmt;

  // keep p in safe range so palette sampling never hits extreme noise values at edges
  p = clamp(p, -0.15, 1.15);

  // --- color sampling ---
  // zone index from distorted x — soften near right edge to kill sharp palette boundary
  float edgeFade = smoothstep(1.0, 0.88, safeUv.x);
  float zone = fbm(vec2(p.x * 2.8, p.y * 1.6 + t * 0.04));
  zone = clamp(zone * 1.4 - 0.1, 0.0, 1.0);
  // blend zone toward center value near the right border
  zone = mix(zone, 0.45, 1.0 - edgeFade);

  vec3 col = palColor(zone);

  // subtle luminance variation from another noise layer
  float lum = fbm(vec2(p.x * 5.0 + t * 0.06, p.y * 3.5 - t * 0.08));
  col = mix(col * 0.55, col * 1.18, lum);

  // contrast control
  col = (col - 0.5) * contrast + 0.5;
  col = clamp(col, 0.0, 1.0);

  // soft vignette for readability center + right-edge softening
  vec2 vig = uv * 2.0 - 1.0;
  float vignette = 1.0 - smoothstep(0.55, 1.35, length(vig * vec2(0.75, 0.95)));
  col *= mix(0.78, 1.0, vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

// Mode palette definitions
const PALETTES = {
  active: [
    [1.000, 0.024, 0.431], // #ff006e
    [1.000, 0.420, 0.208], // #ff6b35
    [1.000, 0.745, 0.043], // #ffbe0b
    [0.024, 0.839, 0.627], // #06d6a0
    [0.067, 0.541, 0.698], // #118ab2
    [0.514, 0.220, 0.925], // #8338ec
  ],
  calm: [
    [0.220, 0.525, 1.000], // #3a86ff
    [0.282, 0.792, 0.894], // #48cae4
    [0.180, 0.769, 0.714], // #2ec4b6
    [0.180, 0.769, 0.714],
    [0.416, 0.298, 1.000], // #6a4cff
    [0.220, 0.525, 1.000],
  ],
  exam: [
    [0.678, 0.710, 0.741], // #adb5bd
    [0.424, 0.459, 0.494], // #6c757d
    [0.286, 0.318, 0.341], // #495057
    [0.204, 0.227, 0.251], // #343a40
    [0.424, 0.459, 0.494],
    [0.286, 0.318, 0.341],
  ],
};

function modeToIndex(mode) {
  if (mode === "calm") return 0;
  if (mode === "exam") return 2;
  return 1;
}

function intensityToFloat(visualIntensity) {
  if (visualIntensity === "low")  return 0.0;
  if (visualIntensity === "high") return 2.0;
  return 1.0;
}

function paletteForMode(mode, modeIntent) {
  const m = modeIntent || mode || "active";
  if (m === "calm") return PALETTES.calm;
  if (m === "exam") return PALETTES.exam;
  return PALETTES.active;
}

function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + err);
  }
  return shader;
}

function createProgram(gl) {
  const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Program link error: " + err);
  }
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return prog;
}

export function FacemeltShaderVisualizer({
  mode,
  modeIntent,
  progress,
  reducedMotion,
  visualIntensity,
}) {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({});

  // Keep latest props accessible inside rAF without re-init
  const propsRef = useRef({ mode, modeIntent, progress, reducedMotion, visualIntensity });
  useEffect(() => {
    propsRef.current = { mode, modeIntent, progress, reducedMotion, visualIntensity };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl;
    try {
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) throw new Error("WebGL not available");
    } catch (e) {
      console.warn("[FacemeltShader] WebGL init failed:", e.message);
      canvas.style.background =
        "linear-gradient(180deg,#ff006e,#ffbe0b,#06d6a0,#118ab2)";
      return;
    }

    let prog;
    try {
      prog = createProgram(gl);
    } catch (e) {
      console.warn("[FacemeltShader] Shader compilation failed:", e.message);
      canvas.style.background =
        "linear-gradient(180deg,#ff006e,#ffbe0b,#06d6a0,#118ab2)";
      return;
    }

    // Full-screen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

    const aPos    = gl.getAttribLocation(prog, "a_position");
    const uRes    = gl.getUniformLocation(prog, "u_resolution");
    const uTime   = gl.getUniformLocation(prog, "u_time");
    const uProg   = gl.getUniformLocation(prog, "u_progress");
    const uMode   = gl.getUniformLocation(prog, "u_mode");
    const uIntens = gl.getUniformLocation(prog, "u_intensity");
    const uRedMot = gl.getUniformLocation(prog, "u_reducedMotion");
    const uPals   = [0,1,2,3,4,5].map(i =>
      gl.getUniformLocation(prog, `u_pal${i}`)
    );

    stateRef.current = { gl, prog, buf };

    let rafId;
    const startTime = performance.now();

    // Resize handling
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const w   = Math.round(canvas.clientWidth  * dpr);
      const h   = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }
    });
    ro.observe(canvas);

    // Initial size
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(canvas.clientWidth  * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);

    function render() {
      rafId = requestAnimationFrame(render);

      const { mode: m, modeIntent: mi, progress: pg, reducedMotion: rm, visualIntensity: vi } =
        propsRef.current;

      const w = canvas.width;
      const h = canvas.height;
      gl.viewport(0, 0, w, h);

      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const t = (performance.now() - startTime) / 1000;
      gl.uniform2f(uRes,    w, h);
      gl.uniform1f(uTime,   t);
      gl.uniform1f(uProg,   pg ?? 0);
      gl.uniform1i(uMode,   modeToIndex(mi || m));
      gl.uniform1f(uIntens, intensityToFloat(vi));
      gl.uniform1f(uRedMot, rm ? 1.0 : 0.0);

      const pal = paletteForMode(m, mi);
      pal.forEach(([r, g, b], i) => gl.uniform3f(uPals[i], r, g, b));

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    render();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []); // intentionally empty — props consumed via ref

  return (
    <canvas
      ref={canvasRef}
      className="facemelt-shader-canvas"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
