/**
 * Parse a timer entry string into total seconds.
 *
 * Handles in-progress typing — does NOT require a fully-formed string.
 *
 * "5"     → 300   (minutes only)
 * "90"    → 5400
 * "5:"    → 300   (trailing colon = 5 min 0 sec)
 * "5:3"   → 303   (5 min 3 sec)
 * "5:30"  → 330
 * "5:90"  → 390   (carry-over: 6:30)
 * "0:30"  → 30
 */
export function parseKalalightTime(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return 0;

  // No colon — treat whole thing as minutes
  if (!trimmed.includes(":")) {
    const mins = Number(trimmed);
    return isNaN(mins) ? 0 : mins * 60;
  }

  // Has colon — split into minutes : seconds
  const colonIdx = trimmed.indexOf(":");
  const minsPart = trimmed.slice(0, colonIdx);
  const secsPart = trimmed.slice(colonIdx + 1);

  const mins = minsPart === "" ? 0 : Number(minsPart);
  const secs = secsPart === "" ? 0 : Number(secsPart);

  if (isNaN(mins) || isNaN(secs)) return 0;

  // Carry-over: "5:90" → 390 (same as 6:30)
  return mins * 60 + secs;
}

/** Format a total-seconds value as M:SS (no zero-padding on minutes). */
export function formatKalalightInput(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Normalize a raw text entry to M:SS after editing is complete
 * (blur / Enter / Start).  Returns "0:00" for empty or zero input.
 */
export function normalizeKalalightDisplay(value) {
  const secs = parseKalalightTime(value);
  return secs > 0 ? formatKalalightInput(secs) : "0:00";
}

// Legacy helpers kept for callers that still use them
export function formatKalalightParts(minutes, seconds = 0) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  const s = Math.min(59, Math.max(0, Math.round(Number(seconds) || 0)));
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function normalizeKalalightEntry(value) {
  return normalizeKalalightDisplay(value);
}
