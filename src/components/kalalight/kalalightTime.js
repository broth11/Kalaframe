export function parseKalalightTime(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return 0;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 60;
  }

  const match = trimmed.match(/^(\d+):([0-5]?\d)$/);
  if (!match) return 0;

  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatKalalightInput(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatKalalightParts(minutes, seconds = 0) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  const safeSeconds = Math.min(59, Math.max(0, Math.round(Number(seconds) || 0)));
  return `${String(safeMinutes).padStart(2, "0")}:${String(safeSeconds).padStart(2, "0")}`;
}

export function normalizeKalalightEntry(value) {
  const cleaned = String(value ?? "").replace(/[^\d:]/g, "");
  if (!cleaned) return "00:00";

  const [minutesPart, secondsPart] = cleaned.split(":");
  const minutes = Number(minutesPart || 0);
  const seconds = secondsPart == null ? 0 : Number(secondsPart.slice(0, 2) || 0);
  return formatKalalightParts(minutes, seconds);
}
