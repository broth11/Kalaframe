# CLAUDE.md — Kalaframe Project Instructions

## Project Definition

Kalaframe is a local-first classroom visual timer.

It lets a teacher control a timer from their laptop while projecting a separate student-facing display with:
- a beautiful animated visual background,
- a large readable countdown,
- optional activity title,
- optional staged directions,
- optional sub-timers,
- optional chime,
- local activity history.

The app is intentionally local-first and classroom-focused.

## What This App Is Not

Do not add:
- accounts,
- cloud sync,
- QR joining,
- cross-device display links,
- soundscapes/noise machine features,
- LMS features,
- student responses,
- attendance,
- gradebook tools,
- full lesson planning,
- multi-day agenda boards.

## Core Routes

- `/` — Teacher control view
- `/display` — Projector display view

## Non-Negotiable Rules

1. Timer math is timestamp-based.
2. Timer text is rendered in HTML/CSS, not canvas.
3. The visualizer is decorative only.
4. Visualizer components must not own timer logic.
5. Projector display shows no teacher controls.
6. Modes are registry-driven and intent-based.
7. Renderer-specific numbers belong in the visualizer, not the mode registry.
8. Activity and direction IDs use `crypto.randomUUID()`.
9. The display syncs with BroadcastChannel and falls back to localStorage snapshots.
10. Projector readability beats visual flair.

## MVP Features Implemented

This project includes:
- main countdown timer,
- pause/resume/reset/end,
- +1 / -1 minute adjustment,
- optional title,
- direction list with optional durations,
- automatic direction transitions when all directions have durations,
- manual previous/next direction controls when directions are untimed/mixed,
- start confirmation modal,
- chime toggle,
- three modes: Calm, Active, Exam,
- five p5.js visual themes: Dots, Lava Lamp, Aurora, Geometric Waves, Void,
- visual intensity: Low, Normal, High,
- localStorage preferences,
- IndexedDB activity history,
- projector display window,
- BroadcastChannel sync,
- localStorage snapshot fallback,
- p5.js visualizer registry with legacy `lava` and `ambientBlobs` IDs migrating to `dots`.

## Manual Testing Checklist

Before considering a change complete, check:
- Teacher can create a 25-minute staged activity.
- Directions auto-advance when all durations are set.
- Directions can be manually advanced when durations are blank.
- Projector display opens and has no controls.
- Projector display syncs with teacher view.
- Reload restores preferences.
- History item restores setup but does not auto-start.
- Timer remains readable over the visualizer.
- Exam mode has reduced motion.
- Chime plays only when enabled.
