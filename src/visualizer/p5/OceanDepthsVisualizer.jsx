import { useCallback } from "react";
import { resolveIntensity, tintForIntensity } from "../intensityContract.js";
import { useP5Sketch } from "./useP5Sketch.js";
import { drawGradient, mountCanvas, resizeCanvasToHost } from "./p5SceneUtils.js";

const MODE_SETTINGS = {
  calm: { bubbles: 34, speed: 0.65 },
  active: { bubbles: 48, speed: 1 },
  exam: { bubbles: 28, speed: 0.55 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };

export function OceanDepthsVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => (p) => {
    let bubbles = [];
    let lastCount = -1;
    function rebuild(count) {
      lastCount = count;
      bubbles = Array.from({ length: count }, () => ({
        x: p.random(), y: p.random(), r: p.random(2, 9), phase: p.random(20),
      }));
    }
    p.setup = () => mountCanvas(p, getHost, isCurrent);
    p.windowResized = () => resizeCanvasToHost(p, getHost);
    p.draw = () => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(10, Math.round(base.bubbles * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      const time = p.millis() * 0.00015 * speed;
      const light = progress * 24;
      drawGradient(p, [4 + light, 38 + light, 68 + light], [1, 10 + light * 0.25, 31 + light * 0.4]);

      if (intensity !== resolveIntensity("exam", "low")) {
        p.noStroke();
        for (let ray = 0; ray < 5; ray += 1) {
          p.fill(90, 210, 230, 12);
          const x = p.width * (0.12 + ray * 0.2) + p.sin(time * 4 + ray) * 35;
          p.quad(x, 0, x + 55, 0, x + 190, p.height, x - 80, p.height);
        }
      }
      bubbles.forEach((bubble, index) => {
        const y = ((bubble.y - time * 0.8 - bubble.phase * 0.01) % 1 + 1) % 1;
        const x = bubble.x + p.sin(time * 10 + bubble.phase) * 0.015;
        const color = tintForIntensity([105, 226, 245], intensity, [45, 74, 88]);
        p.noFill(); p.stroke(...color, 75); p.strokeWeight(1.2);
        p.circle(x * p.width, y * p.height, bubble.r * 2);
        if (intensity.extras && index % 4 === 0) {
          p.fill(180, 255, 255, 100); p.noStroke();
          p.circle(x * p.width - bubble.r * 0.3, y * p.height - bubble.r * 0.3, 2);
        }
      });
      const schools = intensity.extras ? 3 : 1;
      p.noStroke(); p.fill(2, 15, 31, 150);
      for (let school = 0; school < schools; school += 1) {
        const leadX = ((time * (0.12 + school * 0.03) + school * 0.37) % 1.3) * p.width - p.width * 0.15;
        for (let fish = 0; fish < 7; fish += 1) {
          const x = leadX - fish * 28;
          const y = p.height * (0.35 + school * 0.16) + p.sin(time * 8 + fish) * 13;
          p.triangle(x - 9, y, x + 9, y - 5, x + 9, y + 5);
          p.triangle(x - 9, y, x - 17, y - 6, x - 17, y + 6);
        }
      }
    };
  }, []);
  const hostRef = useP5Sketch(createSketch, props);
  return <div className="ocean-depths-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
