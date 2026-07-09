export const INTENSITY_CONTRACT = {
  low: { countScale: 0.4, speedScale: 0.45, saturation: 0.6, extras: false },
  normal: { countScale: 1, speedScale: 1, saturation: 1, extras: false },
  high: { countScale: 1.85, speedScale: 1.8, saturation: 1.15, extras: true },
};

export function resolveIntensity(mode, visualIntensity) {
  const key = mode === "exam" ? "low" : visualIntensity;
  return INTENSITY_CONTRACT[key] ?? INTENSITY_CONTRACT.normal;
}

export function tintForIntensity(color, intensity, mutedBase = [55, 65, 72]) {
  const amount = intensity === INTENSITY_CONTRACT.low ? 0.4 : 0;
  const muted = color.map((channel, index) => channel + (mutedBase[index] - channel) * amount);
  const luminance = muted[0] * 0.2126 + muted[1] * 0.7152 + muted[2] * 0.0722;
  return muted.map((channel) => Math.round(Math.min(255, Math.max(
    0,
    luminance + (channel - luminance) * intensity.saturation,
  ))));
}
