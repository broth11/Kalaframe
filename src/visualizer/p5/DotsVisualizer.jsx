import { useCallback } from "react";
import { useP5Sketch } from "./useP5Sketch.js";

const MODE_SETTINGS = {
  calm: { speed: 0.18, count: 6, radius: 130, alpha: 68, shade: 44 },
  active: { speed: 0.56, count: 9, radius: 138, alpha: 88, shade: 42 },
  exam: { speed: 0.07, count: 4, radius: 120, alpha: 46, shade: 90 },
};

const INTENSITY_SETTINGS = {
  low: { speed: 0.6, count: -2, alpha: 0.72, radius: 0.9 },
  normal: { speed: 1, count: 0, alpha: 1, radius: 1 },
  high: { speed: 1.35, count: 2, alpha: 1.18, radius: 1.08 },
};

function getPalette(mode) {
  if (mode === "calm") {
    return [
      [45, 212, 255],
      [20, 230, 245],
      [150, 145, 255],
      [40, 235, 200],
    ];
  }

  if (mode === "exam") {
    return [
      [30, 41, 59],
      [51, 65, 85],
      [71, 85, 105],
      [15, 23, 42],
    ];
  }

  return [
    [255, 82, 170],
    [190, 92, 255],
    [40, 215, 255],
    [255, 170, 48],
  ];
}

function getIntensity(mode, visualIntensity) {
  return mode === "exam" ? "low" : visualIntensity;
}

export function DotsVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => {
    return (p) => {
      let dots = [];
      let lastCount = 0;

      function resolveSettings() {
        const { mode, visualIntensity } = getProps();
        const modeSettings = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
        const intensity =
          INTENSITY_SETTINGS[getIntensity(mode, visualIntensity)] ??
          INTENSITY_SETTINGS.normal;
        const count = Math.max(2, modeSettings.count + intensity.count);

        return { modeSettings, intensity, count };
      }

      function resetDots() {
        const { count } = resolveSettings();
        lastCount = count;
        dots = Array.from({ length: count }, (_, index) => ({
          xOffset: p.random(1000),
          yOffset: p.random(1000),
          sizeOffset: p.random(1000),
          phase: index * 0.2,
        }));
      }

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
        p.noStroke();
        resetDots();
      };

      p.windowResized = () => {
        const host = getHost();
        p.resizeCanvas(host.clientWidth, host.clientHeight);
      };

      p.draw = () => {
        const { mode, progress, reducedMotion } = getProps();
        const { modeSettings, intensity, count } = resolveSettings();
        if (count !== lastCount) resetDots();

        const palette = getPalette(mode);
        const speed = reducedMotion ? modeSettings.speed * 0.25 : modeSettings.speed;
        const t = p.millis() * 0.0001 * speed * intensity.speed;

        p.clear();

        const bgTop = mode === "exam" ? [2, 6, 23] : [8, 13, 28];
        const bgBottom = mode === "calm" ? [15, 23, 42] : [30, 20, 45];

        for (let y = 0; y < p.height; y += 2) {
          const amt = y / p.height;
          p.fill(
            p.lerp(bgTop[0], bgBottom[0], amt),
            p.lerp(bgTop[1], bgBottom[1], amt),
            p.lerp(bgTop[2], bgBottom[2], amt),
            255,
          );
          p.rect(0, y, p.width, 2);
        }

        const endEnergy =
          mode === "active" && progress > 0.82 ? p.map(progress, 0.82, 1, 0, 1) : 0;

        for (let i = 0; i < dots.length; i += 1) {
          const dot = dots[i];
          const color = palette[i % palette.length];
          const nx = p.noise(dot.xOffset + t + dot.phase);
          const ny = p.noise(dot.yOffset + t * 0.87 + dot.phase);
          const ns = p.noise(dot.sizeOffset + t * 0.6);
          const x = p.lerp(-p.width * 0.1, p.width * 1.1, nx);
          const y = p.lerp(-p.height * 0.1, p.height * 1.1, ny);
          const radius =
            (modeSettings.radius + ns * 135 + endEnergy * 28) * intensity.radius;
          const alpha = Math.min(142, modeSettings.alpha * intensity.alpha + endEnergy * 30);

          p.fill(color[0], color[1], color[2], alpha);
          p.circle(x, y, radius);

          p.fill(color[0], color[1], color[2], alpha * 0.45);
          p.circle(p.width - x, y * 0.94 + p.height * 0.03, radius * 0.72);
        }

        p.fill(0, 0, 0, modeSettings.shade);
        p.rect(0, 0, p.width, p.height);
      };
    };
  }, []);

  const hostRef = useP5Sketch(createSketch, props);
  return <div className="lava-visualizer" ref={hostRef} aria-hidden="true" />;
}
