import { useCallback } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "./usePixiApp.js";

const MODE_SETTINGS = {
  calm:   { nodeCount: 38, speed: 0.55, connectDist: 130, lineAlpha: 0.35, nodeBright: 0.55, bg: 0x020510 },
  active: { nodeCount: 55, speed: 1.10, connectDist: 150, lineAlpha: 0.55, nodeBright: 0.80, bg: 0x050210 },
  exam:   { nodeCount: 22, speed: 0.20, connectDist: 110, lineAlpha: 0.18, nodeBright: 0.35, bg: 0x020408 },
};

const PALETTES = {
  calm:   [[56,189,248],[129,140,248],[45,212,191],[34,211,238]],
  active: [[244,114,182],[168,85,247],[56,189,248],[251,146,60],[80,220,160]],
  exam:   [[51,65,85],[71,85,105],[30,41,59]],
};

const INTENSITY_SETTINGS = {
  low: { speed: 0.72, count: 0.72, connect: 0.82, alpha: 0.68, bright: 0.72 },
  normal: { speed: 1, count: 1, connect: 1, alpha: 1, bright: 1 },
  high: { speed: 1.38, count: 1.18, connect: 1.12, alpha: 1.25, bright: 1.18 },
};

function hslToInt(h, s, l) {
  h = ((h % 1) + 1) % 1;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

export function NodeVisualizer(props) {
  const createApp = useCallback(({ app, getProps }) => {
    const gfx  = new PIXI.Graphics();
    const dotC = new PIXI.ParticleContainer(80, {
      tint: true, alpha: true, position: true, scale: true,
    });
    app.stage.addChild(gfx);
    app.stage.addChild(dotC);

    // Circle texture for nodes
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawCircle(0, 0, 5);
    g.endFill();
    const tex = app.renderer.generateTexture(g);
    g.destroy();

    let nodes = [];
    let sprites = [];
    let lastMode = null;

    function buildNodes(count, palette) {
      sprites.forEach(s => dotC.removeChild(s));
      sprites = [];
      nodes = Array.from({ length: count }, (_, i) => {
        const col = palette[i % palette.length];
        const sp  = new PIXI.Sprite(tex);
        sp.anchor.set(0.5);
        sp.x     = Math.random() * app.screen.width;
        sp.y     = Math.random() * app.screen.height;
        sp.tint  = (col[0] << 16) | (col[1] << 8) | col[2];
        sp.alpha = 0.9;
        sp.scale.set(0.7 + Math.random() * 0.8);
        dotC.addChild(sp);
        sprites.push(sp);
        return {
          x: sp.x, y: sp.y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          hue: i / count,
          sp,
        };
      });
    }

    let elapsed = 0;

    app.ticker.add(delta => {
      const { mode, reducedMotion, visualIntensity } = getProps();
      const ms      = MODE_SETTINGS[mode] ?? MODE_SETTINGS.active;
      const intensity = INTENSITY_SETTINGS[visualIntensity] ?? INTENSITY_SETTINGS.normal;
      const palette = PALETTES[mode] ?? PALETTES.active;
      const targetCount = Math.max(8, Math.round(ms.nodeCount * intensity.count));

      if (`${mode}:${visualIntensity}` !== lastMode) {
        app.renderer.backgroundColor = ms.bg;
        buildNodes(targetCount, palette);
        lastMode = `${mode}:${visualIntensity}`;
      }

      const W   = app.screen.width;
      const H   = app.screen.height;
      const spd = (reducedMotion ? ms.speed * 0.2 : ms.speed) * intensity.speed;
      elapsed  += delta * 0.016; // approximate seconds
      const t   = elapsed;

      nodes.forEach(n => {
        n.vx += Math.sin(t * 0.8  + n.y * 0.012) * 0.04 * spd;
        n.vy += Math.cos(t * 0.6  + n.x * 0.012) * 0.04 * spd;
        n.vx *= 0.96;
        n.vy *= 0.96;
        n.x  += n.vx * spd;
        n.y  += n.vy * spd;
        if (n.x < 0)  n.vx =  Math.abs(n.vx);
        if (n.x > W)  n.vx = -Math.abs(n.vx);
        if (n.y < 0)  n.vy =  Math.abs(n.vy);
        if (n.y > H)  n.vy = -Math.abs(n.vy);
        n.sp.x     = n.x;
        n.sp.y     = n.y;
        n.sp.alpha = Math.min(1, ms.nodeBright * intensity.bright * (0.7 + 0.3 * Math.sin(t * 1.5 + n.hue * 10)));
      });

      gfx.clear();
      const DIST = ms.connectDist * intensity.connect;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            const a   = (1 - d / DIST) * ms.lineAlpha * intensity.alpha;
            const col = hslToInt((nodes[i].hue + nodes[j].hue) / 2 + t * 0.04, 0.9, 0.6);
            gfx.lineStyle(0.8 + (1 - d / DIST) * 1.4, col, a);
            gfx.moveTo(nodes[i].x, nodes[i].y);
            gfx.lineTo(nodes[j].x, nodes[j].y);
          }
        }
      }
    });

    const { mode: m0, visualIntensity: i0 } = getProps();
    const ms0 = MODE_SETTINGS[m0] ?? MODE_SETTINGS.active;
    const intensity0 = INTENSITY_SETTINGS[i0] ?? INTENSITY_SETTINGS.normal;
    app.renderer.backgroundColor = ms0.bg;
    buildNodes(Math.max(8, Math.round(ms0.nodeCount * intensity0.count)), PALETTES[m0] ?? PALETTES.active);
    lastMode = `${m0}:${i0}`;
  }, []);

  const hostRef = usePixiApp(createApp, props);
  return <div className="lava-visualizer" ref={hostRef} aria-hidden="true" />;
}
