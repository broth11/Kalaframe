import { useMemo } from "react";
import { createDirection, createHeroExampleActivity } from "../activity/activityModel.js";
import { getMode, modeOptions } from "../modes/modeRegistry.js";
import { Visualizer } from "../visualizer/Visualizer.jsx";
import { ProjectorDisplay } from "../display/ProjectorDisplay.jsx";
import {
  visualizerPickerOptions,
  getVisualizerLabel,
} from "../visualizer/visualizerRegistry.js";
import { formatTime } from "../timer/formatTime.js";

const DURATION_PRESETS = [1, 5, 10, 60];
const SETUP_STEPS = [
  { id: "time", number: 1, label: "Time & task" },
  { id: "look", number: 2, label: "Look & mood" },
  { id: "review", number: 3, label: "Preview & run" },
];
const VISUAL_INTENSITY_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
];

function minutesLabel(seconds) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return `${minutes} min`;
}

function getDirectionPlan(activitySetup) {
  const directions = activitySetup.directions ?? [];
  const total = Number(activitySetup.durationSeconds) || 0;
  let cursor = 0;
  let nonFinalTotal = 0;

  const rows = directions.map((direction, index) => {
    const isOnly = directions.length === 1;
    const isFinal = index === directions.length - 1;
    const entered = Number(direction.durationSeconds) || 0;
    const duration = isOnly || isFinal ? Math.max(0, total - nonFinalTotal) : entered;
    const start = cursor;
    const end = Math.min(total, cursor + duration);

    if (!isFinal && !isOnly) nonFinalTotal += entered;
    cursor += duration;

    return { direction, index, isOnly, isFinal, duration, start, end };
  });

  const overBy = Math.max(0, nonFinalTotal - total);
  const finalRemaining = Math.max(0, total - nonFinalTotal);
  return { rows, nonFinalTotal, overBy, finalRemaining };
}

function normalizeDirectionDurations(setup) {
  const directions = setup.directions ?? [];
  if (directions.length === 0) return setup;

  let nonFinalTotal = 0;
  const total = Number(setup.durationSeconds) || 0;
  const normalized = directions.map((direction, index) => {
    const isOnly = directions.length === 1;
    const isFinal = index === directions.length - 1;
    if (isOnly || isFinal) {
      return { ...direction, durationSeconds: Math.max(0, total - nonFinalTotal) };
    }
    const durationSeconds = Math.max(0, Number(direction.durationSeconds) || 0);
    nonFinalTotal += durationSeconds;
    return { ...direction, durationSeconds };
  });

  return { ...setup, directions: normalized };
}

function setupSummary(activitySetup, directionPlan) {
  const title = activitySetup.title?.trim() || "Untitled";
  const directionCount = activitySetup.directions.length;
  const directionText =
    directionCount === 0
      ? "No staged directions"
      : directionCount === 1
        ? "1 direction · full timer"
        : `${directionCount} directions · final message has ${minutesLabel(directionPlan.finalRemaining)}`;
  return {
    time: formatTime(activitySetup.durationSeconds),
    task: title,
    look: `${getVisualizerLabel(activitySetup.theme)} · ${activitySetup.visualIntensity}`,
    directions: directionText,
  };
}

function VisualizerPreviewSwatch({ visualizer }) {
  if (visualizer.previewImage) {
    return (
      <span className="visualizer-swatch visualizer-image-swatch" aria-hidden="true">
        <img src={visualizer.previewImage} alt="" loading="lazy" />
      </span>
    );
  }

  return (
    <span className={`visualizer-swatch ${visualizer.previewClass ?? "preview-dots"}`} aria-hidden="true">
      <span />
    </span>
  );
}

export function TimerSetupForm({
  activitySetup,
  setActivitySetup,
  activeStep,
  setActiveStep,
  restoreMessage,
  validation,
  previewState,
  timerControls,
  onStart,
  onOpenDisplay,
  canOpenDisplay,
}) {
  const currentStep = activeStep ?? "time";
  const setCurrentStep = setActiveStep ?? (() => {});
  const directionPlan = useMemo(() => getDirectionPlan(activitySetup), [activitySetup]);
  const summary = setupSummary(activitySetup, directionPlan);
  const hasDirectionError = directionPlan.overBy > 0;

  function update(patch) {
    setActivitySetup((current) => normalizeDirectionDurations({ ...current, ...patch }));
  }

  function updateDirection(id, patch) {
    setActivitySetup((current) => normalizeDirectionDurations({
      ...current,
      directions: current.directions.map((direction) =>
        direction.id === id ? { ...direction, ...patch } : direction,
      ),
    }));
  }

  function addDirection() {
    setActivitySetup((current) => normalizeDirectionDurations({
      ...current,
      directions: [...current.directions, createDirection()],
    }));
  }

  function removeDirection(id) {
    setActivitySetup((current) => normalizeDirectionDurations({
      ...current,
      directions: current.directions.filter((direction) => direction.id !== id),
    }));
  }

  function loadHeroExample() {
    setActivitySetup(normalizeDirectionDurations(createHeroExampleActivity()));
  }

  function handleStart() {
    if (!hasDirectionError) onStart();
  }

  return (
    <section className="setup-flow-card setup-card">
      <SetupPillNav
        activeStep={currentStep}
        setActiveStep={setCurrentStep}
        summary={summary}
        timerState={timerControls?.timerState}
      />

      <div className="setup-stage">
        {currentStep === "time" && (
          <TimeTaskCard
            activitySetup={activitySetup}
            update={update}
            updateDirection={updateDirection}
            addDirection={addDirection}
            removeDirection={removeDirection}
            loadHeroExample={loadHeroExample}
            directionPlan={directionPlan}
            onContinue={() => setCurrentStep("look")}
          />
        )}

        {currentStep === "look" && (
          <LookMoodCard
            activitySetup={activitySetup}
            update={update}
            onBack={() => setCurrentStep("time")}
            onContinue={() => setCurrentStep("review")}
          />
        )}

        {currentStep === "review" && (
          <ReviewLaunchCard
            activitySetup={activitySetup}
            directionPlan={directionPlan}
            hasDirectionError={hasDirectionError}
            validation={validation}
            restoreMessage={restoreMessage}
            previewState={previewState}
            timerControls={timerControls}
            onEditTime={() => setCurrentStep("time")}
            onEditLook={() => setCurrentStep("look")}
            onNewTimer={() => {
              timerControls?.onReset();
              setCurrentStep("time");
            }}
            onReuseSetup={() => timerControls?.onReset()}
            onBack={() => setCurrentStep("look")}
            onStart={handleStart}
            onOpenDisplay={onOpenDisplay}
            canOpenDisplay={canOpenDisplay}
          />
        )}
      </div>
    </section>
  );
}

function SetupPillNav({ activeStep, setActiveStep, summary }) {
  const captions = {
    time: `${summary.time} · ${summary.task}`,
    look: summary.look,
    review: summary.directions,
  };
  return (
    <nav className="setup-pill-nav" aria-label="Timer setup steps">
      {SETUP_STEPS.map((step) => {
        const isActive = activeStep === step.id;
        const complete = SETUP_STEPS.findIndex((item) => item.id === activeStep) > step.number - 1;
        return (
          <button
            key={step.id}
            type="button"
            className={`setup-pill ${isActive ? "active" : ""} ${complete ? "complete" : ""}`}
            onClick={() => setActiveStep(step.id)}
            aria-current={isActive ? "step" : undefined}
          >
            <span className="setup-pill-number">{step.number}</span>
            <span className="setup-pill-copy">
              <strong>{step.label}</strong>
              <small>{captions[step.id]}</small>
            </span>
            <span className="setup-pill-status">{isActive ? "Now" : complete ? "Done" : "Open"}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TimeTaskCard({ activitySetup, update, updateDirection, addDirection, removeDirection, loadHeroExample, directionPlan, onContinue }) {
  return (
    <div className="setup-panel-card">
      <header className="setup-panel-header">
        <div>
          <h2>How long is this classroom moment?</h2>
          <p>Set the time, title, and messages students will see.</p>
        </div>
        <button type="button" className="secondary-button" onClick={loadHeroExample}>Load Example</button>
      </header>

      <div className="setup-two-column time-task-layout">
        <div className="setup-panel-section">
          <span className="section-label">Duration</span>
          <div className="quick-preset-row" aria-label="Quick timer presets">
            {DURATION_PRESETS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={activitySetup.durationSeconds === minutes * 60 ? "chip selected" : "chip"}
                aria-pressed={activitySetup.durationSeconds === minutes * 60}
                onClick={() => update({ durationSeconds: minutes * 60 })}
              >
                {minutes} min
              </button>
            ))}
            <button
              type="button"
              className="chip"
              onClick={() => document.getElementById("custom-duration-minutes")?.focus()}
            >
              Custom
            </button>
          </div>

          <label>
            Custom duration in minutes
            <input
              id="custom-duration-minutes"
              type="number"
              min="1"
              value={Math.round(activitySetup.durationSeconds / 60)}
              onChange={(event) => update({ durationSeconds: Math.max(1, Number(event.target.value) || 1) * 60 })}
            />
          </label>

          <label>
            Optional activity title
            <input
              type="text"
              value={activitySetup.title}
              placeholder="Group Problem Solving"
              onChange={(event) => update({ title: event.target.value })}
            />
          </label>
        </div>

        <StagedDirectionsEditor
          activitySetup={activitySetup}
          directionPlan={directionPlan}
          updateDirection={updateDirection}
          addDirection={addDirection}
          removeDirection={removeDirection}
        />
      </div>

      <footer className="setup-actions">
          <span className={directionPlan.overBy > 0 ? "setup-error" : "setup-helper"}>
          {directionPlan.overBy > 0
            ? `Over by ${minutesLabel(directionPlan.overBy)}.`
            : activitySetup.directions.length > 1
              ? `Final message has ${minutesLabel(directionPlan.finalRemaining)}.`
              : "Directions are optional."}
        </span>
        <button type="button" className="primary-button" onClick={onContinue}>Confirm time & task</button>
      </footer>
    </div>
  );
}

function StagedDirectionsEditor({ activitySetup, directionPlan, updateDirection, addDirection, removeDirection }) {
  return (
    <div className="setup-panel-section directions-editor-card">
      <div className="directions-header">
        <div>
          <span className="section-label">Staged directions</span>
          <p>Show different messages as the timer progresses.</p>
        </div>
        <button type="button" className="secondary-button" onClick={addDirection}>+ Add Direction</button>
      </div>

      {directionPlan.overBy > 0 && (
        <p className="setup-error">Direction times exceed the timer length by {minutesLabel(directionPlan.overBy)}.</p>
      )}

      <div className="direction-list refined-direction-list">
        {activitySetup.directions.length === 0 && <p className="empty-state">No staged directions</p>}
        {directionPlan.rows.map(({ direction, index, isOnly, isFinal, duration, start, end }) => (
          <div className="direction-card-row" key={direction.id}>
            <div className="direction-card-topline">
              <span className="direction-number">{index + 1}</span>
              <strong>{isOnly ? "Shows for entire timer" : isFinal ? "Shows for remaining time" : `Shows for ${minutesLabel(duration)}`}</strong>
              <button type="button" className="subtle-button" aria-label={`Delete direction ${index + 1}`} onClick={() => removeDirection(direction.id)}>Delete</button>
            </div>
            <label>
              Message text
              <input
                type="text"
                value={direction.text}
                placeholder="Brainstorm individually"
                onChange={(event) => updateDirection(direction.id, { text: event.target.value })}
              />
            </label>
            {!isOnly && !isFinal && (
              <label>
                This message shows for…
                <input
                  type="number"
                  min="0"
                  value={direction.durationSeconds ? direction.durationSeconds / 60 : ""}
                  placeholder="min"
                  onChange={(event) => {
                    const minutes = Number(event.target.value);
                    updateDirection(direction.id, { durationSeconds: Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : 0 });
                  }}
                />
              </label>
            )}
            <p className="direction-preview">Preview: {formatTime(start)}–{formatTime(end)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LookMoodCard({ activitySetup, update, onBack, onContinue }) {
  return (
    <div className="setup-panel-card">
      <header className="setup-panel-header">
        <div>
          <h2>Choose the room feel.</h2>
          <p>Pick a classroom mode, visualizer, and motion intensity.</p>
        </div>
      </header>

      <div className="look-layout-refined">
        <div className="setup-panel-section">
          <span className="section-label">Mode</span>
          <div className="mode-choice-stack">
            {modeOptions.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={activitySetup.mode === mode.id ? "mode-card selected" : "mode-card"}
                aria-pressed={activitySetup.mode === mode.id}
                onClick={() => update({ mode: mode.id, chimeEnabled: mode.defaults.chimeEnabled })}
              >
                <strong>{mode.label}</strong>
                <span>{mode.description}</span>
              </button>
            ))}
          </div>

          <span className="section-label">Visual Intensity</span>
          <div className="button-row">
            {VISUAL_INTENSITY_OPTIONS.map((intensity) => (
              <button
                key={intensity.id}
                type="button"
                className={activitySetup.visualIntensity === intensity.id ? "choice selected" : "choice"}
                aria-pressed={activitySetup.visualIntensity === intensity.id}
                onClick={() => update({ visualIntensity: intensity.id })}
              >
                {intensity.label}
              </button>
            ))}
          </div>

          <label className="inline-check setup-chime-check">
            <input
              type="checkbox"
              checked={activitySetup.chimeEnabled}
              onChange={(event) => update({ chimeEnabled: event.target.checked })}
            />
            Chime at end
          </label>
        </div>

        <VisualizerPicker activitySetup={activitySetup} update={update} />
      </div>

      <footer className="setup-actions">
        <button type="button" className="secondary-button" onClick={onBack}>Back</button>
        <button type="button" className="primary-button" onClick={onContinue}>Confirm look & mood</button>
      </footer>
    </div>
  );
}

function VisualizerPicker({ activitySetup, update }) {
  const pickerOptions = visualizerPickerOptions;
  const currentIndex = Math.max(
    0,
    pickerOptions.findIndex((visualizer) => visualizer.id === activitySetup.theme),
  );
  const selected = pickerOptions[currentIndex] ?? pickerOptions[0];
  const previous =
    pickerOptions[(currentIndex - 1 + pickerOptions.length) % pickerOptions.length];
  const next = pickerOptions[(currentIndex + 1) % pickerOptions.length];

  function chooseOffset(offset) {
    const nextIndex = (currentIndex + offset + pickerOptions.length) % pickerOptions.length;
    update({ theme: pickerOptions[nextIndex].id });
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      chooseOffset(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      chooseOffset(1);
    }
  }

  const selectedMode = getMode(activitySetup.mode);

  return (
    <div className="setup-panel-section visualizer-picker-panel">
      <span className="section-label">Visualizer</span>
      <div className="visualizer-carousel" onKeyDown={handleKeyDown}>
        <button
          type="button"
          className="carousel-nav-button"
          aria-label="Previous visualizer"
          onClick={() => chooseOffset(-1)}
        >
          &lt;
        </button>

        <button
          type="button"
          className="visualizer-carousel-side"
          onClick={() => chooseOffset(-1)}
        >
          <VisualizerPreviewSwatch visualizer={previous} />
          <span>{previous.label}</span>
        </button>

        <div className="visualizer-carousel-center">
          <div className="visualizer-live-preview" aria-hidden="true">
            <Visualizer
              mode={activitySetup.mode}
              modeIntent={selectedMode.intent}
              theme={selected.id}
              progress={0}
              remainingSeconds={activitySetup.durationSeconds}
              totalSeconds={activitySetup.durationSeconds}
              reducedMotion={selectedMode.defaults.reducedMotion}
              visualIntensity={activitySetup.visualIntensity}
              previewContext="carousel"
              showEquation={false}
            />
          </div>
          <strong>{selected.label}</strong>
          <span>{selected.description}</span>
          <em>{selected.engine ?? "p5"} · {selected.mood ?? "Classroom visual"}</em>
        </div>

        <button type="button" className="visualizer-carousel-side" onClick={() => chooseOffset(1)}>
          <VisualizerPreviewSwatch visualizer={next} />
          <span>{next.label}</span>
        </button>

        <button
          type="button"
          className="carousel-nav-button"
          aria-label="Next visualizer"
          onClick={() => chooseOffset(1)}
        >
          &gt;
        </button>
      </div>

      <div className="visualizer-carousel-dots" aria-label="Visualizer choices">
        {pickerOptions.map((visualizer) => (
          <button
            key={visualizer.id}
            type="button"
            className={activitySetup.theme === visualizer.id ? "carousel-dot selected" : "carousel-dot"}
            aria-label={visualizer.label}
            aria-pressed={activitySetup.theme === visualizer.id}
            onClick={() => update({ theme: visualizer.id })}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewLaunchCard({
  activitySetup,
  directionPlan,
  hasDirectionError,
  validation,
  restoreMessage,
  previewState,
  timerControls,
  onEditTime,
  onEditLook,
  onNewTimer,
  onReuseSetup,
  onBack,
  onStart,
  onOpenDisplay,
  canOpenDisplay,
}) {
  const status = timerControls?.timerState?.status ?? "idle";
  const isIdle = status === "idle";
  const isFinished = status === "finished";
  const directionSummary =
    activitySetup.directions.length === 0
      ? "No staged directions"
      : activitySetup.directions.length === 1
        ? "1 direction · full timer"
        : `${activitySetup.directions.length} directions · final message has ${minutesLabel(directionPlan.finalRemaining)}`;

  return (
    <div className="setup-panel-card preview-run-card">
      <header className="setup-panel-header">
        <div>
          <h2>Preview & run</h2>
          <p>Check the display, then run the timer from this card.</p>
        </div>
      </header>

      <div className="review-layout-refined">
        <div className="review-live-preview-card">
          <ProjectorDisplay
            activitySetup={activitySetup}
            timerState={previewState?.timerState ?? { status: "idle", durationSeconds: activitySetup.durationSeconds }}
            remainingSeconds={previewState?.remainingSeconds ?? activitySetup.durationSeconds}
            currentDirection={previewState?.currentDirectionState?.direction ?? activitySetup.directions[0]}
            stepRemainingSeconds={previewState?.currentDirectionState?.stepRemainingSeconds ?? activitySetup.directions[0]?.durationSeconds}
            progress={previewState?.progress ?? 0}
            overlayVariant="preview"
          />
        </div>

        <div className="setup-panel-section run-side-pane">
          {isIdle ? (
            <>
              {restoreMessage && <p className="success-note">{restoreMessage}</p>}
              <dl className="setup-summary review-summary-list">
                <div><dt>Duration</dt><dd>{formatTime(activitySetup.durationSeconds)}</dd></div>
                <div><dt>Title</dt><dd>{activitySetup.title || "None"}</dd></div>
                <div><dt>Mode</dt><dd>{modeOptions.find((mode) => mode.id === activitySetup.mode)?.label ?? activitySetup.mode}</dd></div>
                <div><dt>Visualizer</dt><dd>{getVisualizerLabel(activitySetup.theme)}</dd></div>
                <div><dt>Intensity</dt><dd>{activitySetup.visualIntensity}</dd></div>
                <div><dt>Directions</dt><dd>{directionSummary}</dd></div>
                <div><dt>Chime</dt><dd>{activitySetup.chimeEnabled ? "On" : "Off"}</dd></div>
              </dl>
              {hasDirectionError && <p className="setup-error">Direction times exceed the timer length by {minutesLabel(directionPlan.overBy)}.</p>}
              {validation?.message && <p className="warning-text">{validation.message}</p>}
              <div className="button-row">
                <button type="button" className="subtle-button" onClick={onEditTime}>Edit time</button>
                <button type="button" className="subtle-button" onClick={onEditLook}>Edit look</button>
              </div>
            </>
          ) : (
            <CompactRunControls
              timerControls={timerControls}
              isFinished={isFinished}
              onNewTimer={onNewTimer}
              onReuseSetup={onReuseSetup}
            />
          )}
        </div>
      </div>

      <footer className="setup-actions">
        <button type="button" className="secondary-button" onClick={onBack}>Back</button>
        {onOpenDisplay && (
          <button
            type="button"
            className="secondary-button"
            onClick={onOpenDisplay}
            disabled={!canOpenDisplay}
            title={!canOpenDisplay ? "Start the timer before opening the projector display." : undefined}
            aria-label={!canOpenDisplay ? "Start the timer before opening the projector display." : "Open Projector Display"}
          >
            Open Projector Display
          </button>
        )}
        {isIdle && <button type="button" className="primary-button" onClick={onStart} disabled={hasDirectionError}>Start Timer</button>}
      </footer>
    </div>
  );
}

function CompactRunControls({ timerControls, isFinished, onNewTimer, onReuseSetup }) {
  const isRunning = timerControls.timerState.status === "running";
  const isPaused = timerControls.timerState.status === "paused";
  const statusLabel = isFinished ? "Completed" : isPaused ? "Paused" : "Running";

  return (
    <div className="compact-run-controls">
      <div>
        <span className="section-label">Live status</span>
        <p className="compact-status">{statusLabel} · {formatTime(timerControls.remainingSeconds)} remaining</p>
      </div>

      {timerControls.currentDirectionState?.direction?.text && (
        <p className="current-step">
          Current: <strong>{timerControls.currentDirectionState.direction.text}</strong>
        </p>
      )}

      {isFinished ? (
        <>
          <button type="button" className="primary-button" onClick={timerControls.onReset}>Reset</button>
          <button type="button" className="secondary-button" onClick={onNewTimer}>New timer</button>
          <button type="button" className="secondary-button" onClick={onReuseSetup}>Reuse setup</button>
        </>
      ) : (
        <>
          <div className="button-row">
            {isRunning && <button type="button" className="primary-button" onClick={timerControls.onPause}>Pause</button>}
            {isPaused && <button type="button" className="primary-button" onClick={timerControls.onResume}>Resume</button>}
            <button type="button" className="secondary-button" onClick={timerControls.onReset}>Reset</button>
            <button type="button" className="secondary-button" onClick={timerControls.onEnd}>End</button>
          </div>

          <div className="button-row">
            <button type="button" className="secondary-button" onClick={timerControls.onAddMinute}>+1 minute</button>
            <button type="button" className="secondary-button" onClick={timerControls.onSubtractMinute}>-1 minute</button>
          </div>

          {timerControls.hasDirections && !timerControls.canAutoAdvance && (
            <div className="direction-control-group">
              <p>Manual direction controls</p>
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={timerControls.onPreviousDirection}>Previous Direction</button>
                <button type="button" className="secondary-button" onClick={timerControls.onNextDirection}>Next Direction</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
