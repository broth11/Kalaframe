import { formatTime } from "../timer/formatTime.js";

export function TimerOverlay({
  isIdle,
  activitySetup,
  timerState,
  remainingSeconds,
  currentDirection,
  stepRemainingSeconds,
  theme,
  variant = "fullscreen",
}) {
  const overlayClass = `countdown-safe-zone countdown-overlay--${variant} theme-${theme}`;

  if (isIdle) {
    const idleText = variant === "preview" ? formatTime(remainingSeconds) : "Ready";

    return (
      <section className={overlayClass}>
        <div className="countdown-plate countdown-plate-ready">
          <p className={`countdown-time ${variant === "preview" ? "countdown-numeric" : "countdown-ready"}`}>
            {idleText}
          </p>
          {activitySetup.title && <p className="countdown-title">{activitySetup.title}</p>}
        </div>
      </section>
    );
  }

  const isFinished = timerState.status === "finished" || remainingSeconds <= 0;

  return (
    <section className={overlayClass}>
      <div className={isFinished ? "countdown-plate countdown-plate-finished" : "countdown-plate"}>
        <div className={isFinished ? "countdown-time countdown-ready" : "countdown-time countdown-numeric"}>
          {isFinished ? "Time" : formatTime(remainingSeconds)}
        </div>

        {activitySetup.title && (
          <div className="countdown-title">{activitySetup.title}</div>
        )}

        {currentDirection?.text && (
          <div className="countdown-direction">{currentDirection.text}</div>
        )}

        {stepRemainingSeconds != null && !isFinished && (
          <div className="countdown-step-time">
            {formatTime(stepRemainingSeconds)} until next transition
          </div>
        )}

      </div>
    </section>
  );
}
