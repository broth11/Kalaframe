# Architecture

## Views

- `TeacherView` at `/`
- `ProjectorView` at `/display`

## Data Model

The activity setup object powers:
- teacher form,
- confirmation modal,
- active timer,
- display sync,
- projector display,
- history save,
- history restore.

## Sync

Teacher view sends display snapshots through:
1. BroadcastChannel
2. localStorage snapshot fallback

The projector display listens to both and calculates timer remaining locally.

## Timer

Timer state is timestamp-based:
- startedAt
- pausedAt
- pausedAccumulatedMs
- durationSeconds

Remaining time is derived, not decremented.

## Visualizer

Visualizer is below the overlay and decorative only.

Timer overlay is HTML/CSS above the visualizer.

`VisualizerHost` resolves `activitySetup.theme` through
`src/visualizer/visualizerRegistry.js` and falls back to `dots`.

Theme IDs:
- `dots`
- `lavaLamp`
- `aurora`
- `geometricWaves`
- `void`

Legacy stored theme IDs `lava` and `ambientBlobs` migrate to `dots`.

`visualIntensity` is stored on the activity setup as `low`, `normal`, or `high`
and is passed to every visualizer. Exam mode is interpreted as low intensity
inside the visualizer layer.
