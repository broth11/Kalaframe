import { loadPreferences } from "../storage/preferencesStore.js";
import { DEFAULT_THEME_ID, normalizeThemeId } from "../visualizer/visualizerRegistry.js";

const VISUAL_INTENSITIES = new Set(["low", "normal", "high"]);

function normalizeVisualIntensity(value) {
  return VISUAL_INTENSITIES.has(value) ? value : "normal";
}

export function createDirection(text = "", durationSeconds = null) {
  return {
    id: crypto.randomUUID(),
    text,
    durationSeconds,
  };
}

export function createDefaultActivitySetup() {
  const preferences = loadPreferences();

  return {
    id: crypto.randomUUID(),
    durationSeconds: preferences.lastDurationSeconds ?? 10 * 60,
    title: "",
    directions: [],
    mode: preferences.lastMode ?? "active",
    theme: normalizeThemeId(preferences.lastTheme ?? DEFAULT_THEME_ID),
    visualIntensity: normalizeVisualIntensity(preferences.visualIntensity),
    chimeEnabled: preferences.chimeEnabled ?? true,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    useCount: 0,
  };
}

export function normalizeActivitySetup(activitySetup) {
  return {
    id: activitySetup.id ?? crypto.randomUUID(),
    durationSeconds: Math.max(1, Number(activitySetup.durationSeconds) || 600),
    title: activitySetup.title ?? "",
    directions: Array.isArray(activitySetup.directions)
      ? activitySetup.directions.map((direction) => ({
          id: direction.id ?? crypto.randomUUID(),
          text: direction.text ?? "",
          durationSeconds:
            Number.isFinite(Number(direction.durationSeconds)) &&
            Number(direction.durationSeconds) > 0
              ? Number(direction.durationSeconds)
              : null,
        }))
      : [],
    mode: activitySetup.mode ?? "active",
    theme: normalizeThemeId(activitySetup.theme ?? DEFAULT_THEME_ID),
    visualIntensity: normalizeVisualIntensity(activitySetup.visualIntensity),
    chimeEnabled: Boolean(activitySetup.chimeEnabled),
    createdAt: activitySetup.createdAt ?? new Date().toISOString(),
    lastUsedAt: activitySetup.lastUsedAt ?? null,
    useCount: Number(activitySetup.useCount) || 0,
  };
}

export function cloneActivityForReuse(activitySetup) {
  const normalized = normalizeActivitySetup(activitySetup);

  return {
    ...normalized,
    id: crypto.randomUUID(),
    directions: normalized.directions.map((direction) => ({
      ...direction,
      id: crypto.randomUUID(),
    })),
    lastUsedAt: null,
  };
}

export function createHeroExampleActivity() {
  return {
    id: crypto.randomUUID(),
    durationSeconds: 25 * 60,
    title: "Group Problem Solving",
    directions: [
      createDirection("Brainstorm individually", 5 * 60),
      createDirection("Discuss in your group", 10 * 60),
      createDirection("Group A shares", 5 * 60),
      createDirection("Final reflection", 5 * 60),
    ],
    mode: "active",
    theme: "dots",
    visualIntensity: "normal",
    chimeEnabled: true,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    useCount: 0,
  };
}
