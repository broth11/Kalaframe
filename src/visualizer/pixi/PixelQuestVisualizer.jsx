import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { resolveIntensity } from "../intensityContract.js";
import { usePixiApp } from "./usePixiApp.js";

const MODE_SETTINGS = {
  calm: { clouds: 5, speed: 0.65 },
  active: { clouds: 8, speed: 1 },
  exam: { clouds: 4, speed: 0.5 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };

function mixColor(from, to, amount) {
  const a = [(from >> 16) & 255, (from >> 8) & 255, from & 255];
  const b = [(to >> 16) & 255, (to >> 8) & 255, to & 255];
  return (Math.round(a[0] + (b[0] - a[0]) * amount) << 16)
    | (Math.round(a[1] + (b[1] - a[1]) * amount) << 8)
    | Math.round(a[2] + (b[2] - a[2]) * amount);
}

export function PixelQuestVisualizer(props) {
  const createApp = useCallback(({ app, getProps }) => {
    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);
    let clouds = []; let lastCount = -1; let elapsed = 0;
    function rebuild(count) {
      lastCount = count;
      clouds = Array.from({ length: count }, (_, index) => ({
        x: Math.random(), y: 0.1 + Math.random() * 0.42, size: 1 + index % 3,
      }));
    }
    app.ticker.add((delta) => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(2, Math.round(base.clouds * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      elapsed += delta * 0.016 * speed;
      const W = app.screen.width; const H = app.screen.height;
      graphics.clear();
      graphics.beginFill(mixColor(0x64c8ff, 0xfa7690, progress)); graphics.drawRect(0, 0, W, H); graphics.endFill();
      const sun = mixColor(0xfff1a6, 0xff784e, progress);
      graphics.beginFill(sun); graphics.drawRect(W * (0.76 - progress * 0.18), H * (0.12 + progress * 0.28), 48, 48); graphics.endFill();
      clouds.forEach((cloud, index) => {
        const x = ((cloud.x - elapsed * 0.018 * (1 + index % 2)) % 1.25 + 1.25) % 1.25 * W;
        const y = cloud.y * H; const unit = 12 * cloud.size;
        graphics.beginFill(intensity.countScale < 0.5 ? 0xb8bdc4 : 0xf4f3e8, 0.82);
        graphics.drawRect(x, y, unit * 3, unit); graphics.drawRect(x + unit, y - unit, unit * 2, unit); graphics.endFill();
      });
      const layers = [
        { y: 0.58, color: mixColor(0x8273bd, 0x6c3f75, progress), speed: 8, step: 86 },
        { y: 0.68, color: mixColor(0x3e7d86, 0x513a66, progress), speed: 17, step: 64 },
        { y: 0.78, color: mixColor(0x205d55, 0x342b50, progress), speed: 31, step: 48 },
        { y: 0.88, color: 0x173936, speed: 52, step: 36 },
      ];
      layers.forEach((layer, layerIndex) => {
        const offset = elapsed * layer.speed % layer.step;
        graphics.beginFill(layer.color);
        for (let x = -layer.step - offset; x < W + layer.step; x += layer.step) {
          const height = 30 + ((x / layer.step + layerIndex * 3) % 4 + 4) % 4 * 15;
          graphics.drawRect(Math.round(x), H * layer.y - height, layer.step + 1, H);
        }
        graphics.endFill();
      });
      const px = W * 0.5; const py = H * 0.76;
      const frame = Math.floor(elapsed * 10) % 2;
      graphics.beginFill(0x2a193d); graphics.drawRect(px - 8, py - 25, 16, 20); graphics.drawRect(px - 6, py - 33, 12, 9); graphics.endFill();
      graphics.beginFill(0xffd278); graphics.drawRect(px - 5, py - 31, 10, 7); graphics.endFill();
      graphics.beginFill(0x29213e); graphics.drawRect(px - 8, py - 5, 6, 12 + frame * 4); graphics.drawRect(px + 2, py - 5, 6, 16 - frame * 4); graphics.endFill();
      if (intensity.extras) {
        graphics.lineStyle(3, 0xe8fbff, 0.42);
        for (let line = 0; line < 12; line += 1) {
          const y = (line * 71 + elapsed * 190) % H;
          graphics.moveTo(W - 130 - line * 13, y); graphics.lineTo(W, y - 12);
        }
        graphics.beginFill(0xa8d8ee, 0.45);
        for (let drop = 0; drop < 36; drop += 1) {
          const x = (drop * 83 + elapsed * 110) % W;
          const y = (drop * 47 + elapsed * 175) % H;
          graphics.drawRect(x, y, 2, 8);
        }
        graphics.endFill();
      }
    });
  }, []);
  const hostRef = usePixiApp(createApp, props);
  return <div className="pixel-quest-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
