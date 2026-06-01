import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "./usePixiApp.js";

const CURVES = [
  { fx: 1, fy: 2, dx: Math.PI / 2, label: "1:2" },
  { fx: 1, fy: 3, dx: Math.PI / 2, label: "1:3" },
  { fx: 2, fy: 3, dx: Math.PI / 4, label: "2:3" },
  { fx: 3, fy: 4, dx: Math.PI / 2, label: "3:4" },
  { fx: 3, fy: 5, dx: Math.PI / 3, label: "3:5" },
  { fx: 4, fy: 5, dx: Math.PI / 4, label: "4:5" },
  { fx: 5, fy: 6, dx: Math.PI / 2, label: "5:6" },
  { fx: 2, fy: 5, dx: Math.PI / 3, label: "2:5" },
  { fx: 3, fy: 7, dx: Math.PI / 4, label: "3:7" },
  { fx: 4, fy: 7, dx: Math.PI / 6, label: "4:7" },
  { fx: 5, fy: 8, dx: Math.PI / 3, label: "5:8" },
  { fx: 1, fy: 4, dx: Math.PI / 2, label: "1:4" },
];

const MODE_SETTINGS = {
  calm:   { speed: 0.014, fadeFrames: 130, pauseFrames: 25, palette: "ice"    },
  active: { speed: 0.022, fadeFrames: 100, pauseFrames: 15, palette: "neon"   },
  exam:   { speed: 0.008, fadeFrames: 160, pauseFrames: 40, palette: "silver" },
};

function hslToRGB(h, s, l) {
  h = ((h % 1) + 1) % 1;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const PALETTES = {
  neon:   (pct, hs) => hslToRGB(hs + pct * 0.28,   1.0,  0.35 + pct * 0.40),
  ice:    (pct) => hslToRGB(0.55 + pct * 0.12, 0.85, 0.30 + pct * 0.40),
  silver: (pct) => hslToRGB(0.60, 0.15, 0.20 + pct * 0.45),
};

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function thetaMax(fx, fy) {
  const l = (fx * fy) / gcd(fx, fy);
  return Math.PI * 2 * l / Math.min(fx, fy);
}

const STATE_DRAWING = "drawing";
const STATE_FADING  = "fading";
const STATE_PAUSE   = "pause";

function shouldShowEquationLabel(props) {
  const { showEquation, previewContext, isPreview } = props;

  if (showEquation === false) return false;
  if (showEquation === true) return true;
  if (previewContext === "carousel") return false;
  if (isPreview) return false;

  return true;
}

export function LissajousVisualizer(props) {
  const createApp = useCallback(({ app, getProps }) => {
    const gfx = new PIXI.Graphics();
    app.stage.addChild(gfx);

    const statusText = new PIXI.Text("", {
      fontFamily: "monospace",
      fontSize:   22,
      fill:       0xd9f7ff,
    });
    statusText.anchor.set(0.5, 0);
    statusText.alpha = 0;
    statusText.style.dropShadow = true;
    statusText.style.dropShadowColor = 0x000000;
    statusText.style.dropShadowBlur = 8;
    statusText.style.dropShadowAlpha = 0.75;
    app.stage.addChild(statusText);

    function positionStatusText() {
      statusText.x = app.screen.width / 2;
      statusText.y = app.screen.height - 44;
    }

    function updateStatusText(curve, alpha = 0.86) {
      const showLabel = shouldShowEquationLabel(getProps());

      statusText.visible = showLabel;
      if (!showLabel) {
        statusText.alpha = 0;
        return;
      }

      statusText.text = `(sin(${curve.fx}t + φ), sin(${curve.fy}t))   Ratio = ${curve.label}`;
      statusText.alpha = alpha;
      positionStatusText();
    }

    positionStatusText();

    app.renderer.on("resize", () => {
      positionStatusText();
    });

    let state      = STATE_DRAWING;
    let curveIdx   = 0;
    let theta      = 0;
    let tMax       = 0;
    let pts        = [];
    let hueShift   = 0;
    let fadeFrame  = 0;
    let pauseFrame = 0;

    function startCurve() {
      const c = CURVES[curveIdx];
      tMax  = thetaMax(c.fx, c.fy);
      theta = 0;
      pts   = [];
      state = STATE_DRAWING;
    }
    startCurve();

    function curveXY(th, curve) {
      const W = app.screen.width;
      const H = app.screen.height;
      const R = Math.min(W, H) * 0.42;
      return {
        x: W / 2 + R * Math.sin(curve.fx * th + curve.dx),
        y: H / 2 + R * Math.sin(curve.fy * th),
      };
    }

    function drawCurve(alpha, ms) {
      const palKey = ms.palette ?? "neon";
      const palFn  = PALETTES[palKey] ?? PALETTES.neon;
      gfx.clear();
      const len = pts.length;
      if (len < 2) return;
      for (let i = 1; i < len; i++) {
        const pct       = i / len;
        const [r, g, b] = palFn(pct, hueShift);
        const col       = (r << 16) | (g << 8) | b;
        const a         = (0.12 + pct * 0.88) * alpha;
        const lw        = 0.5 + pct * 2.4;
        gfx.lineStyle(lw, col, a);
        gfx.moveTo(pts[i - 1].x, pts[i - 1].y);
        gfx.lineTo(pts[i].x,     pts[i].y);
      }
      // Glowing dot at leading edge during drawing phase
      if (state === STATE_DRAWING && len > 0) {
        const last        = pts[len - 1];
        const [r, g, b]   = palFn(1, hueShift);
        const col         = (r << 16) | (g << 8) | b;
        gfx.lineStyle(0);
        gfx.beginFill(col,      0.9 * alpha); gfx.drawCircle(last.x, last.y, 5); gfx.endFill();
        gfx.beginFill(0xffffff, 0.6 * alpha); gfx.drawCircle(last.x, last.y, 2); gfx.endFill();
      }
    }

    app.ticker.add(() => {
      const { mode, reducedMotion } = getProps();
      const ms    = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const spd   = reducedMotion ? ms.speed * 0.25 : ms.speed;
      const curve = CURVES[curveIdx];

      if (state === STATE_DRAWING) {
        theta += spd;
        pts.push(curveXY(theta, curve));
        drawCurve(1, ms);
        updateStatusText(curve, 0.86);
        if (theta >= tMax) { state = STATE_FADING; fadeFrame = 0; }

      } else if (state === STATE_FADING) {
        fadeFrame++;
        const tFade       = fadeFrame / ms.fadeFrames;
        const alpha       = Math.max(0, 1 - tFade * tFade * tFade);
        drawCurve(alpha, ms);
        updateStatusText(curve, alpha * 0.86);
        if (fadeFrame >= ms.fadeFrames) {
          gfx.clear();
          statusText.alpha = 0;
          statusText.visible = false;
          state = STATE_PAUSE;
          pauseFrame = 0;
        }

      } else if (state === STATE_PAUSE) {
        pauseFrame++;
        if (pauseFrame >= ms.pauseFrames) {
          curveIdx  = (curveIdx + 1) % CURVES.length;
          hueShift  = (hueShift + 0.14) % 1;
          startCurve();
        }
      }
    });
  }, []);

  const hostRef = usePixiApp(createApp, props);
  return <div className="lissajous-visualizer" ref={hostRef} aria-hidden="true" />;
}
