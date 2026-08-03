import { STORAGE_KEYS } from '../config/storage-keys.js';
import { defaultSettings, normalizeSettings } from '../core/settings.js';
import {
  hasStorageValue,
  readStorageJson,
  removeStorageValue,
  writeStorageJson
} from './browser-storage.js';

function warn(message) {
  return (error) => console.warn(message, error);
}

/** @returns {object|null} Partida local guardada o null si no existe. */
export function loadGame() {
  return readStorageJson(STORAGE_KEYS.savedGame, null, {
    onError: warn('No fue posible leer la partida guardada.')
  });
}

/**
 * Guarda una copia JSON del estado sin transmitirla fuera del navegador.
 * @param {object} state Estado actual.
 * @returns {boolean} Indica si el guardado tuvo éxito.
 */
export function saveGame(state) {
  return writeStorageJson(STORAGE_KEYS.savedGame, state, {
    onError: warn('No fue posible guardar la partida.')
  });
}

export function clearGame() {
  return removeStorageValue(STORAGE_KEYS.savedGame, {
    onError: warn('No fue posible borrar la partida guardada.')
  });
}

export function loadSettings() {
  const saved = readStorageJson(STORAGE_KEYS.settings, defaultSettings);
  return normalizeSettings(saved);
}

export function saveSettings(settings) {
  return writeStorageJson(STORAGE_KEYS.settings, normalizeSettings(settings));
}

export function hasSavedGame() {
  return hasStorageValue(STORAGE_KEYS.savedGame);
}
