# Data Model

## Activity Setup

```js
{
  id: crypto.randomUUID(),
  durationSeconds: 1500,
  title: "Group Problem Solving",
  directions: [
    {
      id: crypto.randomUUID(),
      text: "Brainstorm individually",
      durationSeconds: 300
    }
  ],
  mode: "active",
  theme: "dots",
  visualIntensity: "normal",
  chimeEnabled: true,
  createdAt: new Date().toISOString(),
  lastUsedAt: null,
  useCount: 0
}
```

## Timer State

```js
{
  status: "running",
  durationSeconds: 1500,
  startedAt: Date.now(),
  pausedAt: null,
  pausedAccumulatedMs: 0,
  finishedAt: null
}
```

## Display Snapshot

```js
{
  version: 23,
  updatedAt: Date.now(),
  source: "teacher",
  activitySetup,
  timerState,
  manualDirectionIndex
}
```
