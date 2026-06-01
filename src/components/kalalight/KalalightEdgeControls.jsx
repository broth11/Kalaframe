export function KalalightEdgeControls({
  onPreviousVisualizer,
  onNextVisualizer,
  onCycleIntensity,
}) {
  return (
    <div className="kalalight-edge-controls" aria-label="Visualizer and intensity controls">
      <button
        type="button"
        className="kalalight-edge-button kalalight-edge-left"
        aria-label="Previous visualizer"
        onClick={onPreviousVisualizer}
      >
        &lt;
      </button>
      <button
        type="button"
        className="kalalight-edge-button kalalight-edge-right"
        aria-label="Next visualizer"
        onClick={onNextVisualizer}
      >
        &gt;
      </button>
      <button
        type="button"
        className="kalalight-edge-button kalalight-edge-up"
        aria-label="Cycle visual intensity"
        title="Cycle visual intensity"
        onClick={onCycleIntensity}
      >
        ↑
      </button>
    </div>
  );
}
