import { useCallback } from "react";
import { resolveIntensity, tintForIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { drawGradient, mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { balloons: 14, speed: 0.65 },
  active: { balloons: 22, speed: 1 },
  exam: { balloons: 10, speed: 0.5 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };
const COLORS = [[255, 91, 119], [255, 184, 64], [77, 202, 255], [163, 103, 255], [70, 218, 154]];

export function BalloonRiseVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let balloons = []; let lastCount = -1;
    function rebuild(count) {
      lastCount = count;
      balloons = Array.from({ length: count }, (_, i) => ({
        x: p.random(), y: p.random(), size: p.random(18, 38), phase: p.random(20), color: i % COLORS.length,
        hotAir: i % 5 === 0,
      }));
    }
    p.setup = () => mountCanvas(p, getHost, isCurrent);
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(5, Math.round(base.balloons * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const t = p.millis() * 0.00012 * speed;
      drawGradient(p, [255 - progress * 75, 151 + progress * 50, 132 + progress * 90], [85 + progress * 30, 167 + progress * 45, 229 + progress * 20]);
      p.noStroke();
      if (intensity.countScale > 0.5) {
        for (let cloud = 0; cloud < 6; cloud += 1) {
          const x = ((cloud * 0.22 + t * 0.08) % 1.35 - 0.15) * p.width;
          const y = p.height * (0.15 + (cloud % 3) * 0.2);
          p.fill(255, 255, 255, 95);
          p.ellipse(x, y, 130, 42); p.circle(x - 38, y - 12, 55); p.circle(x + 35, y - 10, 65);
        }
      }
      balloons.forEach((balloon, index) => {
        const y = ((balloon.y - t * (0.38 + (index % 4) * 0.035)) % 1.25 + 1.25) % 1.25;
        const x = balloon.x + p.sin(t * 15 + balloon.phase) * 0.035;
        const px = x * p.width; const py = y * p.height;
        const color = tintForIntensity(COLORS[balloon.color], intensity, [115, 105, 104]);
        p.stroke(70, 70, 85, 120); p.strokeWeight(1); p.line(px, py + balloon.size, px, py + balloon.size * 2.2);
        p.noStroke(); p.fill(...color, 225);
        p.ellipse(px, py, balloon.size * (balloon.hotAir ? 1.3 : 1), balloon.size * 1.35);
        p.triangle(px - 5, py + balloon.size * 0.55, px + 5, py + balloon.size * 0.55, px, py + balloon.size * 0.78);
        if (balloon.hotAir) {
          p.fill(83, 51, 35); p.rect(px - 6, py + balloon.size * 0.85, 12, 8);
        }
      });
      if (intensity.extras) {
        p.noStroke();
        for (let piece = 0; piece < 85; piece += 1) {
          const x = p.noise(piece * 2.7) * p.width;
          const y = (p.noise(piece * 8.3) + t * 1.8 + piece * 0.03) % 1 * p.height;
          p.fill(...COLORS[piece % COLORS.length], 185);
          p.rect(x, y, 5, 9);
        }
      }
    };
  }, []);
  const hostRef = useP5Sketch(createSketch, props);
  return <div className="balloon-rise-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
