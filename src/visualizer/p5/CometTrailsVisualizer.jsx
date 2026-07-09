import { useCallback } from "react";
import { resolveIntensity, tintForIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { drawGradient, mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { stars: 65, comets: 3, speed: 0.65 },
  active: { stars: 90, comets: 5, speed: 1 },
  exam: { stars: 48, comets: 2, speed: 0.5 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };
const COMET_COLORS = [[102, 222, 255], [185, 130, 255], [255, 191, 92]];

export function CometTrailsVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let stars = []; let comets = []; let lastKey = "";
    function rebuild(starCount, cometCount) {
      stars = Array.from({ length: starCount }, (_, i) => ({
        x: p.random(), y: p.random(), phase: p.random(p.TWO_PI), order: i,
      }));
      comets = Array.from({ length: cometCount }, (_, i) => ({
        offset: i / cometCount + p.random(0.18), lane: p.random(0.12, 0.72), arc: p.random(0.1, 0.3),
      }));
    }
    p.setup = () => mountCanvas(p, getHost, isCurrent);
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const starCount = Math.max(20, Math.round(base.stars * intensity.countScale));
      const cometCount = Math.max(1, Math.round(base.comets * intensity.countScale * (intensity.extras ? 1.25 : 1)));
      const key = `${starCount}:${cometCount}`;
      if (key !== lastKey) { rebuild(starCount, cometCount); lastKey = key; }
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const t = p.millis() * 0.00013 * speed;
      drawGradient(p, [3, 5, 28], [18, 10, 42]);
      p.stroke(105, 142, 205, 55); p.strokeWeight(0.8);
      const linked = Math.floor(stars.length * Math.min(1, progress) * 0.35);
      for (let i = 1; i < linked; i += 1) {
        const a = stars[i - 1]; const b = stars[i];
        if (p.dist(a.x, a.y, b.x, b.y) < 0.24) p.line(a.x * p.width, a.y * p.height, b.x * p.width, b.y * p.height);
      }
      p.noStroke();
      stars.forEach((star) => {
        const twinkle = 0.45 + p.sin(t * 25 + star.phase) * 0.3;
        p.fill(210, 226, 255, 120 + twinkle * 100);
        p.circle(star.x * p.width, star.y * p.height, 1.1 + twinkle * 1.8);
      });
      comets.forEach((comet, index) => {
        const phase = (t * 0.75 + comet.offset) % 1.35;
        const x = p.lerp(-p.width * 0.2, p.width * 1.15, phase);
        const y = p.height * comet.lane + p.sin(phase * p.PI) * p.height * comet.arc;
        const color = tintForIntensity(COMET_COLORS[index % COMET_COLORS.length], intensity, [65, 69, 91]);
        const trailSteps = intensity.countScale < 0.5 ? 0 : intensity.extras ? 34 : 18;
        for (let step = trailSteps; step > 0; step -= 1) {
          p.fill(...color, (1 - step / trailSteps) * 16);
          p.circle(x - step * 10, y - step * 5, 2 + (trailSteps - step) * 0.15);
        }
        p.drawingContext.shadowBlur = intensity.extras ? 24 : 10;
        p.drawingContext.shadowColor = `rgb(${color.join(",")})`;
        p.fill(...color); p.circle(x, y, intensity.extras ? 10 : 7);
        if (intensity.extras) {
          for (let debris = 0; debris < 5; debris += 1) {
            p.fill(255, 235, 180, 130);
            p.circle(x - p.random(12, 55), y + p.random(-15, 15), p.random(1, 3));
          }
        }
      });
      p.drawingContext.shadowBlur = 0;
    };
  }, []);
  const hostRef = useP5Sketch(createSketch, props);
  return <div className="comet-trails-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
