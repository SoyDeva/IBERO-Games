import { STORAGE_KEYS } from '../config/storage-keys.js';
import { cleanPilotName, normalizePilotProfile, parseRememberedPilot } from '../core/pilot-profile.js';
import { readStorageJson, removeStorageValue, writeStorageJson } from './browser-storage.js';

export function createPilotProfileStore({ storage } = {}) {
  let activeSession = null;
  const options = { storage };

  function loadRemembered() {
    return parseRememberedPilot(readStorageJson(STORAGE_KEYS.pilotProfile, {}, options));
  }

  function getSession() {
    return activeSession || loadRemembered();
  }

  function getName() {
    return getSession()?.name || '';
  }

  function save(profile, remember) {
    activeSession = normalizePilotProfile(profile, remember);
    if (remember) writeStorageJson(STORAGE_KEYS.pilotProfile, activeSession, options);
    else removeStorageValue(STORAGE_KEYS.pilotProfile, options);
    return activeSession;
  }

  function clear() {
    activeSession = null;
    removeStorageValue(STORAGE_KEYS.pilotProfile, options);
  }

  return { loadRemembered, getSession, getName, save, clear };
}

const pilotProfileStore = createPilotProfileStore();

export const loadRememberedPilot = () => pilotProfileStore.loadRemembered();
export const getPilotSession = () => pilotProfileStore.getSession();
export const getPilotName = () => pilotProfileStore.getName();
export const savePilot = (profile, remember) => pilotProfileStore.save(profile, remember);
export const clearPilotSession = () => pilotProfileStore.clear();
export { cleanPilotName };
