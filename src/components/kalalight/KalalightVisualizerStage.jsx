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
  digitBuffer,
  isValidDuration,
  onInputKeyDown,
  onInputWheel,
  onPreset,
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
        digitBuffer={digitBuffer}
        remainingSeconds={remainingSeconds}
        isValidDuration={isValidDuration}
        onInputKeyDown={onInputKeyDown}
        onInputWheel={onInputWheel}
        onPreset={onPreset}
        onStart={onStart}
      />
    </section>
  );
}
