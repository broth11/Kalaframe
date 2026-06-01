export function getDirectionTotalSeconds(directions) {
  return directions.reduce((total, direction) => {
    const value = Number(direction.durationSeconds);
    return Number.isFinite(value) && value > 0 ? total + value : total;
  }, 0);
}

export function allDirectionsHaveDurations(directions) {
  return (
    directions.length > 0 &&
    directions.every((direction) => {
      const value = Number(direction.durationSeconds);
      return Number.isFinite(value) && value > 0;
    })
  );
}

export function anyDirectionsHaveDurations(directions) {
  return directions.some((direction) => {
    const value = Number(direction.durationSeconds);
    return Number.isFinite(value) && value > 0;
  });
}

export function getCurrentDirectionByElapsed(directions, elapsedSeconds) {
  if (!directions.length) {
    return { direction: null, index: -1, stepRemainingSeconds: null };
  }

  if (!allDirectionsHaveDurations(directions)) {
    return {
      direction: directions[0],
      index: 0,
      stepRemainingSeconds: null,
    };
  }

  let boundary = 0;

  for (let index = 0; index < directions.length; index += 1) {
    const direction = directions[index];
    const duration = Number(direction.durationSeconds);
    const nextBoundary = boundary + duration;

    if (elapsedSeconds < nextBoundary) {
      return {
        direction,
        index,
        stepRemainingSeconds: Math.max(0, Math.ceil(nextBoundary - elapsedSeconds)),
      };
    }

    boundary = nextBoundary;
  }

  const finalIndex = directions.length - 1;
  return {
    direction: directions[finalIndex],
    index: finalIndex,
    stepRemainingSeconds: null,
  };
}

export function getManualDirection(directions, manualDirectionIndex) {
  if (!directions.length) {
    return { direction: null, index: -1, stepRemainingSeconds: null };
  }

  const safeIndex = Math.min(
    Math.max(0, Number(manualDirectionIndex) || 0),
    directions.length - 1,
  );

  return {
    direction: directions[safeIndex],
    index: safeIndex,
    stepRemainingSeconds: null,
  };
}

export function getCurrentDirectionState({
  directions,
  elapsedSeconds,
  manualDirectionIndex,
}) {
  if (allDirectionsHaveDurations(directions)) {
    return getCurrentDirectionByElapsed(directions, elapsedSeconds);
  }

  return getManualDirection(directions, manualDirectionIndex);
}
