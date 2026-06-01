import { useMemo } from "react";
import { createDefaultActivitySetup } from "../activity/activityModel.js";
import { getCurrentDirectionState } from "../activity/directionMath.js";
import { ProjectorDisplay } from "../display/ProjectorDisplay.jsx";
import { DISPLAY_STALE_NOTICE_MS } from "../messaging/displaySync.js";
import { useDisplaySubscriber } from "../messaging/useDisplaySubscriber.js";
import {
  createIdleTimerState,
  getElapsedSeconds,
  getProgress,
  getRemainingSeconds,
} from "../timer/timerMath.js";
import { useTicker } from "../timer/useTicker.js";

export function ProjectorView() {
  const { snapshot, lastReceivedAt } = useDisplaySubscriber();
  const now = useTicker(250);

  const fallbackActivity = useMemo(() => createDefaultActivitySetup(), []);

  const activitySetup = snapshot?.activitySetup ?? fallbackActivity;
  const timerState =
    snapshot?.timerState ?? createIdleTimerState(activitySetup.durationSeconds);
  const manualDirectionIndex = snapshot?.manualDirectionIndex ?? 0;

  const remainingSeconds = getRemainingSeconds(timerState, now);
  const elapsedSeconds = getElapsedSeconds(timerState, now);
  const progress = getProgress(timerState, now);

  const currentDirectionState = getCurrentDirectionState({
    directions: activitySetup.directions,
    elapsedSeconds,
    manualDirectionIndex,
  });

  const isStale =
    lastReceivedAt != null && now - lastReceivedAt > DISPLAY_STALE_NOTICE_MS;

  return (
    <ProjectorDisplay
      activitySetup={activitySetup}
      timerState={timerState}
      remainingSeconds={remainingSeconds}
      currentDirection={currentDirectionState.direction}
      stepRemainingSeconds={currentDirectionState.stepRemainingSeconds}
      progress={progress}
      isStale={isStale}
    />
  );
}
