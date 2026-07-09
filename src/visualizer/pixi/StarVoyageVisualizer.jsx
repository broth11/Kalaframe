import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { resolveIntensity } from "../intensityContract.js";
import { usePixiApp } from "./usePixiApp.js";

const MODE_SETTINGS = {
  calm: { stars: 90, speed: 0.75 },
  active: { stars: 135, speed: 1 },
  exam: { stars: 70, speed: 0.55 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };

export function StarVoyageVisualizer(props) {
  const createApp = useCallback(({ app, getProps }) => {
    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);
    let stars = [];
    let lastCount = -1;
    let elapsed = 0;

    function rebuild(count) {
      lastCount = count;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
        z: Math.random() * 0.96 + 0.04, color: Math.random() > 0.82 ? 0x9edfff : 0xffffff,
      }));
    }

    app.ticker.add((delta) => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const count = Math.max(30, Math.round(base.stars * intensity.countScale));
      if (count !== lastCount) rebuild(count);
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1) * (1 + progress * 0.25);
      elapsed += delta * 0.016 * speed;
      graphics.clear();
      graphics.beginFill(0x030518); graphics.drawRect(0, 0, app.screen.width, app.screen.height); graphics.endFill();
      const cx = app.screen.width / 2; const cy = app.screen.height / 2;
      const scale = Math.min(app.screen.width, app.screen.height) * 0.55;

      graphics.lineStyle(2, 0x7d5cff, intensity.extras ? 0.3 : 0.12);
      const galaxyRadius = Math.min(app.screen.width, app.screen.height) * 0.18;
      for (let arm = 0; arm < 3; arm += 1) {
        graphics.moveTo(cx, cy);
        for (let point = 0; point < 32; point += 1) {
          const r = galaxyRadius * point / 31;
          const angle = elapsed * 0.08 + arm * Math.PI * 2 / 3 + point * 0.22;
          graphics.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.42);
        }
      }

      stars.forEach((star) => {
        star.z -= 0.0065 * speed * delta;
        if (star.z <= 0.025) {
          star.z = 1; star.x = Math.random() * 2 - 1; star.y = Math.random() * 2 - 1;
        }
        const x = cx + star.x / star.z * scale;
        const y = cy + star.y / star.z * scale;
        const size = Math.min(5.5, 0.8 / star.z);
        if (x < 0 || x > app.screen.width || y < 0 || y > app.screen.height) return;
        if (intensity.extras) {
          const length = Math.min(48, size * 7);
          const angle = Math.atan2(y - cy, x - cx);
          graphics.lineStyle(Math.max(1, size * 0.7), star.color, 0.7);
          graphics.moveTo(x, y);
          graphics.lineTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
        } else {
          graphics.beginFill(star.color, intensity.countScale < 0.5 ? 0.55 : 0.85);
          graphics.drawCircle(x, y, size); graphics.endFill();
        }
      });
      if (intensity.extras && Math.sin(elapsed * 1.7) > 0.93) {
        const shootingX = (elapsed * 170) % (app.screen.width + 250) - 100;
        graphics.lineStyle(3, 0xbff7ff, 0.8);
        graphics.moveTo(shootingX, 90); graphics.lineTo(shootingX - 130, 190);
      }
    });
  }, []);
  const hostRef = usePixiApp(createApp, props);
  return <div className="star-voyage-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
