# Kalaframe

Kalaframe is a local-first classroom visual timer with a separate teacher control view and projector display view.

It is designed for teachers who want to project a beautiful, readable timer while continuing to use their computer for other classroom tasks.

## Features

- Teacher control view
- Separate projector display view
- Main countdown timer
- Pause/resume/reset/end
- Add/subtract one minute during timer
- Optional activity title
- Optional staged directions
- Optional direction sub-timers
- Automatic direction transitions
- Manual direction controls
- Three classroom modes: Calm, Active, Exam
- Five p5.js visual themes: Dots, Lava Lamp, Aurora, Geometric Waves, Void
- Visual Intensity: Low, Normal, High
- p5.js animated background
- Start confirmation modal
- Optional end chime
- Local browser preference memory
- Local IndexedDB activity history
- BroadcastChannel display sync
- localStorage snapshot fallback

## Routes

```text
/          Teacher control view
/display   Projector display view
```

## Getting Started

```bash
cd /Users/benjaminroth/Documents/kalaframe
npm install
npm run dev
```

Then open:

```text
http://localhost:5173/
```

The display route is:

```text
http://localhost:5173/display
```

You can also click **Open Projector Display** from the teacher view.

## Build

```bash
npm run build
```

## Project Structure

```text
src/
  activity/
  chime/
  components/
  display/
  messaging/
  modes/
  routes/
  storage/
  styles/
  timer/
  visualizer/
```

## Important Design Rules

- Timer math is timestamp-based.
- Timer text is HTML/CSS, not canvas.
- The visualizer is decorative only.
- Theme IDs are `dots`, `lavaLamp`, `aurora`, `geometricWaves`, and `void`.
- Stored legacy theme IDs `lava` and `ambientBlobs` migrate to `dots`.
- Modes are intent-based.
- History is local-only.
- No accounts or cloud sync.
