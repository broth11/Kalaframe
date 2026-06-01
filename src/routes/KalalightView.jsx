import { useEffect, useMemo, useRef, useState } from "react";
import { KalalightEdgeControls } from "../components/kalalight/KalalightEdgeControls.jsx";
import { KalalightToolbarRail } from "../components/kalalight/KalalightToolbarRail.jsx";
import { KalalightVisualizerStage } from "../components/kalalight/KalalightVisualizerStage.jsx";
import {
  formatKalalightInput,
  parseKalalightTime,
} from "../components/kalalight/kalalightTime.js";
import "../components/kalalight/kalalight.css";
import { useDisplayPublisher } from "../messaging/useDisplayPublisher.js";
import { playChime } from "../chime/playChime.js";
import {
  createIdleTimerState,
  endTimer,
  getProgress,
  getRemainingSeconds,
  pauseTimer,
  resumeTimer,
  shouldAutoFinish,
  startTimer,
} from "../timer/timerMath.js";
import { useTicker } from "../timer/useTicker.js";
import {
  DEFAULT_THEME_ID,
  visualizerPickerOptions,
} from "../visualizer/visualizerRegistry.js";

const INTENSITIES = ["low", "normal", "high"];

function createKalalightSetup({
  durationSeconds,
  selectedVisualizerId,
  intensity,
  chimeEnabled,
}) {
  return {
    id: "kalalight",
    durationSeconds: Math.max(0, Number(durationSeconds) || 0),
    title: "",
    directions: [],
    mode: "active",
    theme: selectedVisualizerId,
    visualIntensity: intensity,
    chimeEnabled,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    useCount: 0,
  };
}

export function KalalightView() {
  const [inputValue, setInputValue] = useState("00:00");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timerState, setTimerState] = useState(() => createIdleTimerState(0));
  const [selectedVisualizerId, setSelectedVisualizerId] = useState(
    () => visualizerPickerOptions[0]?.id ?? DEFAULT_THEME_ID,
  );
  const [intensity, setIntensity] = useState("normal");
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [toolbarPinned, setToolbarPinned] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const hideToolbarTimerRef = useRef(null);
  const lastChimedAtRef = useRef(null);

  const now = useTicker(250);
  const parsedSeconds = parseKalalightTime(inputValue);
  const isValidDuration = parsedSeconds > 0;
  const remainingSeconds = getRemainingSeconds(timerState, now);
  const progress = getProgress(timerState, now);
  const status = timerState.status === "finished"
    ? "ended"
    : timerState.status === "running"
      ? "running"
      : timerState.status === "paused"
        ? "paused"
        : isValidDuration
          ? "ready"
          : "idle";

  const activitySetup = useMemo(
    () => createKalalightSetup({
      durationSeconds,
      selectedVisualizerId,
      intensity,
      chimeEnabled,
    }),
    [durationSeconds, selectedVisualizerId, intensity, chimeEnabled],
  );

  useDisplayPublisher({
    activitySetup,
    timerState,
    manualDirectionIndex: 0,
  });

  function revealToolbar() {
    setToolbarVisible(true);
    window.clearTimeout(hideToolbarTimerRef.current);
    hideToolbarTimerRef.current = window.setTimeout(() => {
      setToolbarVisible(toolbarPinned);
    }, 2500);
  }

  useEffect(() => {
    return () => window.clearTimeout(hideToolbarTimerRef.current);
  }, []);

  useEffect(() => {
    if (shouldAutoFinish(timerState, now)) {
      const timeoutId = window.setTimeout(() => {
        setTimerState((current) => shouldAutoFinish(current, now) ? endTimer(current, now) : current);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [timerState, now]);

  useEffect(() => {
    if (
      timerState.status === "finished" &&
      chimeEnabled &&
      lastChimedAtRef.current !== timerState.finishedAt
    ) {
      lastChimedAtRef.current = timerState.finishedAt;
      playChime();
    }
  }, [timerState.status, timerState.finishedAt, chimeEnabled]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function updateInputFromSeconds(nextSeconds) {
    const safeSeconds = Math.max(0, Math.round(nextSeconds));
    setInputValue(safeSeconds === 0 ? "00:00" : formatKalalightInput(safeSeconds));
    setDurationSeconds(safeSeconds);
    setTimerState(createIdleTimerState(safeSeconds));
  }

  function handleInputChange(value) {
    setInputValue(value);
    if (timerState.status === "idle") {
      const nextSeconds = parseKalalightTime(value);
      setDurationSeconds(nextSeconds);
      setTimerState(createIdleTimerState(nextSeconds));
    }
  }

  function start() {
    const nextDuration = parseKalalightTime(inputValue);
    if (nextDuration <= 0) return;
    setDurationSeconds(nextDuration);
    setTimerState(startTimer(nextDuration));
    lastChimedAtRef.current = null;
  }

  function pauseOrResumeOrStart() {
    if (timerState.status === "running") {
      setTimerState((current) => pauseTimer(current));
      return;
    }
    if (timerState.status === "paused") {
      setTimerState((current) => resumeTimer(current));
      return;
    }
    start();
  }

  function reset() {
    if (durationSeconds > 0) {
      setTimerState(createIdleTimerState(durationSeconds));
      setInputValue(formatKalalightInput(durationSeconds));
    } else {
      updateInputFromSeconds(0);
    }
    lastChimedAtRef.current = null;
  }

  function addMinute() {
    if (timerState.status === "running" || timerState.status === "paused") {
      setTimerState((current) => ({ ...current, durationSeconds: current.durationSeconds + 60 }));
      setDurationSeconds((value) => value + 60);
      return;
    }
    if (timerState.status === "finished") {
      updateInputFromSeconds(60);
      return;
    }
    updateInputFromSeconds(parseKalalightTime(inputValue) + 60);
  }

  function subtractMinute() {
    if (timerState.status === "running" || timerState.status === "paused") {
      const nextDuration = Math.max(0, timerState.durationSeconds - 60);
      if (nextDuration <= 0 || remainingSeconds <= 60) {
        setDurationSeconds(0);
        setTimerState((current) => endTimer({ ...current, durationSeconds: Math.max(0, nextDuration) }));
        return;
      }
      setTimerState((current) => ({ ...current, durationSeconds: nextDuration }));
      setDurationSeconds(nextDuration);
      return;
    }
    if (timerState.status === "finished") return;
    updateInputFromSeconds(Math.max(0, parseKalalightTime(inputValue) - 60));
  }

  function cycleVisualizer(offset) {
    const index = visualizerPickerOptions.findIndex((item) => item.id === selectedVisualizerId);
    const safeIndex = index >= 0 ? index : 0;
    const nextIndex = (safeIndex + offset + visualizerPickerOptions.length) % visualizerPickerOptions.length;
    setSelectedVisualizerId(visualizerPickerOptions[nextIndex].id);
  }

  function cycleIntensity(offset) {
    setIntensity((current) => {
      const index = INTENSITIES.indexOf(current);
      const safeIndex = index >= 0 ? index : 1;
      return INTENSITIES[(safeIndex + offset + INTENSITIES.length) % INTENSITIES.length];
    });
  }

  function openProjector() {
    window.open("/display", "kalaframe-display", "popup=yes,width=1280,height=720")?.focus();
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      start();
    }
    if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const isInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      if (event.key === "ArrowLeft") cycleVisualizer(-1);
      if (event.key === "ArrowRight") cycleVisualizer(1);
      if (event.key === "ArrowUp") cycleIntensity(1);
      if (event.key === "ArrowDown") cycleIntensity(-1);
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        pauseOrResumeOrStart();
      }
      if (event.key === "Escape") reset();
      if (event.key === "+" || event.key === "=") addMinute();
      if (event.key === "-") subtractMinute();
      if (event.key.toLowerCase() === "m") setChimeEnabled((value) => !value);
      if (event.key.toLowerCase() === "f") toggleFullscreen();
      if (event.key.toLowerCase() === "p") openProjector();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main className="kalalight-shell" onPointerMove={revealToolbar} onTouchStart={revealToolbar}>
      <KalalightVisualizerStage
        selectedVisualizerId={selectedVisualizerId}
        intensity={intensity}
        progress={progress}
        remainingSeconds={remainingSeconds}
        durationSeconds={durationSeconds}
        status={status}
        inputValue={inputValue}
        isValidDuration={isValidDuration}
        onInputChange={handleInputChange}
        onInputKeyDown={handleInputKeyDown}
        onStart={start}
      />
      <KalalightEdgeControls
        onPreviousVisualizer={() => cycleVisualizer(-1)}
        onNextVisualizer={() => cycleVisualizer(1)}
        onIncreaseIntensity={() => cycleIntensity(1)}
        onDecreaseIntensity={() => cycleIntensity(-1)}
      />
      <KalalightToolbarRail
        visible={toolbarVisible || toolbarPinned}
        chimeEnabled={chimeEnabled}
        isFullscreen={isFullscreen}
        onPointerEnter={() => {
          setToolbarPinned(true);
          setToolbarVisible(true);
        }}
        onPointerLeave={() => {
          setToolbarPinned(false);
          revealToolbar();
        }}
        onFocus={() => {
          setToolbarPinned(true);
          setToolbarVisible(true);
        }}
        onBlur={() => {
          setToolbarPinned(false);
          revealToolbar();
        }}
        onSubtractMinute={subtractMinute}
        onAddMinute={addMinute}
        onToggleChime={() => setChimeEnabled((value) => !value)}
        onOpenProjector={openProjector}
        onToggleFullscreen={toggleFullscreen}
        onReset={reset}
      />
    </main>
  );
}
