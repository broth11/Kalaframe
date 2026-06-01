export const DISPLAY_CHANNEL_NAME = "kalaframe.display";
export const DISPLAY_STATE_STORAGE_KEY = "kalaframe.displayState";
export const DISPLAY_POLL_INTERVAL_MS = 1000;
export const DISPLAY_STALE_NOTICE_MS = 10_000;
export const DISPLAY_STALE_WARNING_MS = 30_000;

export function createDisplayChannel() {
  if (!("BroadcastChannel" in window)) return null;
  return new BroadcastChannel(DISPLAY_CHANNEL_NAME);
}

export function createDisplaySnapshot({
  activitySetup,
  timerState,
  manualDirectionIndex,
  version,
}) {
  return {
    version,
    updatedAt: Date.now(),
    source: "teacher",
    activitySetup,
    timerState,
    manualDirectionIndex,
  };
}

export function writeDisplaySnapshot(snapshot) {
  localStorage.setItem(DISPLAY_STATE_STORAGE_KEY, JSON.stringify(snapshot));
}

export function readDisplaySnapshot() {
  const raw = localStorage.getItem(DISPLAY_STATE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function broadcastSnapshot(channel, snapshot) {
  if (channel) {
    channel.postMessage({ type: "KALAFRAME_DISPLAY_SNAPSHOT", payload: snapshot });
  }
  writeDisplaySnapshot(snapshot);
}

export function isNewerSnapshot(next, current) {
  if (!next) return false;
  if (!current) return true;
  return Number(next.version ?? 0) > Number(current.version ?? 0);
}
