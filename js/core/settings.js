export const defaultSettings = Object.freeze({
  sound: true,
  musicVolume: 1,
  effectsVolume: 1,
  reducedMotion: false,
  highContrast: false,
  largeText: false
});

export function normalizeVolume(value) {
  return Math.max(0, Math.min(1, Number(value ?? 1)));
}

export function normalizeSettings(value = {}) {
  const candidate = value && typeof value === 'object' ? value : {};
  return {
    ...defaultSettings,
    ...candidate,
    sound: candidate.sound === undefined ? defaultSettings.sound : Boolean(candidate.sound),
    musicVolume: normalizeVolume(candidate.musicVolume),
    effectsVolume: normalizeVolume(candidate.effectsVolume),
    reducedMotion: Boolean(candidate.reducedMotion),
    highContrast: Boolean(candidate.highContrast),
    largeText: Boolean(candidate.largeText)
  };
}
