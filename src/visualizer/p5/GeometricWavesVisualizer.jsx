import { useCallback } from "react";
import { useP5Sketch } from "./useP5Sketch.js";

const MODE_SETTINGS = {
  calm: { speed: 0.16, lines: 12, alpha: 58, amplitude: 28 },
  active: { speed: 0.32, lines: 18, alpha: 82, amplitude: 42 },
  exam: { speed: 0.04, lines: 9, alpha: 36, amplitude: 14 },
};

const INTENSITY_SETTINGS = {
  low: { speed: 0.6, lines: -4, alpha: 0.7 },
  normal: { speed: 1, lines: 0, alpha: 1 },
  high: { speed: 1.35, lines: 5, alpha: 1.18 },
};

function getIntensity(mode, visualIntensity) {
  return mode === "exam" ? "low" : visualIntensity;
}

export function GeometricWavesVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => {
    return (p) => {
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
        p.noFill();
      };

      p.windowResized = () => {
        const host = getHost();
        p.resizeCanvas(host.clientWidth, host.clientHeight);
      };

      p.draw = () => {
        const { mode, reducedMotion, visualIntensity, progress } = getProps();
        const modeSettings = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
        const intensity =
          INTENSITY_SETTINGS[getIntensity(mode, visualIntensity)] ??
          INTENSITY_SETTINGS.normal;
        const lineCount = Math.max(5, modeSettings.lines + intensity.lines);
        const speed = reducedMotion ? modeSettings.speed * 0.25 : modeSettings.speed;
        const t = p.millis() * 0.001 * speed * intensity.speed;

        p.background(3, 7, 18);
        p.strokeWeight(mode === "active" ? 2.15 : 1.75);

        for (let i = 0; i < lineCount; i += 1) {
          const yBase = p.map(i, 0, lineCount - 1, p.height * 0.18, p.height * 0.82);
          const hueShift = i / lineCount;
          p.stroke(
            p.lerp(82, 170, hueShift),
            p.lerp(215, 185, hueShift),
            255,
            Math.min(118, modeSettings.alpha * intensity.alpha),
          );
          p.beginShape();
          for (let x = -20; x <= p.width + 20; x += 18) {
            const wave =
              p.sin(x * 0.018 + t + i * 0.42) * modeSettings.amplitude +
              p.sin(x * 0.006 - t * 0.7 + i) * modeSettings.amplitude * 0.52;
            p.vertex(x, yBase + wave);
          }
          p.endShape();
        }

        const gridAlpha = mode === "exam" ? 10 : 18;
        p.stroke(148, 163, 184, gridAlpha);
        for (let x = 0; x < p.width; x += 72) p.line(x, 0, x, p.height);
        for (let y = 0; y < p.height; y += 72) p.line(0, y, p.width, y);

        if (mode === "active" && progress > 0.82) {
          p.stroke(251, 146, 60, 26);
          p.circle(p.width / 2, p.height / 2, p.width * (0.2 + progress * 0.45));
        }

        p.noStroke();
        p.fill(0, 0, 0, mode === "exam" ? 108 : 58);
        p.rect(0, 0, p.width, p.height);
      };
    };
  }, []);

  const hostRef = useP5Sketch(createSketch, props);
  return <div className="lava-visualizer" ref={hostRef} aria-hidden="true" />;
}
