# Verification

## 2026-07-09 — Three.js, DOM, and worker visualizers

### Automated checks

- `npm run lint` — passed.
- `npm run build` — passed.
- No test runner is configured in this repository, so no unit-test framework was added.
- Three.js is lazy-loaded. The main application chunk remains near its pre-Three size, while Three.js builds as a separate chunk.
- Vite still reports its chunk-size advisory. The lazy Three.js shared chunk is about 537 kB uncompressed; the pre-existing main bundle was already above the 500 kB threshold.

### Browser checklist

Checked in headless Chrome against the Vite development server:

- Orbit Isle, Prism Drift, Aurora Glass, Lantern Float, Confetti Physics, and Boids School all appeared in the Kalalight carousel and rendered without console exceptions.
- Low, normal, and high were exercised live on every new visualizer without remounting the host.
  - Aurora Glass rendered 2 / 4 / 7 blobs at low / normal / high.
  - Lantern Float rendered 10 / 24 / 44 lanterns at low / normal / high.
  - Three.js and worker intensity branches changed count, speed, saturation, and high-only effects without runtime errors.
- A one-minute timer remained running while all six visualizers and every intensity tier were selected. The HTML countdown continued from `1:00` without resetting.
- `/display` restored the selected Boids School theme, remained synchronized, and contained no buttons or inputs.
- Rapid back-and-forth theme switching left one expected canvas or DOM stage in the active host, produced no WebGL context warnings, and left no worker target after switching away.
- Both worker visualizers reported the OffscreenCanvas worker path in normal operation.
- With `window.__KALAFRAME_FORCE_OFFSCREEN_FALLBACK__ = true`, both worker visualizers reported and rendered through the main-thread fallback. The override was then reverted.
- In `/full`, Exam mode overrode a user-selected High intensity:
  - Aurora Glass rendered the low tier's 2 blobs.
  - Lantern Float rendered the low tier's 10 lanterns.
  - DOM animation duration was about `284.44s`, reflecting low speed and the required 75% reduced-motion slowdown.
  - Both Three.js and worker visualizers rendered without exceptions under Exam mode.

### Lifecycle checks

- Three.js cleanup disposes scene geometry, materials, textures, render lists, the renderer, and its WebGL context.
- DOM cleanup is mount-guarded so React Strict Mode's effect probe does not remove React-owned children.
- Worker cleanup posts `destroy`, terminates the worker, disconnects resize observation, and removes the canvas.
