import { useRef, useEffect } from "react";
import { useWebGLSketch } from "./WebGLVisualizer.jsx";

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_blobCount;
uniform float u_mode;      // 0=calm 1=active 2=exam
uniform float u_progress;

float blob(vec2 p, vec2 center, float r) {
  vec2 d = p - center;
  return (r * r) / dot(d, d);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;
  float f = 0.0;

  // Core blobs — always present
  f += blob(uv, vec2(-0.42 + sin(t * 0.58)        * 0.30, -0.26 + cos(t * 0.46)        * 0.28), 0.112);
  f += blob(uv, vec2( 0.44 + cos(t * 0.62)        * 0.28,  0.30 + sin(t * 0.50)        * 0.30), 0.102);
  f += blob(uv, vec2( 0.12 + sin(t * 0.48 + 1.20) * 0.42, -0.44 + cos(t * 0.56 + 2.00) * 0.24), 0.094);

  // Extra blobs — active mode
  if (u_blobCount > 3.0) {
    f += blob(uv, vec2(-0.62 + cos(t * 0.72)        * 0.22,  0.36 + sin(t * 0.42)        * 0.26), 0.084);
    f += blob(uv, vec2( 0.68 + sin(t * 0.64 + 3.00) * 0.22, -0.10 + cos(t * 0.48)        * 0.34), 0.078);
  }
  if (u_blobCount > 5.0) {
    f += blob(uv, vec2(-0.08 + cos(t * 0.44 + 1.50) * 0.48,  0.58 + sin(t * 0.70)        * 0.20), 0.072);
    f += blob(uv, vec2( 0.28 + sin(t * 0.76 + 0.80) * 0.30, -0.62 + cos(t * 0.58 + 1.00) * 0.20), 0.066);
  }

  // Color palette by mode
  vec3 bg, hot, warm, glow;
  if (u_mode < 0.5) {
    // calm — blue/teal
    bg   = vec3(0.02, 0.04, 0.12);
    glow = vec3(0.00, 0.40, 0.70);
    warm = vec3(0.10, 0.70, 0.90);
    hot  = vec3(0.30, 0.90, 0.85);
  } else if (u_mode < 1.5) {
    // active — orange/amber/magenta
    bg   = vec3(0.04, 0.02, 0.06);
    glow = vec3(0.60, 0.05, 0.15);
    warm = vec3(0.95, 0.45, 0.05);
    hot  = vec3(1.00, 0.82, 0.15);
  } else {
    // exam — deep muted blue
    bg   = vec3(0.02, 0.03, 0.08);
    glow = vec3(0.08, 0.12, 0.28);
    warm = vec3(0.14, 0.20, 0.40);
    hot  = vec3(0.22, 0.30, 0.55);
  }

  vec3 col = bg;
  col = mix(col, glow * 0.5, smoothstep(0.50, 0.90, f) * 0.7);
  col = mix(col, warm,       smoothstep(0.88, 1.02, f));
  col = mix(col, hot,        smoothstep(1.02, 1.22, f));

  // Specular highlight on blob surface
  col += vec3(1.0) * smoothstep(1.15, 1.30, f) * 0.55;

  // Final-minute pulse for active mode
  if (u_mode > 0.5 && u_mode < 1.5 && u_progress > 0.85) {
    float pulse = sin(u_time * 6.0) * 0.5 + 0.5;
    float rim   = smoothstep(0.85, 1.00, f) * (1.0 - smoothstep(1.00, 1.05, f));
    col += vec3(1.0, 0.4, 0.0) * rim * pulse * 0.4
         * smoothstep(0.85, 1.0, u_progress);
  }

  // Vignette
  float vignette = 1.0 - dot(uv * 0.55, uv * 0.55);
  col *= max(0.0, vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

const MODE_CONFIG = {
  calm:   { speed: 0.224, blobCount: 3, modeId: 0 },
  active: { speed: 0.464, blobCount: 7, modeId: 1 },
  exam:   { speed: 0.056, blobCount: 3, modeId: 2 },
};

export function LavaMetaballVisualizer({ mode, reducedMotion, progress }) {
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.active;
  const speed  = reducedMotion ? config.speed * 0.2 : config.speed;

  // Expose current values to the rAF closure without re-initialising WebGL
  const propsRef = useRef({ speed, blobCount: config.blobCount, modeId: config.modeId, progress });
  useEffect(() => {
    propsRef.current = {
      speed:     reducedMotion ? config.speed * 0.2 : config.speed,
      blobCount: config.blobCount,
      modeId:    config.modeId,
      progress:  progress ?? 0,
    };
  });

  const hostRef = useWebGLSketch({
    fragmentShader: FRAGMENT_SHADER,
    setUniforms: (gl, prog, _t) => {
      const { speed: spd, blobCount, modeId, progress: pg } = propsRef.current;
      gl.uniform1f(gl.getUniformLocation(prog, "u_speed"),     spd);
      gl.uniform1f(gl.getUniformLocation(prog, "u_blobCount"), blobCount);
      gl.uniform1f(gl.getUniformLocation(prog, "u_mode"),      modeId);
      gl.uniform1f(gl.getUniformLocation(prog, "u_progress"),  pg);
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
