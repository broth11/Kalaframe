import { useCallback } from "react";
import { resolveIntensity, tintForIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { drawGradient, mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { count: 9, speed: 0.65 },
  active: { count: 13, speed: 1 },
  exam: { count: 7, speed: 0.5 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };
const COLORS = [[110, 242, 225], [161, 135, 255], [255, 119, 198]];

export function JellyDriftVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let jellies = [];
    let lastCount = -1;
    function rebuild(count) {
      lastCount = count;
      jellies = Array.from({ length: count }, (_, i) => ({
        x: p.random(), y: p.random(), size: p.random(22, 48),
        phase: p.random(p.TWO_PI), color: i % COLORS.length,
      }));
    }
    p.setup = () => mountCanvas(p, getHost, isCurrent);
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(4, Math.round(base.count * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const t = p.millis() * 0.00016 * speed;
      drawGradient(p, [2, 35, 47], [1, 10, 27]);
      p.noStroke();
      const planktonCount = intensity.extras ? 110 : intensity.countScale > 0.5 ? 45 : 0;
      for (let i = 0; i < planktonCount; i += 1) {
        const x = p.noise(i * 8.2, t) * p.width;
        const y = (p.noise(i * 3.1) + t * (0.15 + progress * 0.05)) % 1 * p.height;
        p.fill(130, 245, 224, intensity.extras ? 80 : 35); p.circle(x, y, intensity.extras ? 2.2 : 1.4);
      }
      jellies.forEach((jelly, index) => {
        const y = ((jelly.y - t * 0.55 - index * 0.008) % 1.2 + 1.2) % 1.2 * p.height;
        const x = (jelly.x + p.sin(t * 12 + jelly.phase) * 0.045) * p.width;
        const pulse = 0.9 + p.sin(t * 18 + jelly.phase) * 0.12;
        const color = tintForIntensity(COLORS[jelly.color], intensity, [55, 76, 82]);
        p.push(); p.translate(x, y); p.noStroke(); p.fill(...color, 85);
        p.arc(0, 0, jelly.size * pulse, jelly.size * 0.75, p.PI, p.TWO_PI, p.CHORD);
        p.noFill(); p.stroke(...color, 85); p.strokeWeight(intensity.extras ? 2 : 1.2);
        const tentacles = intensity.extras ? 8 : 5;
        for (let line = 0; line < tentacles; line += 1) {
          const startX = p.map(line, 0, tentacles - 1, -jelly.size * 0.35, jelly.size * 0.35);
          p.beginShape();
          for (let segment = 0; segment <= 7; segment += 1) {
            const yy = segment * jelly.size * 0.22;
            p.splineVertex(startX + p.sin(t * 20 + line + segment * 0.8) * 4, yy);
          }
          p.endShape();
        }
        p.pop();
      });
    };
  }, []);
  const hostRef = useP5Sketch(createSketch, props);
  return <div className="jelly-drift-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
