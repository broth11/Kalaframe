import { useEffect, useState } from "react";
import {
  clearActivityHistory,
  getRecentActivityHistory,
} from "../storage/activityHistoryStore.js";
import { cloneActivityForReuse } from "../activity/activityModel.js";
import { formatTime } from "../timer/formatTime.js";
import { getMode } from "../modes/modeRegistry.js";
import { getVisualizerLabel } from "../visualizer/visualizerRegistry.js";

export function HistoryPanel({ reloadKey, onRestore }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getRecentActivityHistory(8)
      .then((history) => {
        if (!cancelled) {
          setItems(history);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Could not load history.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleClear() {
    await clearActivityHistory();
    setItems([]);
  }

  return (
    <section className="teacher-card history-card">
      <div className="card-header-row">
        <div>
          <h2>Recent Activities</h2>
          <p>Restore a previous setup for another class.</p>
        </div>
        {items.length > 0 && (
          <button type="button" className="subtle-button" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>

      {error && <p className="warning-text">{error}</p>}

      {items.length === 0 && !error && (
        <p className="empty-state">No activity history yet. Start a timer to save it here.</p>
      )}

      <div className="history-list">
        {items.map((item) => {
          const mode = getMode(item.mode);
          const themeLabel = getVisualizerLabel(item.theme);
          return (
            <button
              type="button"
              className="history-item"
              key={item.id}
              onClick={() => onRestore(cloneActivityForReuse(item))}
            >
              <strong>
                {formatTime(item.durationSeconds)} {item.title ? `— ${item.title}` : ""}
              </strong>
              <span>
                {item.directions?.length ?? 0} directions · {mode.label} · {themeLabel} · {item.visualIntensity}
              </span>
              {item.lastUsedAt && (
                <small>Used {new Date(item.lastUsedAt).toLocaleString()}</small>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function HistoryMenu({ reloadKey, onRestore }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getRecentActivityHistory(8)
      .then((history) => {
        if (!cancelled) {
          setItems(history);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Could not load history.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, open]);

  async function handleClear() {
    await clearActivityHistory();
    setItems([]);
  }

  function handleRestore(item) {
    onRestore(cloneActivityForReuse(item));
    setOpen(false);
  }

  return (
    <div className="history-menu">
      <button
        type="button"
        className="secondary-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Recent Activities
      </button>

      {open && (
        <div className="history-menu-popover" role="menu">
          <div className="history-menu-header">
            <div>
              <strong>Recent Activities</strong>
              <span>Restore a setup without starting it.</span>
            </div>
            {items.length > 0 && (
              <button type="button" className="subtle-button" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>

          {error && <p className="warning-text">{error}</p>}
          {items.length === 0 && !error && (
            <p className="empty-state">No activity history yet.</p>
          )}

          <div className="history-menu-list">
            {items.map((item) => {
              const mode = getMode(item.mode);
              const themeLabel = getVisualizerLabel(item.theme);
              return (
                <button
                  type="button"
                  className="history-menu-item"
                  key={item.id}
                  onClick={() => handleRestore(item)}
                  role="menuitem"
                >
                  <strong>
                    {formatTime(item.durationSeconds)} {item.title ? `- ${item.title}` : ""}
                  </strong>
                  <span>
                    {item.directions?.length ?? 0} directions · {mode.label} · {themeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
