import { formatTime } from "../../timer/formatTime.js";
import { formatDigitBuffer } from "./kalalightTime.js";

const PRESETS = [1, 5, 10, 15, 20, 30];

function DigitBufferDisplay({ buffer }) {
  const formatted = formatDigitBuffer(buffer);
  let remainingActive = buffer.length;

  return [...formatted].map((character, index) => {
    const isDigit = /\d/.test(character);
    const digitsAfter = [...formatted.slice(index + 1)].filter((item) => /\d/.test(item)).length;
    const active = isDigit && digitsAfter < remainingActive;
    return (
      <span
        // Position is stable within a formatted buffer.
        key={`${index}-${character}`}
        className={active || !isDigit ? "kalalight-digit-active" : "kalalight-digit-placeholder"}
      >
        {character}
      </span>
    );
  });
}

export function KalalightCountdownOverlay({
  status,
  digitBuffer,
  remainingSeconds,
  isValidDuration,
  onInputKeyDown,
  onInputWheel,
  onPreset,
  onStart,
}) {
  const isEditing = status === "idle" || status === "ready";

  return (
    <div className="kalalight-countdown-layer">
      <div className="kalalight-countdown-stack">
        {isEditing ? (
          <div
            className="kalalight-time-input"
            tabIndex={0}
            role="textbox"
            aria-label={`Timer duration, ${formatDigitBuffer(digitBuffer)}. Type digits from right to left.`}
            onKeyDown={onInputKeyDown}
            onWheel={onInputWheel}
          >
            <DigitBufferDisplay buffer={digitBuffer} />
          </div>
        ) : (
          <div
            className="kalalight-time-display"
            role="timer"
            aria-live="polite"
            aria-label={`Time remaining ${formatTime(remainingSeconds)}`}
          >
            {formatTime(remainingSeconds)}
          </div>
        )}

        {isEditing ? (
          <div className="kalalight-presets" aria-label="Quick timer presets">
            {PRESETS.map((minutes) => (
              <button type="button" key={minutes} onClick={() => onPreset(minutes)}>
                {minutes} min
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className={`kalalight-start-button ${isValidDuration && isEditing ? "visible" : ""}`}
          onClick={onStart}
          disabled={!isValidDuration || !isEditing}
        >
          Start
        </button>
      </div>
    </div>
  );
}
