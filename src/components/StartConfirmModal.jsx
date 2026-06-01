import { formatTime } from "../timer/formatTime.js";
import { getMode } from "../modes/modeRegistry.js";
import { getVisualizerLabel } from "../visualizer/visualizerRegistry.js";

export function StartConfirmModal({
  activitySetup,
  validation,
  onCancel,
  onConfirm,
  onChange,
}) {
  const mode = getMode(activitySetup.mode);
  const themeLabel = getVisualizerLabel(activitySetup.theme);

  function toggleChime(event) {
    onChange({ ...activitySetup, chimeEnabled: event.target.checked });
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card" role="dialog" aria-modal="true">
        <h2>Start Timer?</h2>

        <dl className="setup-summary">
          <div>
            <dt>Total Time</dt>
            <dd>{formatTime(activitySetup.durationSeconds)}</dd>
          </div>
          <div>
            <dt>Title</dt>
            <dd>{activitySetup.title || "None"}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{mode.label}</dd>
          </div>
          <div>
            <dt>Theme</dt>
            <dd>{themeLabel}</dd>
          </div>
          <div>
            <dt>Visual Intensity</dt>
            <dd>{activitySetup.visualIntensity}</dd>
          </div>
        </dl>

        <label className="inline-check">
          <input
            type="checkbox"
            checked={activitySetup.chimeEnabled}
            onChange={toggleChime}
          />
          Chime at end
        </label>

        {activitySetup.directions.length > 0 && (
          <>
            <h3>Directions</h3>
            <ol className="confirm-directions">
              {activitySetup.directions.map((direction) => (
                <li key={direction.id}>
                  {direction.text || "Untitled direction"}
                  {direction.durationSeconds
                    ? ` — ${formatTime(direction.durationSeconds)}`
                    : ""}
                </li>
              ))}
            </ol>
          </>
        )}

        {validation.message && (
          <p className="warning-text">{validation.message}</p>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onConfirm(activitySetup)}
          >
            Start
          </button>
        </div>
      </section>
    </div>
  );
}
