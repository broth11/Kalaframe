import { useCallback } from "react";
import { resolveIntensity, tintForIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { drawGradient, mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { flowers: 18, speed: 0.7 },
  active: { flowers: 26, speed: 1 },
  exam: { flowers: 14, speed: 0.55 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };
const COLORS = [[255, 112, 154], [255, 190, 75], [153, 112, 255], [60, 208, 176]];

export function GardenBloomVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let flowers = [];
    let petals = [];
    let lastCount = -1;
    function rebuild(count) {
      lastCount = count;
      flowers = Array.from({ length: count }, (_, index) => ({
        x: (index + p.random(0.2, 0.8)) / count,
        height: p.random(0.15, 0.48), size: p.random(12, 25),
        phase: p.random(p.TWO_PI), color: index % COLORS.length,
      }));
      petals = Array.from({ length: Math.ceil(count * 0.45) }, () => ({
        x: p.random(), y: p.random(), phase: p.random(20),
      }));
    }
    p.setup = () => mountCanvas(p, getHost, isCurrent);
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(6, Math.round(base.flowers * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const t = p.millis() * 0.00018 * speed;
      drawGradient(p, [18, 48, 65], [8, 42, 31]);
      flowers.forEach((flower, index) => {
        const growth = p.constrain(progress * 1.25 + 0.32 - index / count, 0.08, 1);
        const ground = p.height * (0.91 + (index % 3) * 0.025);
        const stemHeight = p.height * flower.height * growth;
        const x = flower.x * p.width;
        p.noFill(); p.stroke(65, 154, 91, 190); p.strokeWeight(2.5);
        p.bezier(x, ground, x + 12, ground - stemHeight * 0.4, x - 10, ground - stemHeight * 0.7, x, ground - stemHeight);
        if (growth > 0.65) {
          const bloom = p.map(growth, 0.65, 1, 0, 1);
          const color = tintForIntensity(COLORS[flower.color], intensity, [85, 92, 79]);
          p.push(); p.translate(x, ground - stemHeight); p.rotate(p.sin(t * 8 + flower.phase) * 0.06);
          p.noStroke(); p.fill(...color, 220);
          const petalCount = intensity.extras ? 10 : 7;
          for (let petal = 0; petal < petalCount; petal += 1) {
            p.rotate(p.TWO_PI / petalCount);
            p.ellipse(0, -flower.size * 0.55 * bloom, flower.size * 0.48 * bloom, flower.size * bloom);
          }
          p.fill(255, 216, 74); p.circle(0, 0, flower.size * 0.5 * bloom); p.pop();
        }
      });
      if (intensity.extras) {
        p.noStroke();
        petals.forEach((petal, index) => {
          const y = (petal.y + t * 0.4 + index * 0.03) % 1;
          p.fill(...COLORS[index % COLORS.length], 130);
          p.ellipse((petal.x + p.sin(t * 9 + petal.phase) * 0.05) * p.width, y * p.height, 8, 4);
        });
      }
    };
  }, []);
  const hostRef = useP5Sketch(createSketch, props);
  return <div className="garden-bloom-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
