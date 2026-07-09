import { resolveIntensity } from "../intensityContract.js";

const BASE_COUNT = 180;
const COLORS = [188, 205, 226];

export function createBoidsRenderer() {
  let canvas;
  let context;
  let width = 1;
  let height = 1;
  let boids = [];

  function createBoid() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * 32,
      vy: Math.sin(angle) * 32,
      group: Math.floor(Math.random() * COLORS.length),
    };
  }

  function syncCount(count) {
    while (boids.length < count) boids.push(createBoid());
    if (boids.length > count) boids.length = count;
  }

  return {
    init(targetCanvas) {
      canvas = targetCanvas;
      context = canvas.getContext("2d", { alpha: false });
    },

    resize(nextWidth, nextHeight, dpr) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    frame(state) {
      const intensity = resolveIntensity(state.mode, state.visualIntensity);
      const speed = intensity.speedScale * (state.reducedMotion ? 0.25 : 1);
      const dt = state.deltaSeconds * speed;
      syncCount(Math.max(28, Math.round(BASE_COUNT * intensity.countScale)));

      const background = context.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, intensity.countScale < 0.5 ? "#15313a" : "#0c3b4e");
      background.addColorStop(1, "#020d1b");
      context.globalAlpha = intensity.countScale < 0.5 ? 1 : 0.2;
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;

      const wanderX = width * (0.5 + Math.sin(state.now * 0.00017) * 0.24);
      const wanderY = height * (0.48 + Math.cos(state.now * 0.00013) * 0.2);
      const cohesionStrength = 4 + state.progress * 13;
      const cellSize = 90;
      const grid = new Map();
      boids.forEach((boid) => {
        const key = `${Math.floor(boid.x / cellSize)},${Math.floor(boid.y / cellSize)}`;
        const cell = grid.get(key) ?? [];
        cell.push(boid);
        grid.set(key, cell);
      });

      boids.forEach((boid) => {
        let centerX = 0; let centerY = 0; let alignX = 0; let alignY = 0; let nearby = 0;
        const cellX = Math.floor(boid.x / cellSize);
        const cellY = Math.floor(boid.y / cellSize);
        for (let gx = -1; gx <= 1; gx += 1) {
          for (let gy = -1; gy <= 1; gy += 1) {
            (grid.get(`${cellX + gx},${cellY + gy}`) ?? []).forEach((other) => {
              if (other === boid || other.group !== boid.group) return;
              const dx = other.x - boid.x; const dy = other.y - boid.y;
              const distanceSq = dx * dx + dy * dy;
              if (distanceSq > 6400) return;
              nearby += 1; centerX += other.x; centerY += other.y;
              alignX += other.vx; alignY += other.vy;
              if (distanceSq < 420) {
                boid.vx -= dx * dt * 2.2;
                boid.vy -= dy * dt * 2.2;
              }
            });
          }
        }
        if (nearby) {
          boid.vx += ((centerX / nearby - boid.x) * cohesionStrength + alignX / nearby - boid.vx) * dt * 0.08;
          boid.vy += ((centerY / nearby - boid.y) * cohesionStrength + alignY / nearby - boid.vy) * dt * 0.08;
        }
        boid.vx += (wanderX - boid.x) * dt * 0.025;
        boid.vy += (wanderY - boid.y) * dt * 0.025;

        if (intensity.extras) {
          const predatorPhase = (state.now / 1000) % 20;
          const predatorX = predatorPhase < 3 ? (predatorPhase / 3) * (width + 240) - 120 : -500;
          const predatorY = height * (0.3 + Math.sin(state.now * 0.001) * 0.18);
          const dx = boid.x - predatorX; const dy = boid.y - predatorY;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < 18000) {
            const force = 2300 / Math.max(50, Math.sqrt(distanceSq));
            boid.vx += dx * force * dt;
            boid.vy += dy * force * dt;
          }
        }

        const magnitude = Math.hypot(boid.vx, boid.vy) || 1;
        const targetSpeed = 48 + intensity.speedScale * 20;
        boid.vx = boid.vx / magnitude * targetSpeed;
        boid.vy = boid.vy / magnitude * targetSpeed;
        boid.x = (boid.x + boid.vx * dt + width) % width;
        boid.y = (boid.y + boid.vy * dt + height) % height;

        const angle = Math.atan2(boid.vy, boid.vx);
        context.save();
        context.translate(boid.x, boid.y);
        context.rotate(angle);
        const saturation = Math.min(100, 62 * intensity.saturation);
        context.fillStyle = `hsl(${COLORS[boid.group]} ${saturation}% 68%)`;
        context.beginPath();
        context.moveTo(8, 0);
        context.lineTo(-6, -4);
        context.lineTo(-3, 0);
        context.lineTo(-6, 4);
        context.closePath();
        context.fill();
        context.restore();
      });

      if (intensity.extras) {
        const predatorPhase = (state.now / 1000) % 20;
        if (predatorPhase < 3) {
          const x = (predatorPhase / 3) * (width + 240) - 120;
          const y = height * (0.3 + Math.sin(state.now * 0.001) * 0.18);
          context.fillStyle = "rgba(1, 10, 20, 0.72)";
          context.beginPath();
          context.moveTo(x + 34, y);
          context.lineTo(x - 24, y - 15);
          context.lineTo(x - 12, y);
          context.lineTo(x - 24, y + 15);
          context.closePath();
          context.fill();
        }
      }
    },

    destroy() {
      boids = [];
      context = null;
      canvas = null;
    },
  };
}
