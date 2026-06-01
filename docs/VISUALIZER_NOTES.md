# Visualizer Notes

Kalaframe visualizers are registered in `src/visualizer/visualizerRegistry.js`.

Current theme IDs and labels:
- `dots` — Dots
- `lavaLamp` — Lava Lamp
- `aurora` — Aurora
- `geometricWaves` — Geometric Waves
- `void` — Void

Stored legacy IDs migrate before rendering:
- `lava` -> `dots`
- `ambientBlobs` -> `dots`

All current visualizers use p5.js through `src/visualizer/p5/useP5Sketch.js`.
Visualizers receive the same props, including `modeIntent`, timer progress, and
`visualIntensity`. Each visualizer maps Calm, Active, Exam, and Low/Normal/High
intensity to renderer-specific speed, count, opacity, and motion values
internally.

Modes must not contain p5-specific values. Visualizers are decorative only and
must not render timer text, calculate timer state, trigger chimes, save history,
or control sync.
