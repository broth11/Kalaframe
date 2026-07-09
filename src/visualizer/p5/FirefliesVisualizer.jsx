import { useCallback } from "react";
import { resolveIntensity, tintForIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { drawGradient, mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { count: 32, speed: 0.75 },
  active: { count: 46, speed: 1 },
  exam: { count: 28, speed: 0.6 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };
const COLORS = [[255, 232, 93], [158, 255, 132], [99, 234, 255]];

export function FirefliesVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let flies = [];
    let lastCount = -1;

    function rebuild(count) {
      lastCount = count;
      flies = Array.from({ length: count }, () => ({
        x: p.random(), y: p.random(), nx: p.random(1000), ny: p.random(1000),
        phase: p.random(p.TWO_PI), trail: [],
      }));
    }

    p.setup = () => {
      if (!mountCanvas(p, getHost, isCurrent)) return;
      p.noStroke();
    };
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(8, Math.round(base.count * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const t = p.millis() * 0.00014 * speed;
      drawGradient(p, [3, 12, 24], [8, 35, 25]);
      p.fill(4, 25, 18, 190);
      p.beginShape();
      for (let x = 0; x <= p.width; x += 24) {
        p.vertex(x, p.height * (0.82 + p.noise(x * 0.01) * 0.1));
      }
      p.vertex(p.width, p.height); p.vertex(0, p.height); p.endShape(p.CLOSE);

      flies.forEach((fly, index) => {
        const driftX = p.noise(fly.nx + t) * p.width;
        const driftY = p.noise(fly.ny + t * 0.83) * p.height * 0.82;
        const gather = Math.max(0, (progress - 0.58) / 0.42) * 0.72;
        const x = p.lerp(driftX, p.width / 2 + p.sin(t * 8 + fly.phase) * 90, gather);
        const y = p.lerp(driftY, p.height / 2 + p.cos(t * 7 + fly.phase) * 70, gather);
        const blink = p.pow(Math.max(0, p.sin(t * 20 + fly.phase)), 4);
        const color = tintForIntensity(COLORS[index % COLORS.length], intensity);
        if (intensity.extras) {
          fly.trail.push({ x, y });
          if (fly.trail.length > 10) fly.trail.shift();
          fly.trail.forEach((point, trailIndex) => {
            p.fill(...color, trailIndex * 4);
            p.circle(point.x, point.y, 2 + trailIndex * 0.35);
          });
        } else {
          fly.trail.length = 0;
        }
        p.drawingContext.shadowBlur = intensity.extras ? 28 : 14;
        p.drawingContext.shadowColor = `rgb(${color.join(",")})`;
        p.fill(...color, 95 + blink * 160);
        p.circle(x, y, 3 + blink * 5);
      });
      p.drawingContext.shadowBlur = 0;
    };
  }, []);

  const hostRef = useP5Sketch(createSketch, props);
  return <div className="fireflies-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
