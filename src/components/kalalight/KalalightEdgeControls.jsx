export function KalalightEdgeControls({
  onPreviousVisualizer,
  onNextVisualizer,
  onIncreaseIntensity,
  onDecreaseIntensity,
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
        aria-label="Increase visual intensity"
        onClick={onIncreaseIntensity}
      >
        ↑
      </button>
      <button
        type="button"
        className="kalalight-edge-button kalalight-edge-down"
        aria-label="Decrease visual intensity"
        onClick={onDecreaseIntensity}
      >
        ↓
      </button>
    </div>
  );
}
