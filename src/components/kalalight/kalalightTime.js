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
