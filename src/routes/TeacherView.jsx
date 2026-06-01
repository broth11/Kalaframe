import { useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultActivitySetup,
  normalizeActivitySetup,
} from "../activity/activityModel.js";
import { getDirectionValidation } from "../activity/validateActivity.js";
import { getCurrentDirectionState } from "../activity/directionMath.js";
import { TimerSetupForm } from "../components/TimerSetupForm.jsx";
import { HistoryMenu } from "../components/HistoryPanel.jsx";
import { useDisplayPublisher } from "../messaging/useDisplayPublisher.js";
import { saveActivityHistoryItem } from "../storage/activityHistoryStore.js";
import { savePreferences } from "../storage/preferencesStore.js";
import { playChime } from "../chime/playChime.js";
import {
  adjustTimerDuration,
  createIdleTimerState,
  endTimer,
  getElapsedSeconds,
  getProgress,
  getRemainingSeconds,
  pauseTimer,
  resetTimer,
  resumeTimer,
  shouldAutoFinish,
  startTimer,
} from "../timer/timerMath.js";
import { useTicker } from "../timer/useTicker.js";

export function TeacherView() {
  const [activitySetup, setActivitySetup] = useState(() => createDefaultActivitySetup());
  const [timerState, setTimerState] = useState(() =>
    createIdleTimerState(activitySetup.durationSeconds),
  );
  const [manualDirectionIndex, setManualDirectionIndex] = useState(0);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [syncWarning, setSyncWarning] = useState("");
  const [setupStep, setSetupStep] = useState("time");
  const [restoreMessage, setRestoreMessage] = useState("");
  const lastFinishedTimerIdRef = useRef(null);

  const now = useTicker(250);

  useDisplayPublisher({
    activitySetup,
    timerState,
    manualDirectionIndex,
  });

  useEffect(() => {
    if (shouldAutoFinish(timerState, now)) {
      const timeoutId = window.setTimeout(() => {
        setTimerState((current) =>
          shouldAutoFinish(current, now) ? endTimer(current, now) : current,
        );
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [timerState, now]);

  useEffect(() => {
    if (
      timerState.status === "finished" &&
      activitySetup.chimeEnabled &&
      lastFinishedTimerIdRef.current !== activitySetup.id
    ) {
      lastFinishedTimerIdRef.current = activitySetup.id;
      playChime();
    }
  }, [timerState.status, activitySetup.chimeEnabled, activitySetup.id]);

  const validation = useMemo(
    () => getDirectionValidation(activitySetup),
    [activitySetup],
  );

  const directionOverBySeconds = useMemo(() => {
    if (activitySetup.directions.length < 2) return 0;
    const nonFinalTotal = activitySetup.directions
      .slice(0, -1)
      .reduce((total, direction) => total + (Number(direction.durationSeconds) || 0), 0);
    return Math.max(0, nonFinalTotal - activitySetup.durationSeconds);
  }, [activitySetup]);

  const remainingSeconds = getRemainingSeconds(timerState, now);
  const elapsedSeconds = getElapsedSeconds(timerState, now);
  const progress = getProgress(timerState, now);
  const canOpenDisplay = timerState.status !== "idle";

  const currentDirectionState = getCurrentDirectionState({
    directions: activitySetup.directions,
    elapsedSeconds,
    manualDirectionIndex,
  });

  function updateActivitySetup(update) {
    setActivitySetup((current) => {
      const next = typeof update === "function" ? update(current) : update;

      setTimerState((currentTimer) =>
        currentTimer.status === "idle"
          ? { ...currentTimer, durationSeconds: next.durationSeconds }
          : currentTimer,
      );

      return next;
    });
  }

  function openDisplay() {
    const displayWindow = window.open(
      "/display",
      "kalaframe-display",
      "popup=yes,width=1280,height=720",
    );

    if (!displayWindow) {
      setSyncWarning("Popup blocked. Allow popups or manually open /display.");
    } else {
      setSyncWarning("");
      displayWindow.focus();
    }
  }

  async function handleStart(nextSetup) {
    const normalized = normalizeActivitySetup(nextSetup);

    savePreferences({
      lastMode: normalized.mode,
      lastTheme: normalized.theme,
      visualIntensity: normalized.visualIntensity,
      chimeEnabled: normalized.chimeEnabled,
      lastDurationSeconds: normalized.durationSeconds,
    });

    setActivitySetup(normalized);
    setTimerState(startTimer(normalized.durationSeconds));
    setManualDirectionIndex(0);
    setSetupStep("review");
    setRestoreMessage("");
    lastFinishedTimerIdRef.current = null;

    try {
      await saveActivityHistoryItem(normalized);
      setHistoryReloadKey((value) => value + 1);
    } catch (error) {
      console.warn("Could not save activity history:", error);
    }
  }

  function handleReset() {
    setTimerState(resetTimer(activitySetup.durationSeconds));
    setManualDirectionIndex(0);
    lastFinishedTimerIdRef.current = null;
  }

  function handleRestore(restoredSetup) {
    const normalized = normalizeActivitySetup(restoredSetup);
    setActivitySetup(normalized);
    setTimerState(resetTimer(normalized.durationSeconds));
    setManualDirectionIndex(0);
    setSetupStep("review");
    setRestoreMessage("Activity restored. Review it before starting.");
    lastFinishedTimerIdRef.current = null;
  }

  function handlePreviousDirection() {
    setManualDirectionIndex((index) => Math.max(0, index - 1));
  }

  function handleNextDirection() {
    setManualDirectionIndex((index) =>
      Math.min(activitySetup.directions.length - 1, index + 1),
    );
  }

  function handleAddMinute() {
    setTimerState((current) => adjustTimerDuration(current, 60));
    setActivitySetup((current) => ({
      ...current,
      durationSeconds: current.durationSeconds + 60,
    }));
  }

  function handleSubtractMinute() {
    setTimerState((current) => adjustTimerDuration(current, -60));
    setActivitySetup((current) => ({
      ...current,
      durationSeconds: Math.max(60, current.durationSeconds - 60),
    }));
  }

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div>
          <h1>Kalaframe</h1>
        </div>
        <div className="header-actions">
          <HistoryMenu reloadKey={historyReloadKey} onRestore={handleRestore} />
          <button
            type="button"
            className="secondary-button"
            onClick={openDisplay}
            disabled={!canOpenDisplay}
            title={!canOpenDisplay ? "Start the timer before opening the projector display." : undefined}
            aria-label={!canOpenDisplay ? "Start the timer before opening the projector display." : "Open Projector Display"}
          >
            Open Projector Display
          </button>
        </div>
      </header>

      {syncWarning && <p className="top-warning">{syncWarning}</p>}

      <section className="teacher-console">
        <TimerSetupForm
          activitySetup={activitySetup}
          setActivitySetup={updateActivitySetup}
          activeStep={setupStep}
          setActiveStep={setSetupStep}
          restoreMessage={restoreMessage}
          validation={validation}
          previewState={{
            timerState,
            remainingSeconds,
            currentDirectionState,
            progress,
          }}
          timerControls={{
            timerState,
            remainingSeconds,
            currentDirectionState,
            hasDirections: activitySetup.directions.length > 0,
            canAutoAdvance: validation.canAutoAdvance,
            onStart: () => {
              if (directionOverBySeconds <= 0) handleStart(activitySetup);
            },
            onPause: () => setTimerState((current) => pauseTimer(current)),
            onResume: () => setTimerState((current) => resumeTimer(current)),
            onReset: handleReset,
            onEnd: () => setTimerState((current) => endTimer(current)),
            onAddMinute: handleAddMinute,
            onSubtractMinute: handleSubtractMinute,
            onPreviousDirection: handlePreviousDirection,
            onNextDirection: handleNextDirection,
          }}
          onStart={() => {
            if (directionOverBySeconds <= 0) handleStart(activitySetup);
          }}
          onOpenDisplay={openDisplay}
          canOpenDisplay={canOpenDisplay}
        />
      </section>
    </main>
  );
}
