import { Visualizer } from "../../visualizer/Visualizer.jsx";
import { getMode } from "../../modes/modeRegistry.js";
import { KalalightCountdownOverlay } from "./KalalightCountdownOverlay.jsx";

export function KalalightVisualizerStage({
  selectedVisualizerId,
  intensity,
  progress,
  remainingSeconds,
  durationSeconds,
  status,
  inputValue,
  isValidDuration,
  onInputChange,
  onInputKeyDown,
  onStart,
}) {
  const mode = getMode("active");

  return (
    <section className="kalalight-stage" aria-label="Kalalight visual timer">
      <Visualizer
        mode="active"
        modeIntent={mode.intent}
        theme={selectedVisualizerId}
        progress={progress}
        remainingSeconds={remainingSeconds}
        totalSeconds={durationSeconds}
        reducedMotion={mode.defaults.reducedMotion}
        visualIntensity={intensity}
        previewContext="kalalight"
      />
      <KalalightCountdownOverlay
        status={status}
        inputValue={inputValue}
        remainingSeconds={remainingSeconds}
        isValidDuration={isValidDuration}
        onInputChange={onInputChange}
        onInputKeyDown={onInputKeyDown}
        onStart={onStart}
      />
    </section>
  );
}
