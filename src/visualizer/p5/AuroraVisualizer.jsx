import { useCallback } from "react";
import { useP5Sketch } from "./useP5Sketch.js";

const MODE_SETTINGS = {
  calm: { speed: 0.22, ribbons: 4, alpha: 66, amplitude: 0.2 },
  active: { speed: 0.42, ribbons: 6, alpha: 88, amplitude: 0.28 },
  exam: { speed: 0.08, ribbons: 3, alpha: 34, amplitude: 0.13 },
};

const INTENSITY_SETTINGS = {
  low: { speed: 0.65, ribbons: -1, alpha: 0.72, amplitude: 0.8 },
  normal: { speed: 1, ribbons: 0, alpha: 1, amplitude: 1 },
  high: { speed: 1.32, ribbons: 2, alpha: 1.18, amplitude: 1.2 },
};

const COLORS = [
  [80, 255, 190],
  [51, 210, 255],
  [139, 124, 255],
  [196, 92, 255],
];

function getIntensity(mode, visualIntensity) {
  return mode === "exam" ? "low" : visualIntensity;
}

export function AuroraVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => {
    return (p) => {
      const stars = Array.from({ length: 80 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.65,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 70 + 25,
      }));

      p.setup = () => {
        const host = getHost();
        const canvas = p.createCanvas(host.clientWidth, host.clientHeight);
        canvas.parent(host);
        if (!isCurrent()) {
          p.remove();
          return;
        }
        host.querySelectorAll("canvas").forEach((element) => {
          if (element !== canvas.elt) element.remove();
        });
      };

      p.windowResized = () => {
        const host = getHost();
        p.resizeCanvas(host.clientWidth, host.clientHeight);
      };

      function drawRibbon(yBase, color, alpha, weight, phase, t, amplitude) {
        p.noFill();
        p.stroke(color[0], color[1], color[2], alpha);
        p.strokeWeight(weight);
        p.beginShape();
        for (let x = -80; x <= p.width + 80; x += 18) {
          const noiseWave = p.noise(x * 0.0022, phase, t * 0.5) - 0.5;
          const sineWave = p.sin(x * 0.009 + t * 5.8 + phase * 4) * 0.5;
          const y = yBase + (noiseWave + sineWave) * p.height * amplitude;
          p.splineVertex(x, y);
        }
        p.endShape();
      }

      p.draw = () => {
        const { mode, reducedMotion, visualIntensity } = getProps();
        const modeSettings = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
        const intensity =
          INTENSITY_SETTINGS[getIntensity(mode, visualIntensity)] ??
          INTENSITY_SETTINGS.normal;
        const ribbonCount = Math.max(2, modeSettings.ribbons + intensity.ribbons);
        const speed = reducedMotion ? modeSettings.speed * 0.25 : modeSettings.speed;
        const t = p.millis() * 0.00022 * speed * intensity.speed;
        const bgBottom = mode === "calm" ? [7, 18, 34] : [9, 10, 32];

        for (let y = 0; y < p.height; y += 2) {
          const amt = y / p.height;
          p.stroke(
            p.lerp(1, bgBottom[0], amt),
            p.lerp(5, bgBottom[1], amt),
            p.lerp(18, bgBottom[2], amt),
          );
          p.line(0, y, p.width, y);
        }

        p.noStroke();
        for (const star of stars) {
          p.fill(210, 235, 255, mode === "exam" ? star.alpha * 0.3 : star.alpha * 0.55);
          p.circle(star.x * p.width, star.y * p.height, star.size);
        }

        p.blendMode(p.ADD);
        p.drawingContext.save();
        p.drawingContext.filter = "blur(14px)";
        for (let r = 0; r < ribbonCount; r += 1) {
          const color = COLORS[r % COLORS.length];
          const spread = ribbonCount <= 1 ? 0 : r / (ribbonCount - 1);
          const yBase = p.height * (0.2 + spread * 0.54 + p.sin(t * 2 + r) * 0.045);
          const alpha = Math.min(92, modeSettings.alpha * intensity.alpha * 0.58);
          drawRibbon(yBase, color, alpha, 54 + r * 4, r * 0.24, t, modeSettings.amplitude * intensity.amplitude);
        }
        p.drawingContext.restore();

        for (let r = 0; r < ribbonCount; r += 1) {
          const color = COLORS[r % COLORS.length];
          const spread = ribbonCount <= 1 ? 0 : r / (ribbonCount - 1);
          const yBase = p.height * (0.2 + spread * 0.54 + p.sin(t * 2 + r) * 0.045);
          const alpha = Math.min(120, modeSettings.alpha * intensity.alpha);
          drawRibbon(yBase, color, alpha, 16 + r * 2, r * 0.24, t, modeSettings.amplitude * intensity.amplitude);
        }
        p.blendMode(p.BLEND);

        p.noStroke();
        p.fill(0, 0, 0, mode === "exam" ? 118 : 58);
        p.rect(0, 0, p.width, p.height);
      };
    };
  }, []);

  const hostRef = useP5Sketch(createSketch, props);
  return <div className="lava-visualizer" ref={hostRef} aria-hidden="true" />;
}
