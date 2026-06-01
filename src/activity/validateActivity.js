import {
  allDirectionsHaveDurations,
  anyDirectionsHaveDurations,
  getDirectionTotalSeconds,
} from "./directionMath.js";
import { formatTime } from "../timer/formatTime.js";

export function getDirectionValidation(activitySetup) {
  const directions = activitySetup.directions ?? [];

  if (directions.length === 0) {
    return { type: "none", message: "", canAutoAdvance: false };
  }

  if (!anyDirectionsHaveDurations(directions)) {
    return {
      type: "manual",
      message: "Directions have no durations. Use Previous/Next to advance them manually.",
      canAutoAdvance: false,
    };
  }

  if (!allDirectionsHaveDurations(directions)) {
    return {
      type: "mixed",
      message:
        "Some directions have durations and others do not. This timer will use manual direction controls.",
      canAutoAdvance: false,
    };
  }

  const directionTotal = getDirectionTotalSeconds(directions);
  const total = Number(activitySetup.durationSeconds);

  if (directionTotal === total) {
    return { type: "ok", message: "", canAutoAdvance: true };
  }

  if (directionTotal < total) {
    return {
      type: "short",
      canAutoAdvance: true,
      message: `Directions add up to ${formatTime(directionTotal)}, but the main timer is ${formatTime(total)}. The final direction will stay on screen for the remaining ${formatTime(total - directionTotal)}.`,
    };
  }

  return {
    type: "long",
    canAutoAdvance: true,
    message: `Directions add up to ${formatTime(directionTotal)}, but the main timer is ${formatTime(total)}. The timer will end before all directions are complete.`,
  };
}
