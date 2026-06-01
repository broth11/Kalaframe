import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "./usePixiApp.js";

const MODE_SETTINGS = {
  calm:   { cellSize: 7, density: 0.32, speed: 4, bg: 0x020306 },
  active: { cellSize: 5, density: 0.38, speed: 6, bg: 0x020408 },
  exam:   { cellSize: 8, density: 0.28, speed: 2, bg: 0x020305 },
};

const INTENSITY_SETTINGS = {
  low: { speed: 1.65, decay: 0.78 },
  normal: { speed: 1, decay: 1 },
  high: { speed: 0.62, decay: 1.25 },
};

function thermalColor(h) {
  if (h > 0.85) return 0xfff0a0;
  if (h > 0.60) return 0xff8800;
  if (h > 0.35) return 0xcc1100;
  if (h > 0.12) return 0x440066;
  return 0x110022;
}

export function ThermalLifeVisualizer(props) {
  const createApp = useCallback(({ app, getProps }) => {
    let CELL, COLS, ROWS, alive, heat, gen, fc;
    let lastMode = null;

    const gfx = new PIXI.Graphics();
    app.stage.addChild(gfx);

    function setup(mode) {
      const ms = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      CELL  = ms.cellSize;
      COLS  = Math.floor(app.screen.width  / CELL);
      ROWS  = Math.floor(app.screen.height / CELL);
      alive = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
      heat  = Array.from({ length: ROWS }, () => new Float32Array(COLS));
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (Math.random() < ms.density) { alive[r][c] = 1; heat[r][c] = 1; }
      gen = 0;
      fc  = 0;
      app.renderer.backgroundColor = ms.bg;
    }

    function step() {
      const next = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          let n = 0;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              n += alive[(r + dr + ROWS) % ROWS][(c + dc + COLS) % COLS];
            }
          next[r][c] = (alive[r][c] ? (n === 2 || n === 3) : n === 3) ? 1 : 0;
        }
      }
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          if (next[r][c]) heat[r][c] = 1;
          else heat[r][c] = Math.max(0, heat[r][c] - 0.042);
        }
      alive = next;
      gen++;
    }

    const { mode: m0 } = getProps();
    setup(m0);
    lastMode = m0;

    app.ticker.add(() => {
      const { mode, reducedMotion, visualIntensity } = getProps();
      const ms = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = INTENSITY_SETTINGS[visualIntensity] ?? INTENSITY_SETTINGS.normal;

      if (mode !== lastMode) { setup(mode); lastMode = mode; return; }

      // Reseed if grid dimensions changed (resize)
      if (Math.floor(app.screen.width / CELL) !== COLS ||
          Math.floor(app.screen.height / CELL) !== ROWS) {
        setup(mode);
        return;
      }

      fc++;
      const stepEvery = (reducedMotion ? ms.speed * 3 : ms.speed) * intensity.speed;
      if (fc % Math.max(1, Math.round(stepEvery)) === 0) step();
      if (gen > 500) { setup(mode); return; }

      gfx.clear();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const h = heat[r][c];
          if (h < 0.02) continue;
          gfx.beginFill(thermalColor(h), Math.min(1, h * 1.1 * intensity.decay));
          gfx.drawRect(c * CELL, r * CELL, CELL - 0.5, CELL - 0.5);
          gfx.endFill();
        }
      }
    });
  }, []);

  const hostRef = usePixiApp(createApp, props);
  return <div className="lava-visualizer" ref={hostRef} aria-hidden="true" />;
}
