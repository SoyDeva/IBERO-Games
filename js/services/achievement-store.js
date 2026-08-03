import { STORAGE_KEYS } from '../config/storage-keys.js';
import { ACHIEVEMENTS, normalizeAchievements } from '../core/achievements.js';
import { readStorageJson, writeStorageJson } from './browser-storage.js';

export function createAchievementStore({ storage } = {}) {
  const options = { storage };

  function load() {
    return normalizeAchievements(readStorageJson(STORAGE_KEYS.achievements, [], options));
  }

  function unlock(id) {
    if (!ACHIEVEMENTS[id]) return false;
    const unlocked = load();
    if (unlocked.includes(id)) return false;
    unlocked.push(id);
    writeStorageJson(STORAGE_KEYS.achievements, unlocked, options);
    return true;
  }

  return { load, unlock };
}
