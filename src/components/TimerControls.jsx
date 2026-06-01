import { formatTime } from "../timer/formatTime.js";

export function TimerControls({
  timerState,
  remainingSeconds,
  currentDirectionState,
  hasDirections,
  canAutoAdvance,
  onStart,
  onPause,
  onResume,
  onReset,
  onEnd,
  onAddMinute,
  onSubtractMinute,
  onPreviousDirection,
  onNextDirection,
}) {
  const isRunning = timerState.status === "running";
  const isPaused = timerState.status === "paused";
  const isIdle = timerState.status === "idle";
  const isFinished = timerState.status === "finished";

  return (
    <section className="teacher-card control-card">
      <h2>Live Controls</h2>
      <p className="live-time">{formatTime(remainingSeconds)}</p>

      {currentDirectionState?.direction?.text && (
        <p className="current-step">
          Current: <strong>{currentDirectionState.direction.text}</strong>
        </p>
      )}

      <div className="button-row">
        {(isIdle || isFinished) && (
          <button type="button" className="primary-button" onClick={onStart}>
            Start
          </button>
        )}

        {isRunning && (
          <button type="button" className="primary-button" onClick={onPause}>
            Pause
          </button>
        )}

        {isPaused && (
          <button type="button" className="primary-button" onClick={onResume}>
            Resume
          </button>
        )}

        <button type="button" className="secondary-button" onClick={onReset}>
          Reset
        </button>

        {!isIdle && !isFinished && (
          <button type="button" className="secondary-button" onClick={onEnd}>
            End
          </button>
        )}
      </div>

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onAddMinute}>
          +1 minute
        </button>
        <button type="button" className="secondary-button" onClick={onSubtractMinute}>
          -1 minute
        </button>
      </div>

      {hasDirections && !canAutoAdvance && (
        <div className="direction-control-group">
          <p>Manual direction controls</p>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={onPreviousDirection}>
              Previous Direction
            </button>
            <button type="button" className="secondary-button" onClick={onNextDirection}>
              Next Direction
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
