import { normalizeThemeId } from "../visualizer/visualizerRegistry.js";

const PREFERENCES_KEY = "kalaframe.preferences";

export function loadPreferences() {
  const raw = localStorage.getItem(PREFERENCES_KEY);
  if (!raw) return {};

  try {
    const preferences = JSON.parse(raw);
    return {
      ...preferences,
      lastTheme: normalizeThemeId(preferences.lastTheme),
    };
  } catch {
    return {};
  }
}

export function savePreferences(patch) {
  const current = loadPreferences();
  const next = {
    ...current,
    ...patch,
    lastTheme: normalizeThemeId(patch.lastTheme ?? current.lastTheme),
  };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  return next;
}
