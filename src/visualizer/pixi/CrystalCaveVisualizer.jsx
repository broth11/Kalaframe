import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { resolveIntensity } from "../intensityContract.js";
import { usePixiApp } from "./usePixiApp.js";

const MODE_SETTINGS = {
  calm: { crystals: 18, dust: 35, speed: 0.65 },
  active: { crystals: 26, dust: 55, speed: 1 },
  exam: { crystals: 14, dust: 24, speed: 0.5 },
};
const INTENSITY_SETTINGS = { low: "contract", normal: "contract", high: "contract" };
const COLORS = [0x63dcff, 0xa77cff, 0x57f0c3, 0xff79c8];

export function CrystalCaveVisualizer(props) {
  const createApp = useCallback(({ app, getProps }) => {
    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);
    let crystals = []; let dust = []; let lastKey = ""; let elapsed = 0;
    function rebuild(crystalCount, dustCount) {
      crystals = Array.from({ length: crystalCount }, (_, index) => ({
        edge: index % 2, position: Math.random(), height: 0.12 + Math.random() * 0.34,
        width: 10 + Math.random() * 24, color: COLORS[index % COLORS.length], phase: Math.random() * 8,
      }));
      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random(), y: Math.random(), phase: Math.random() * 10,
      }));
    }
    app.ticker.add((delta) => {
      const { mode, progress = 0, reducedMotion, visualIntensity } = getProps();
      const base = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = resolveIntensity(mode, visualIntensity);
      const crystalCount = Math.max(6, Math.round(base.crystals * intensity.countScale));
      const dustCount = intensity.countScale < 0.5 ? 0 : Math.round(base.dust * intensity.countScale);
      const key = `${crystalCount}:${dustCount}`;
      if (key !== lastKey) { rebuild(crystalCount, dustCount); lastKey = key; }
      const speed = base.speed * intensity.speedScale * (reducedMotion ? 0.25 : 1);
      elapsed += delta * 0.016 * speed;
      const W = app.screen.width; const H = app.screen.height;
      graphics.clear();
      graphics.beginFill(0x05091b); graphics.drawRect(0, 0, W, H); graphics.endFill();
      graphics.beginFill(0x101239); graphics.drawEllipse(W / 2, H / 2, W * 0.52, H * 0.45); graphics.endFill();
      crystals.forEach((crystal, index) => {
        const grow = Math.min(1, progress * 1.15 + 0.18 + (index % 7) * 0.045);
        const height = H * crystal.height * grow;
        const x = crystal.position * W;
        const fromTop = crystal.edge === 1;
        const baseY = fromTop ? 0 : H;
        const tipY = fromTop ? height : H - height;
        const shimmer = 0.52 + Math.sin(elapsed * 3.2 + crystal.phase) * 0.25;
        graphics.beginFill(crystal.color, intensity.countScale < 0.5 ? 0.38 : shimmer);
        graphics.drawPolygon([
          x - crystal.width, baseY,
          x + crystal.width, baseY,
          x + crystal.width * 0.32, tipY,
          x, tipY + (fromTop ? height * 0.08 : -height * 0.08),
          x - crystal.width * 0.28, tipY,
        ]);
        graphics.endFill();
        graphics.lineStyle(1.4, 0xe2fbff, intensity.extras ? 0.52 : 0.2);
        graphics.moveTo(x, baseY); graphics.lineTo(x, tipY);
        if (intensity.extras && shimmer > 0.68) {
          graphics.lineStyle(2, 0xffffff, shimmer * 0.7);
          graphics.moveTo(x - 14, tipY); graphics.lineTo(x + 14, tipY);
          graphics.moveTo(x, tipY - 14); graphics.lineTo(x, tipY + 14);
        }
      });
      graphics.beginFill(intensity.extras ? 0xc8fbff : 0x98b8cf, intensity.extras ? 0.7 : 0.3);
      dust.forEach((mote) => {
        const x = (mote.x + Math.sin(elapsed + mote.phase) * 0.025) * W;
        const y = ((mote.y - elapsed * 0.015) % 1 + 1) % 1 * H;
        graphics.drawCircle(x, y, intensity.extras ? 2.2 : 1.2);
      });
      graphics.endFill();
    });
  }, []);
  const hostRef = usePixiApp(createApp, props);
  return <div className="crystal-cave-visualizer" ref={hostRef} aria-hidden="true" />;
}

void INTENSITY_SETTINGS;
