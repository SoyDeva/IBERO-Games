import { STORAGE_KEYS } from '../config/storage-keys.js';
import {
  applyLearningRepair,
  createLearningRepairOriginalFile,
  createLearningRepairPreview
} from '../core/learning-repair.js';
import { readStorageValue, removeStorageValue, writeStorageJson } from './browser-storage.js';
import { getPilotName } from './pilot-profile-store.js';
import { createStorageDiagnosticsStore } from './storage-diagnostics-store.js';

export function createLearningRepairStore({
  storage,
  resolvePilotName = getPilotName,
  now = () => new Date().toISOString()
} = {}) {
  const options = { storage };
  const diagnostics = createStorageDiagnosticsStore({ storage, now });

  function pilotName() {
    return String(resolvePilotName?.() || '').trim().slice(0, 48);
  }

  function rawSource() {
    return readStorageValue(STORAGE_KEYS.learningProfiles, options);
  }

  function preview() {
    return createLearningRepairPreview(rawSource(), { activePilotName: pilotName() });
  }

  function createOriginalFile() {
    return createLearningRepairOriginalFile(rawSource(), { createdAt: now() });
  }

  function applyRepair(expectedFingerprint, { originalDownloaded = false } = {}) {
    if (!originalDownloaded) {
      throw new Error('Descarga primero el contenido original antes de guardar la reparación.');
    }
    const diagnostic = diagnostics.diagnose();
    if (!diagnostic.readable || !diagnostic.writable) {
      throw new Error('El navegador no permite leer y guardar la reparación de forma segura.');
    }
    const result = applyLearningRepair(rawSource(), expectedFingerprint, {
      activePilotName: pilotName()
    });
    if (!writeStorageJson(STORAGE_KEYS.learningProfiles, result.collection, options)) {
      throw new Error('El navegador bloqueó el guardado. El contenido original no fue reemplazado.');
    }
    removeStorageValue(STORAGE_KEYS.learningRecovery, options);
    return {
      repaired: true,
      recoveredCount: result.preview.recoveredCount,
      droppedCount: result.preview.droppedCount,
      profiles: result.preview.profiles,
      diagnostic: diagnostics.diagnose()
    };
  }

  return Object.freeze({ preview, createOriginalFile, applyRepair });
}
