# AGENTS.md — Shared Agent Rules

## Product

Kalaframe is a local-first classroom visual timer with a separate projector display.

## Current MVP

The MVP includes:
- teacher control view,
- projector display view,
- timestamp-based timer,
- optional title,
- staged directions,
- sub-timers,
- local history,
- p5 visualizer registry,
- visual themes: Dots, Lava Lamp, Aurora, Geometric Waves, Void,
- visual intensity: Low, Normal, High,
- local same-browser sync.

## Safety Rails

Do not expand scope into:
- classroom management,
- cloud sync,
- accounts,
- QR joining,
- soundscapes,
- student apps.

## Readability Rules

- Main timer should use `clamp(120px, 14vw, 220px)`.
- Direction text should use at least `40px` on 1080p displays.
- Timer overlay must have a backing panel.
- No strobe effects.
- Exam mode must reduce motion.

## Testing

Run:
```bash
npm install
npm run build
```

Then manually test:
```bash
npm run dev
```

Open:
- `http://localhost:5173/`
- `http://localhost:5173/display`
