import { TimerOverlay } from "./TimerOverlay.jsx";
import { Visualizer } from "../visualizer/Visualizer.jsx";
import { getMode } from "../modes/modeRegistry.js";
import { normalizeThemeId } from "../visualizer/visualizerRegistry.js";

export function ProjectorDisplay({
  activitySetup,
  timerState,
  remainingSeconds,
  currentDirection,
  stepRemainingSeconds,
  progress,
  isStale = false,
  overlayVariant = "fullscreen",
}) {
  const mode = getMode(activitySetup.mode);
  const theme = normalizeThemeId(activitySetup.theme);
  const isIdle = timerState.status === "idle";

  return (
    <main className={`projector-shell theme-${theme}`}>
      <Visualizer
        mode={activitySetup.mode}
        modeIntent={mode.intent}
        theme={theme}
        progress={progress}
        remainingSeconds={remainingSeconds}
        totalSeconds={timerState.durationSeconds}
        reducedMotion={mode.defaults.reducedMotion}
        visualIntensity={activitySetup.visualIntensity}
      />

      <TimerOverlay
        isIdle={isIdle}
        activitySetup={activitySetup}
        timerState={timerState}
        remainingSeconds={remainingSeconds}
        currentDirection={currentDirection}
        stepRemainingSeconds={stepRemainingSeconds}
        isStale={isStale}
        theme={theme}
        variant={overlayVariant}
      />
    </main>
  );
}
