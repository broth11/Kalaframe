import { createBoidsRenderer } from "./boidsRender.js";
import { createConfettiRenderer } from "./confettiRender.js";

const factories = {
  boidsSchool: createBoidsRenderer,
  confettiPhysics: createConfettiRenderer,
};

let renderer = null;
let frameId = 0;
let lastTime = performance.now();
let current = {
  progress: 0,
  remainingSeconds: 0,
  totalSeconds: 0,
  mode: "active",
  visualIntensity: "normal",
  reducedMotion: false,
};
let target = { ...current };

function schedule(callback) {
  if (typeof self.requestAnimationFrame === "function") {
    return self.requestAnimationFrame(callback);
  }
  return self.setTimeout(() => callback(performance.now()), 16);
}

function tick(now) {
  const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  current.progress += (target.progress - current.progress) * Math.min(1, deltaSeconds * 10);
  current.remainingSeconds += (
    target.remainingSeconds - current.remainingSeconds
  ) * Math.min(1, deltaSeconds * 10);
  current.totalSeconds = target.totalSeconds;
  current.mode = target.mode;
  current.visualIntensity = target.visualIntensity;
  current.reducedMotion = target.reducedMotion;
  renderer?.frame({ ...current, deltaSeconds, now });
  frameId = schedule(tick);
}

self.onmessage = (event) => {
  const message = event.data;
  if (message.type === "init") {
    renderer = factories[message.rendererId]?.();
    renderer?.init(message.canvas);
    lastTime = performance.now();
    frameId = schedule(tick);
  } else if (message.type === "props") {
    target = { ...target, ...message };
  } else if (message.type === "resize") {
    renderer?.resize(message.width, message.height, message.dpr);
  } else if (message.type === "destroy") {
    if (typeof self.cancelAnimationFrame === "function") self.cancelAnimationFrame(frameId);
    else self.clearTimeout(frameId);
    renderer?.destroy();
    renderer = null;
    self.close();
  }
};
