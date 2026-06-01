import { formatTime } from "../../timer/formatTime.js";

export function KalalightCountdownOverlay({
  status,
  inputValue,
  remainingSeconds,
  isValidDuration,
  onInputChange,
  onInputKeyDown,
  onStart,
}) {
  const isEditing = status === "idle" || status === "ready";
  const displayValue = isEditing ? inputValue : formatTime(remainingSeconds);

  return (
    <div className="kalalight-countdown-layer">
      <div className="kalalight-countdown-stack">
        {isEditing ? (
          <input
            className="kalalight-time-input"
            value={displayValue}
            inputMode="numeric"
            aria-label="Timer duration"
            onChange={(event) => onInputChange(event.target.value)}
            onInput={(event) => onInputChange(event.currentTarget.value)}
            onKeyDown={onInputKeyDown}
          />
        ) : (
          <div className="kalalight-time-display" aria-live="polite">
            {displayValue}
          </div>
        )}

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
