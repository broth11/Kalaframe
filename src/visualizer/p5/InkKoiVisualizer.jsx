import { useCallback } from "react";
import { resolveIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { koi: 3, speed: 0.65 },
  active: { koi: 4, speed: 1 },
  exam: { koi: 2, speed: 0.5 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };

export function InkKoiVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let koi = []; let lastCount = -1;
    function rebuild(count) {
      lastCount = count;
      koi = Array.from({ length: count }, (_, index) => ({
        radius: 0.13 + index * 0.055, phase: index * p.TWO_PI / count,
        size: p.random(28, 46), direction: index % 2 ? -1 : 1,
      }));
    }
    p.setup = () => mountCanvas(p, getHost, isCurrent);
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.min(5, Math.max(2, Math.round(base.koi * intensity.countScale)));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const t = p.millis() * 0.00022 * speed;
      p.background(246, 243, 232);
      p.noFill(); p.stroke(34, 39, 38, 18);
      for (let line = 0; line < 16; line += 1) {
        p.circle(p.width * (0.15 + (line * 0.19) % 0.8), p.height * (0.2 + (line * 0.27) % 0.65), 40 + line * 8);
      }
      koi.forEach((fish, index) => {
        const angle = t * 5 * fish.direction + fish.phase;
        const x = p.width / 2 + p.cos(angle) * p.width * fish.radius;
        const y = p.height / 2 + p.sin(angle) * p.height * fish.radius;
        const heading = angle + (fish.direction > 0 ? p.HALF_PI : -p.HALF_PI);
        p.push(); p.translate(x, y); p.rotate(heading);
        const alpha = intensity.countScale < 0.5 ? 125 : 185;
        p.noStroke(); p.fill(index % 2 ? 23 : 177, index % 2 ? 29 : 52, index % 2 ? 28 : 38, alpha);
        p.ellipse(0, 0, fish.size * 0.68, fish.size * 1.7);
        p.fill(246, 243, 232, 175); p.ellipse(0, -fish.size * 0.15, fish.size * 0.25, fish.size * 0.42);
        p.noFill(); p.stroke(30, 34, 32, alpha); p.strokeWeight(intensity.extras ? 3 : 1.8);
        const ribbons = intensity.extras ? 5 : 3;
        for (let fin = 0; fin < ribbons; fin += 1) {
          p.bezier(0, fish.size * 0.72, (fin - 2) * 8, fish.size, p.sin(t * 20 + fin) * 13, fish.size * 1.3, (fin - 1) * 7, fish.size * 1.6);
        }
        p.pop();
      });
      const rippleCount = intensity.extras ? 7 : intensity.countScale > 0.5 ? 3 : 0;
      p.noFill(); p.stroke(35, 45, 43, 35);
      for (let ripple = 0; ripple < rippleCount; ripple += 1) {
        const radius = ((t * 140 + ripple * 85 + progress * 80) % 360);
        p.ellipse(p.width * (0.18 + (ripple * 0.21) % 0.68), p.height * (0.2 + (ripple * 0.31) % 0.65), radius, radius * 0.34);
      }
    };
  }, []);
  const hostRef = useP5Sketch(createSketch, props);
  return <div className="ink-koi-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
