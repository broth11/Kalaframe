import { useRef, useEffect } from "react";
import { useWebGLSketch } from "./WebGLVisualizer.jsx";

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_mode;
uniform float u_intensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p  = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Domain-warped fBm — two layers of warp
  vec2 q = vec2(
    fbm(uv * 1.2 + vec2(t * 0.04, t * 0.03)),
    fbm(uv * 1.2 + vec2(t * 0.05 + 3.1, t * 0.04 + 1.7))
  );
  vec2 r = vec2(
    fbm(uv * 2.4 + q * 1.8 + vec2(t * 0.06, t * 0.05)),
    fbm(uv * 2.4 + q * 1.8 + vec2(t * 0.07 + 5.2, t * 0.06 + 2.8))
  );
  float n = fbm(uv * 1.8 + r * 1.4);

  vec3 col = vec3(0.0);

  if (u_mode < 0.5) {
    // calm — blue/teal nebula
    col += vec3(0.05, 0.15, 0.55) * smoothstep(0.35, 0.75, n);
    col += vec3(0.00, 0.45, 0.65) * smoothstep(0.50, 0.85, n) * 0.7;
    col += vec3(0.10, 0.70, 0.80) * smoothstep(0.65, 0.95, n) * 0.4;
  } else if (u_mode < 1.5) {
    // active — purple/magenta nebula
    col += vec3(0.25, 0.02, 0.55) * smoothstep(0.30, 0.70, n);
    col += vec3(0.55, 0.05, 0.75) * smoothstep(0.50, 0.85, n) * 0.8;
    col += vec3(0.20, 0.50, 0.90) * smoothstep(0.65, 0.92, n) * 0.5;
    col += vec3(0.00, 0.80, 0.60) * smoothstep(0.75, 0.98, r.x) * 0.35;
  } else {
    // exam — very dim monochrome
    col += vec3(0.06, 0.08, 0.18) * smoothstep(0.40, 0.80, n);
    col += vec3(0.10, 0.14, 0.28) * smoothstep(0.60, 0.92, n) * 0.5;
  }

  col *= u_intensity;

  // Stars — hash-based point field
  vec2 starGrid = uv * 90.0;
  float star    = step(0.996, hash(floor(starGrid + t * 0.001)));
  float twinkle = 0.6 + 0.4 * sin(u_time * 3.0 + hash(floor(starGrid)) * 20.0);
  col += star * vec3(0.88, 0.93, 1.00) * twinkle
       * (u_mode < 1.5 ? 0.9 : 0.4);

  // Vignette
  float vignette = 1.0 - dot(uv * 0.48, uv * 0.48);
  col *= max(0.0, vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

const MODE_CONFIG = {
  calm:   { speed: 0.18, modeId: 0, intensity: 1.00 },
  active: { speed: 0.42, modeId: 1, intensity: 1.20 },
  exam:   { speed: 0.05, modeId: 2, intensity: 0.55 },
};

const INTENSITY_MAP = { low: 0.65, normal: 1.0, high: 1.35 };

export function VoidNebulaVisualizer({ mode, visualIntensity, reducedMotion }) {
  const config    = MODE_CONFIG[mode] ?? MODE_CONFIG.active;
  const examMode  = mode === "exam";
  const intensity = config.intensity * (INTENSITY_MAP[examMode ? "low" : (visualIntensity ?? "normal")] ?? 1.0);
  const speed     = reducedMotion ? config.speed * 0.2 : config.speed;

  // Expose current values to rAF closure without re-initialising WebGL
  const propsRef = useRef({ speed, modeId: config.modeId, intensity });
  useEffect(() => {
    const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.active;
    const em  = mode === "exam";
    propsRef.current = {
      speed:     reducedMotion ? cfg.speed * 0.2 : cfg.speed,
      modeId:    cfg.modeId,
      intensity: cfg.intensity * (INTENSITY_MAP[em ? "low" : (visualIntensity ?? "normal")] ?? 1.0),
    };
  });

  const hostRef = useWebGLSketch({
    fragmentShader: FRAGMENT_SHADER,
    setUniforms: (gl, prog, _t) => {
      const { speed: spd, modeId, intensity: intens } = propsRef.current;
      gl.uniform1f(gl.getUniformLocation(prog, "u_speed"),     spd);
      gl.uniform1f(gl.getUniformLocation(prog, "u_mode"),      modeId);
      gl.uniform1f(gl.getUniformLocation(prog, "u_intensity"), intens);
    },
  });

  return (
    <div
      ref={hostRef}
      className="lava-visualizer"
      aria-hidden="true"
    />
  );
}
