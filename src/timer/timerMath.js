export function createIdleTimerState(durationSeconds) {
  return {
    status: "idle",
    durationSeconds,
    startedAt: null,
    pausedAt: null,
    pausedAccumulatedMs: 0,
    finishedAt: null,
  };
}

export function startTimer(durationSeconds, now = Date.now()) {
  return {
    status: "running",
    durationSeconds,
    startedAt: now,
    pausedAt: null,
    pausedAccumulatedMs: 0,
    finishedAt: null,
  };
}

export function pauseTimer(timerState, now = Date.now()) {
  if (timerState.status !== "running") return timerState;
  return {
    ...timerState,
    status: "paused",
    pausedAt: now,
  };
}

export function resumeTimer(timerState, now = Date.now()) {
  if (timerState.status !== "paused" || timerState.pausedAt == null) {
    return timerState;
  }

  return {
    ...timerState,
    status: "running",
    pausedAccumulatedMs:
      (timerState.pausedAccumulatedMs ?? 0) + (now - timerState.pausedAt),
    pausedAt: null,
  };
}

export function resetTimer(durationSeconds) {
  return createIdleTimerState(durationSeconds);
}

export function endTimer(timerState, now = Date.now()) {
  return {
    ...timerState,
    status: "finished",
    finishedAt: now,
  };
}

export function adjustTimerDuration(timerState, deltaSeconds, now = Date.now()) {
  const nextDuration = Math.max(1, (Number(timerState.durationSeconds) || 0) + deltaSeconds);

  if (timerState.status === "idle") {
    return createIdleTimerState(nextDuration);
  }

  const remaining = getRemainingSeconds(timerState, now);
  if (remaining <= 0 && deltaSeconds < 0) return timerState;

  return {
    ...timerState,
    durationSeconds: nextDuration,
  };
}

export function getElapsedSeconds(timerState, now = Date.now()) {
  if (!timerState?.startedAt) return 0;

  const end =
    timerState.status === "paused" && timerState.pausedAt
      ? timerState.pausedAt
      : timerState.status === "finished" && timerState.finishedAt
        ? timerState.finishedAt
        : now;

  const elapsedMs = end - timerState.startedAt - (timerState.pausedAccumulatedMs ?? 0);
  return Math.max(0, elapsedMs / 1000);
}

export function getRemainingSeconds(timerState, now = Date.now()) {
  const duration = Number(timerState?.durationSeconds) || 0;
  if (!timerState || timerState.status === "idle") return duration;
  if (timerState.status === "finished") return 0;
  return Math.max(0, duration - getElapsedSeconds(timerState, now));
}

export function getProgress(timerState, now = Date.now()) {
  const duration = Number(timerState?.durationSeconds) || 0;
  if (duration <= 0 || !timerState || timerState.status === "idle") return 0;
  return Math.min(1, Math.max(0, 1 - getRemainingSeconds(timerState, now) / duration));
}

export function shouldAutoFinish(timerState, now = Date.now()) {
  return timerState?.status === "running" && getRemainingSeconds(timerState, now) <= 0;
}
