# CODEX.md — Codex Implementation Guide

Follow `CLAUDE.md`, `AGENTS.md`, and the docs folder.

## Coding Priorities

1. Timer reliability
2. Projector readability
3. Teacher workflow speed
4. Local-first simplicity
5. Visual quality
6. Future expansion

## Style

- Use plain React and JavaScript.
- Keep utility functions pure.
- Avoid unnecessary dependencies.
- Avoid premature abstraction.
- Keep display sync simple and debuggable.
- Keep the visualizer decorative.

## Do Not Add

- Login
- Backend
- Cloud sync
- QR joining
- Audio soundscapes
- Student responses
- LMS features
- Complex routine builder

## Timer Rule

Never use a decrementing counter as source of truth. Use timestamps and derive remaining time.

## Mode Rule

Modes express intent only. Visualizers convert intent into renderer-specific values.

## Visualizer Rule

Visualizer themes are registered in `src/visualizer/visualizerRegistry.js`.
Current theme IDs are `dots`, `lavaLamp`, `aurora`, `geometricWaves`, and
`void`. Legacy stored IDs `lava` and `ambientBlobs` migrate to `dots`.

All current visualizers use p5.js and receive shared props including
`visualIntensity`. Do not put renderer-specific speed, count, blur, or contrast
values in the mode registry.
