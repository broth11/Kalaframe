import { resolveIntensity } from "../intensityContract.js";

const BASE_COUNT = 900;
const HUES = [10, 42, 160, 195, 270, 325];

export function createConfettiRenderer() {
  let canvas;
  let context;
  let width = 1;
  let height = 1;
  let particles = [];
  let streamers = [];

  function resetParticle(particle, randomY = false) {
    particle.x = Math.random() * width;
    particle.y = randomY ? Math.random() * height : -20 - Math.random() * height * 0.2;
    particle.vx = (Math.random() - 0.5) * 42;
    particle.vy = 25 + Math.random() * 95;
    particle.size = 3 + Math.random() * 7;
    particle.rotation = Math.random() * Math.PI;
    particle.spin = (Math.random() - 0.5) * 5;
    particle.phase = Math.random() * Math.PI * 2;
    particle.hue = HUES[Math.floor(Math.random() * HUES.length)];
  }

  function syncCount(count) {
    while (particles.length < count) {
      const particle = {};
      resetParticle(particle, true);
      particles.push(particle);
    }
    if (particles.length > count) particles.length = count;
  }

  function syncStreamers(enabled) {
    const count = enabled ? 12 : 0;
    while (streamers.length < count) {
      streamers.push({
        x: Math.random() * width,
        phase: Math.random() * Math.PI * 2,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
        points: [],
      });
    }
    if (streamers.length > count) streamers.length = count;
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
      const count = Math.round(BASE_COUNT * intensity.countScale);
      const speed = intensity.speedScale * (state.reducedMotion ? 0.25 : 1);
      const finale = state.progress > 0.9 ? 1 + (state.progress - 0.9) * 4 : 1;
      const dt = state.deltaSeconds * speed;
      syncCount(count);
      syncStreamers(intensity.extras);

      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#16132f");
      gradient.addColorStop(1, "#070918");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.vy += 24 * dt;
        particle.vx *= Math.pow(0.985, dt * 60);
        particle.x += (particle.vx + Math.sin(state.now * 0.003 + particle.phase) * 22) * dt;
        particle.y += particle.vy * dt * finale;
        particle.rotation += particle.spin * dt;
        if (particle.y > height + 20 || particle.x < -30 || particle.x > width + 30) {
          resetParticle(particle);
        }
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        const saturation = Math.min(100, 72 * intensity.saturation);
        context.fillStyle = `hsl(${particle.hue} ${saturation}% 62%)`;
        const flutter = Math.max(0.18, Math.abs(Math.cos(particle.rotation)));
        context.fillRect(-particle.size, -particle.size * flutter, particle.size * 2, particle.size * 2 * flutter);
        context.restore();
      });

      if (intensity.extras) {
        context.lineWidth = 3;
        streamers.forEach((streamer, index) => {
          const y = (state.now * 0.08 * speed + index * height / streamers.length) % (height + 100) - 50;
          const x = streamer.x + Math.sin(state.now * 0.0018 * speed + streamer.phase) * 55;
          streamer.points.push({ x, y });
          if (streamer.points.length > 18) streamer.points.shift();
          context.beginPath();
          streamer.points.forEach((point, pointIndex) => {
            if (pointIndex === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
          });
          context.strokeStyle = `hsla(${streamer.hue} 95% 68% / 0.7)`;
          context.stroke();
        });
      }
    },

    destroy() {
      particles = [];
      streamers = [];
      context = null;
      canvas = null;
    },
  };
}
