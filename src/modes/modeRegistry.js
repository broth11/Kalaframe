export const modeRegistry = {
  calm: {
    id: "calm",
    label: "Calm",
    description: "Quiet work, settling, and low-energy activities.",
    intent: {
      energy: "low",
      motion: "slow",
      visualComplexity: "low",
      urgency: "none",
      allowPulse: false,
      prioritizeReadability: true,
    },
    defaults: {
      chimeEnabled: false,
      reducedMotion: false,
      intensity: "low",
    },
  },

  active: {
    id: "active",
    label: "Active",
    description: "Discussion, group work, transitions, and normal classroom energy.",
    intent: {
      energy: "medium",
      motion: "moderate",
      visualComplexity: "medium",
      urgency: "subtle",
      allowPulse: true,
      prioritizeReadability: true,
    },
    defaults: {
      chimeEnabled: true,
      reducedMotion: false,
      intensity: "medium",
    },
  },

  exam: {
    id: "exam",
    label: "Exam",
    description: "Tests, quizzes, and silent writing.",
    intent: {
      energy: "minimal",
      motion: "minimal",
      visualComplexity: "minimal",
      urgency: "none",
      allowPulse: false,
      prioritizeReadability: true,
    },
    defaults: {
      chimeEnabled: false,
      reducedMotion: true,
      intensity: "low",
    },
    constraints: {
      lockReducedMotion: true,
      disableStrongPulse: true,
    },
  },
};

export const modeOptions = Object.values(modeRegistry);

export function getMode(modeId) {
  return modeRegistry[modeId] ?? modeRegistry.active;
}
