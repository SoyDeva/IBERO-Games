import { STORAGE_KEYS } from '../config/storage-keys.js';
import { normalizeEconomy } from '../core/economy.js';
import { readStorageJson, writeStorageJson } from './browser-storage.js';

export function createEconomyStore({ skins = {}, trails = {}, storage } = {}) {
  const options = { storage };

  function load() {
    const saved = readStorageJson(STORAGE_KEYS.economy, {}, options);
    return normalizeEconomy(saved, { skins, trails });
  }

  function save(economy) {
    const normalized = normalizeEconomy(economy, { skins, trails });
    writeStorageJson(STORAGE_KEYS.economy, normalized, options);
    return normalized;
  }

  return { load, save };
}
