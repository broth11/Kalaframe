const MAX_DIGITS = 6;
const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59;

function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Push one digit into a timer buffer.
 *
 * @example pushTimerDigit("", "5") // "5"
 * @example pushTimerDigit("123456", "7") // "123456" (six-digit limit)
 */
export function pushTimerDigit(buffer, digit) {
  const current = onlyDigits(buffer).slice(0, MAX_DIGITS);
  const next = onlyDigits(digit);
  if (current.length >= MAX_DIGITS || next.length !== 1) return current;
  return `${current}${next}`;
}

/**
 * Remove the rightmost digit.
 *
 * @example popTimerDigit("130") // "13"
 * @example popTimerDigit("") // ""
 */
export function popTimerDigit(buffer) {
  return onlyDigits(buffer).slice(0, -1);
}

/**
 * Convert raw HHMMSS-style digits to seconds. Minute and second fields may
 * overflow while entering: "90" is 90 seconds and starts as 1:30.
 *
 * @example digitsToSeconds("") // 0
 * @example digitsToSeconds("90") // 90
 * @example digitsToSeconds("20500") // 7500 (2:05:00)
 */
export function digitsToSeconds(buffer) {
  const padded = onlyDigits(buffer).slice(-MAX_DIGITS).padStart(MAX_DIGITS, "0");
  const hours = Number(padded.slice(0, 2));
  const minutes = Number(padded.slice(2, 4));
  const seconds = Number(padded.slice(4, 6));
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert canonical seconds to the shortest buffer that preserves MM:SS
 * grouping when rendered.
 *
 * @example secondsToDigits(90) // "130"
 * @example secondsToDigits(7500) // "20500" (2:05:00)
 */
export function secondsToDigits(seconds) {
  const safe = Math.min(MAX_SECONDS, Math.max(0, Math.round(Number(seconds) || 0)));
  if (safe === 0) return "";
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const canonical = `${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}${String(secs).padStart(2, "0")}`;
  return canonical.replace(/^0+/, "");
}

/**
 * Format the raw buffer without carrying overflowing fields. Hours stay hidden
 * until a fifth digit is entered.
 *
 * @example formatDigitBuffer("") // "00:00"
 * @example formatDigitBuffer("130") // "01:30"
 * @example formatDigitBuffer("90") // "00:90"
 * @example formatDigitBuffer("20500") // "2:05:00"
 */
export function formatDigitBuffer(buffer) {
  const digits = onlyDigits(buffer).slice(-MAX_DIGITS);
  if (digits.length > 4) {
    const padded = digits.padStart(6, "0");
    return `${Number(padded.slice(0, 2))}:${padded.slice(2, 4)}:${padded.slice(4)}`;
  }
  const padded = digits.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

export function parseKalalightTime(value) {
  return digitsToSeconds(value);
}

export function formatKalalightInput(seconds) {
  return formatDigitBuffer(secondsToDigits(seconds));
}

export function normalizeKalalightDisplay(value) {
  return formatKalalightInput(digitsToSeconds(value));
}

export function formatKalalightParts(minutes, seconds = 0) {
  return formatKalalightInput(
    Math.max(0, Math.round(Number(minutes) || 0)) * 60
      + Math.max(0, Math.round(Number(seconds) || 0)),
  );
}

export function normalizeKalalightEntry(value) {
  return normalizeKalalightDisplay(value);
}
