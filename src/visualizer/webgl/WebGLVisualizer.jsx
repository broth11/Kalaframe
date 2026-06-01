import { useRef, useEffect } from "react";

const DEFAULT_VS = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FULLSCREEN_QUAD = new Float32Array([
  -1, -1,   1, -1,   -1, 1,   1, 1,
]);

/**
 * Shared WebGL hook. Each shader visualizer provides a fragmentShader string
 * and an optional setUniforms(gl, prog, timeSecs) callback.
 * Returns a hostRef to attach to the container div.
 */
export function useWebGLSketch({ fragmentShader, setUniforms }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    host.appendChild(canvas);

    let gl;
    try {
      gl = canvas.getContext("webgl", { antialias: true, alpha: false })
        || canvas.getContext("experimental-webgl", { antialias: true, alpha: false });
      if (!gl) throw new Error("WebGL unavailable");
    } catch (e) {
      console.warn("[WebGLVisualizer] Context creation failed:", e.message);
      canvas.remove();
      return;
    }

    function compile(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[WebGLVisualizer] Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, DEFAULT_VS);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) {
      canvas.remove();
      return;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[WebGLVisualizer] Program link error:", gl.getProgramInfoLog(prog));
      canvas.remove();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_QUAD, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(prog, "u_resolution");
    const uTime       = gl.getUniformLocation(prog, "u_time");

    let rafId;
    let active = true;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w   = Math.round(host.clientWidth  * dpr);
      const h   = Math.round(host.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uResolution) gl.uniform2f(uResolution, canvas.width, canvas.height);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    function frame(ts) {
      if (!active) return;
      const t = ts * 0.001;
      if (uTime) gl.uniform1f(uTime, t);
      if (setUniforms) setUniforms(gl, prog, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(prog);
      canvas.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — fragmentShader is a module constant; setUniforms reads a ref

  return hostRef;
}
