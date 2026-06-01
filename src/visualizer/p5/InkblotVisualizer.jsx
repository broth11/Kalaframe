import { useCallback } from "react";
import { useP5Sketch } from "./useP5Sketch.js";

const MODE_SPEED = { calm: 0.22, active: 0.68, exam: 0.07 };
const MODE_FILTER = {
  calm:   "blur(6px) contrast(32)",
  active: "blur(6px) contrast(32)",
  exam:   "blur(5px) contrast(26)",
};

const MODE_TARGET = { calm: 6, active: 9, exam: 4 };
const MIN_LIVING  = 3;   // blobs below this count are never killed
const MAX_BLOBS   = 16;
const INTENSITY_SETTINGS = {
  low: { speed: 0.62, target: -2, wobble: 0.72 },
  normal: { speed: 1, target: 0, wobble: 1 },
  high: { speed: 1.35, target: 2, wobble: 1.28 },
};

const POINT_COUNT = 48;

export function InkblotVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => {
    return (p) => {
      let blobs     = [];
      let splatters = [];   // small satellite ink drops, drawn mirrored
      let currentMode = null;
      let currentFilterStr = "";
      let spawnIndex = 0;

      const MAX_SPLATTERS = 80;

      // Box-Muller Gaussian — p.randomGaussian does not exist in p5 v2 instance mode.
      function gaussianRandom(mean, sd) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      }

      // Spawn a mirrored splatter drop at canvas pixel position (cx, cy).
      // vx/vy is an optional inherited velocity (e.g. from a bouncing blob).
      function spawnSplatter(cx, cy, inheritVx, inheritVy) {
        if (splatters.length >= MAX_SPLATTERS) return;
        const count = Math.floor(p.random(1, 5));
        for (let i = 0; i < count && splatters.length < MAX_SPLATTERS; i++) {
          const angle = p.random(Math.PI * 2);
          const speed = p.random(0.6, 4.5);
          splatters.push({
            x:     cx + p.random(-18, 18),
            y:     cy + p.random(-18, 18),
            vx:    (inheritVx ?? 0) * 0.4 + Math.cos(angle) * speed,
            vy:    (inheritVy ?? 0) * 0.4 + Math.sin(angle) * speed,
            r:     p.random(3, 13),
            alpha: p.random(170, 255),
          });
        }
      }

      // blob.x is a LEFT-HALF normalized coord where 0=left edge, 0.5=center fold.
      // Spawning near x=0.50 produces a central mass; mirrored copy overlaps at canvas center.
      function spawnBlob(forceAnchor, startAlpha) {
        let x;
        if (forceAnchor) {
          x = 0.50 - Math.abs(gaussianRandom(0, 0.03));
          x = Math.max(x, 0.38);
        } else {
          // SD=0.16: secondaries spread freely across the left half, occasionally
          // reaching the canvas edge — this is the main source of lobe variation.
          x = 0.50 - Math.abs(gaussianRandom(0, 0.16));
          x = Math.max(x, 0.01);
        }
        // Blobs near the fold are larger; outer blobs are smaller satellite lobes.
        const distFromFold = Math.max(0, 0.50 - x);
        const maxR = p.map(distFromFold, 0, 0.49, 0.140, 0.075);
        const minR = p.map(distFromFold, 0, 0.49, 0.075, 0.035);
        const baseRadius   = p.random(minR, maxR);
        const targetRadius = baseRadius * p.random(0.55, 1.65);
        const idx = spawnIndex++;
        return {
          x,
          y: forceAnchor ? p.random(0.30, 0.70) : p.random(0.05, 0.95),
          vx: (p.random() - 0.5) * 0.004,
          vy: (p.random() - 0.5) * 0.003,
          baseRadius,
          radius: baseRadius,
          targetRadius,
          seed: (p.random(100) + idx * 13.7) % 1000,
          phase: idx * 1.1 + p.random(Math.PI * 2),
          framesSinceTarget: Math.floor(p.random(80)),
          state: "growing",
          alpha: startAlpha ?? 0,
        };
      }

      function resetBlobs(mode) {
        const target  = MODE_TARGET[mode] ?? MODE_TARGET.active;
        const anchors = Math.min(2, target);
        blobs = [
          ...Array.from({ length: anchors },         () => spawnBlob(true,  255)),
          ...Array.from({ length: target - anchors }, () => spawnBlob(false, 255)),
        ];
        splatters   = [];
        currentMode = mode;
      }

      p.setup = () => {
        const host = getHost();
        const cnv = p.createCanvas(host.clientWidth, host.clientHeight);
        cnv.parent(host);
        if (!isCurrent()) {
          p.remove();
          return;
        }
        host.querySelectorAll("canvas").forEach((el) => {
          if (el !== cnv.elt) el.remove();
        });
        const { mode } = getProps();
        currentFilterStr = MODE_FILTER[mode] ?? MODE_FILTER.active;
        cnv.elt.style.filter = currentFilterStr;
        p.noStroke();
        resetBlobs(mode);
        // diagnostic console.logs removed
      };

      p.windowResized = () => {
        const host = getHost();
        p.resizeCanvas(host.clientWidth, host.clientHeight);
      };

      function updateBlob(blob, t, intensity) {
        // Guard against NaN
        if (isNaN(blob.x) || isNaN(blob.y)) {
          blob.x  = 0.50 - Math.abs(gaussianRandom(0, 0.06));
          blob.x  = Math.max(blob.x, 0.06);
          blob.y  = p.random(0.10, 0.90);
          blob.vx = 0;
          blob.vy = 0;
        }

        // Noise wandering — free to roam the full canvas area.
        blob.vx += (p.noise(blob.seed * 0.3, blob.y * 1.8,  t * 0.35) - 0.5) * 0.00065 * intensity.wobble;
        blob.vy += (p.noise(blob.seed + 50,  blob.x * 2.1,  t * 0.40) - 0.5) * 0.00065 * intensity.wobble;

        // Soft spring toward canvas center (fold x=0.45, vertical y=0.50).
        // Weak enough that noise dominates near the centre — blobs wander freely.
        // Strong enough that no blob stays stuck at any edge indefinitely.
        // At the far edge the spring contributes ~0.00016/frame net inward drift;
        // noise averages to zero over time, so blobs always eventually return.
        blob.vx += (0.45 - blob.x) * 0.00038;
        blob.vy += (0.50 - blob.y) * 0.00038;

        blob.vx *= 0.94;
        blob.vy *= 0.94;

        blob.x += blob.vx;
        blob.y += blob.vy;

        // Elastic bounce — 88% restitution so blobs visibly rebound.
        // Each wall hit ejects a small cluster of splatter drops.
        const bxPx = blob.x * p.width;
        const byPx = blob.y * p.height;
        const velPx = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy) * p.width;
        if (blob.x > 0.50) {
          blob.x = 0.50; blob.vx = -Math.abs(blob.vx) * 0.88;
          spawnSplatter(bxPx, byPx, -velPx, 0);
        }
        if (blob.x < 0.01) {
          blob.x = 0.01; blob.vx = Math.abs(blob.vx) * 0.88;
          spawnSplatter(bxPx, byPx, velPx, 0);
        }
        if (blob.y < 0.01) {
          blob.y = 0.01; blob.vy = Math.abs(blob.vy) * 0.88;
          spawnSplatter(bxPx, byPx, 0, velPx);
        }
        if (blob.y > 0.99) {
          blob.y = 0.99; blob.vy = -Math.abs(blob.vy) * 0.88;
          spawnSplatter(bxPx, byPx, 0, -velPx);
        }

        // Ambient drip: occasional satellite dot from any healthy blob
        if (blob.state !== "shrinking" && p.random() < 0.004) {
          spawnSplatter(bxPx, byPx, blob.vx * p.width, blob.vy * p.height);
        }

        if (blob.state === "shrinking") {
          // Gradual contraction — radius and alpha diminish together so the blob
          // dissolves naturally through the blur+contrast filter rather than popping.
          blob.radius *= 0.988;
          blob.alpha   = Math.max(0, blob.alpha * 0.985);
        } else {
          // Fade in on first spawn
          if (blob.state === "growing") {
            blob.alpha = Math.min(255, (blob.alpha ?? 0) + 5);
            if (blob.alpha >= 255) blob.state = "stable";
          }
          // Radius drift every ~80 frames (only while healthy)
          blob.framesSinceTarget += 1;
          if (blob.framesSinceTarget >= 80) {
            blob.targetRadius = blob.baseRadius * p.random(0.55, 1.65);
            blob.framesSinceTarget = 0;
          }
          blob.radius += (blob.targetRadius - blob.radius) * 0.055;
        }
      }

      function buildMainBlobPoints(blob, t, intensity) {
        const bx = blob.x * p.width;
        const by = blob.y * p.height;
        const br = blob.radius * Math.min(p.width, p.height);
        const pts = [];
        for (let i = 0; i < POINT_COUNT; i++) {
          const angle = (Math.PI * 2 * i) / POINT_COUNT;
          const ca = Math.cos(angle);
          const sa = Math.sin(angle);
          const lowFreq = p.noise(
            blob.seed + ca * 1.1,
            blob.seed + sa * 1.1,
            t + blob.phase,
          );
          const highFreq = p.noise(
            blob.seed * 3.7 + ca * 5.8,
            blob.seed * 3.7 + sa * 5.8,
            t * 1.8 + blob.phase,
          );
          const wobble = p.map(lowFreq, 0, 1, 0.38, 1.62)
                       * p.map(highFreq, 0, 1, 0.78, 1.22)
                       * intensity.wobble;
          pts.push({ x: bx + ca * br * wobble, y: by + sa * br * wobble });
        }
        return pts;
      }

      function drawPts(pts) {
        p.beginShape();
        for (const pt of pts) p.vertex(pt.x, pt.y);
        p.endShape(p.CLOSE);
      }

      function drawPtsMirrored(pts) {
        p.beginShape();
        for (const pt of pts) p.vertex(p.width - pt.x, pt.y);
        p.endShape(p.CLOSE);
      }

      p.draw = () => {
        const { mode, visualIntensity } = getProps();
        const intensity = INTENSITY_SETTINGS[visualIntensity] ?? INTENSITY_SETTINGS.normal;

        // Sweep for NaN blobs
        for (const blob of blobs) {
          if (!isFinite(blob.x) || !isFinite(blob.y)) {
            blob.x  = 0.50 - Math.abs(gaussianRandom(0, 0.06));
            blob.x  = Math.max(blob.x, 0.06);
            blob.y  = p.random(0.10, 0.90);
            blob.vx = 0;
            blob.vy = 0;
            console.warn('NaN blob reset at frame', p.frameCount);
          }
        }

        if (mode !== currentMode) resetBlobs(mode);

        const target = Math.max(MIN_LIVING, (MODE_TARGET[mode] ?? MODE_TARGET.active) + intensity.target);

        // Count only blobs that are not already dying
        const livingCount = blobs.filter(b => b.state !== "shrinking").length;

        // Emergency spawn — never let living count drop below MIN_LIVING
        if (livingCount < MIN_LIVING && blobs.length < MAX_BLOBS) {
          blobs.push(spawnBlob(livingCount === 0, 255));
        }

        // Normal spawn when below target
        if (blobs.length < MAX_BLOBS && livingCount < target && p.random() < 0.018) {
          blobs.push(spawnBlob(false, 0));
        }

        // Death: only trigger when above MIN_LIVING; probability rises when over target
        for (const blob of blobs) {
          if (blob.state === "shrinking") continue;
          if (livingCount <= MIN_LIVING) continue;
          const deathProb = livingCount > target ? 0.0015 : 0.0003;
          if (p.random() < deathProb) blob.state = "shrinking";
        }
        // Remove only once genuinely tiny — no visible pop
        blobs = blobs.filter(b => b.radius > 0.004 && (b.alpha ?? 255) > 2);

        const speedMultiplier = (MODE_SPEED[mode] ?? MODE_SPEED.active) * intensity.speed;
        const t = p.millis() * 0.00065 * speedMultiplier;

        const targetFilter = MODE_FILTER[mode] ?? MODE_FILTER.active;
        if (targetFilter !== currentFilterStr) {
          currentFilterStr = targetFilter;
          p.drawingContext.canvas.style.filter = currentFilterStr;
        }

        p.background(255);

        for (const blob of blobs) updateBlob(blob, t, intensity);

        // Mild repulsion in pixel space — prevents extreme stacking without
        // destroying the merged central mass.
        const minDim = Math.min(p.width, p.height);
        for (let i = 0; i < blobs.length; i++) {
          for (let j = i + 1; j < blobs.length; j++) {
            const a = blobs[i], b = blobs[j];
            const dx = (a.x - b.x) * p.width;
            const dy = (a.y - b.y) * p.height;
            const d  = Math.sqrt(dx * dx + dy * dy);
            const desired = (a.radius + b.radius) * minDim * 0.70;
            if (d < desired && d > 0.5) {
              const push = (desired - d) * 0.028 / minDim;
              const nx = dx / d, ny = dy / d;
              a.x += nx * push;           b.x -= nx * push;
              a.y += ny * push * (p.width / p.height);
              b.y -= ny * push * (p.width / p.height);
            }
          }
        }

        for (const blob of blobs) {
          p.fill(30, 30, 30, blob.alpha ?? 255);
          const pts = buildMainBlobPoints(blob, t, intensity);
          drawPts(pts);
          drawPtsMirrored(pts);
        }

        // Splatter drops — drawn after blobs so they sit on top.
        // Each drop is mirrored across the vertical centre to preserve symmetry.
        splatters = splatters.filter((s) => {
          s.x    += s.vx;
          s.y    += s.vy;
          s.vy   += 0.055;   // light gravity
          s.vx   *= 0.97;
          s.vy   *= 0.97;
          s.alpha -= 1.0;
          if (s.alpha <= 0) return false;
          p.fill(30, 30, 30, s.alpha);
          p.ellipse(s.x,             s.y, s.r * 2);
          p.ellipse(p.width - s.x,   s.y, s.r * 2);  // mirror
          return true;
        });
      };
    };
  }, []);

  const hostRef = useP5Sketch(createSketch, props);
  return <div className="inkblot-visualizer" ref={hostRef} aria-hidden="true" />;
}
