const SAVE_KEY = 'mision-nebula-save-v1';
const SETTINGS_KEY = 'mision-nebula-settings-v1';

export const defaultSettings = Object.freeze({ sound: true, musicVolume: 1, effectsVolume: 1, reducedMotion: false, highContrast: false, largeText: false });

/** @returns {object|null} Partida local guardada o null si no existe. */
export function loadGame() {
  try {
    const value = localStorage.getItem(SAVE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('No fue posible leer la partida guardada.', error);
    return null;
  }
}

/**
 * Guarda una copia JSON del estado sin transmitirla fuera del navegador.
 * @param {object} state Estado actual.
 * @returns {boolean} Indica si el guardado tuvo éxito.
 */
export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('No fue posible guardar la partida.', error);
    return false;
  }
}

export function clearGame() {
  localStorage.removeItem(SAVE_KEY);
}

export function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch (error) {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function hasSavedGame() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}
