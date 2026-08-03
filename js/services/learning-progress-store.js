import { STORAGE_KEYS } from '../config/storage-keys.js';
import { createLearningBackupFile, verifyLearningBackup } from '../core/learning-backup.js';
import { createLearningDeviceBackupFile } from '../core/learning-device-backup.js';
import {
  appendLearningSession,
  clearLearningGoal,
  configureLearningGoal,
  createLearningProgress,
  createLearningSession,
  normalizeLearningProgress,
  recordLearningAnswer,
  setLongitudinalTracking,
  summarizeLearningProgress
} from '../core/learning-progress.js';
import {
  adoptLocalLearningProfile,
  createLearningProfileCollection,
  createLearningProfileId,
  listLearningProfiles,
  normalizeLearningPilotName,
  normalizeLearningProfileCollection,
  readLearningProfile,
  removeLearningProfile,
  removeLearningProfileById,
  upsertLearningProfile
} from '../core/learning-profiles.js';
import { getPilotName } from './pilot-profile-store.js';
import { hasStorageValue, readStorageJson, removeStorageValue, writeStorageJson } from './browser-storage.js';

export function createLearningProgressStore({ storage, resolvePilotName = getPilotName } = {}) {
  const options = { storage };

  function activePilotName() {
    return String(resolvePilotName?.() || '').trim().slice(0, 48);
  }

  function writeCollection(collection) {
    const normalized = normalizeLearningProfileCollection(collection);
    writeStorageJson(STORAGE_KEYS.learningProfiles, normalized, options);
    return normalized;
  }

  function loadCollection() {
    let collection = normalizeLearningProfileCollection(
      readStorageJson(STORAGE_KEYS.learningProfiles, createLearningProfileCollection(), options)
    );

    if (hasStorageValue(STORAGE_KEYS.learningProgress, options)) {
      const legacy = normalizeLearningProgress(
        readStorageJson(STORAGE_KEYS.learningProgress, createLearningProgress(), options)
      );
      collection = upsertLearningProfile(collection, {
        pilotName: '',
        progress: legacy,
        updatedAt: new Date().toISOString()
      });
      if (writeStorageJson(STORAGE_KEYS.learningProfiles, collection, options)) {
        removeStorageValue(STORAGE_KEYS.learningProgress, options);
      }
    }

    const pilotName = activePilotName();
    const pilotId = createLearningProfileId(pilotName);
    const shouldAdopt = pilotId !== 'local' && !collection.profiles[pilotId] && Boolean(collection.profiles.local);
    if (shouldAdopt) collection = writeCollection(adoptLocalLearningProfile(collection, pilotName));
    return collection;
  }

  function load() {
    return readLearningProfile(loadCollection(), activePilotName());
  }

  function save(progress) {
    const normalized = normalizeLearningProgress(progress);
    writeCollection(upsertLearningProfile(loadCollection(), {
      pilotName: activePilotName(),
      progress: normalized,
      updatedAt: new Date().toISOString()
    }));
    return normalized;
  }

  function record(answer) {
    return save(recordLearningAnswer(load(), answer));
  }

  function completeSession({ baseline, mode, result, completedAt } = {}) {
    const progress = load();
    const session = createLearningSession(progress, { baseline, mode, result, completedAt });
    if (!session) return { progress, session: null };
    const saved = save(appendLearningSession(progress, session));
    return { progress: saved, session };
  }

  function setGoal(goal) {
    return save(configureLearningGoal(load(), goal));
  }

  function resetGoal() {
    return save(clearLearningGoal(load()));
  }

  function setTracking(enabled) {
    return save(setLongitudinalTracking(load(), enabled));
  }

  function profileInfo() {
    const collection = loadCollection();
    const pilotName = activePilotName();
    const id = createLearningProfileId(pilotName);
    const safePilotName = normalizeLearningPilotName(pilotName);
    const profiles = listLearningProfiles(collection, { activePilotName: pilotName });
    if (!profiles.some((profile) => profile.active)) {
      const activeSummary = summarizeLearningProgress(readLearningProfile(collection, pilotName));
      profiles.unshift({
        id,
        pilotName: safePilotName,
        updatedAt: '',
        active: true,
        attempts: activeSummary.attempts,
        correct: activeSummary.correct,
        accuracy: activeSummary.accuracy,
        bestStreak: activeSummary.bestStreak,
        sessions: activeSummary.sessionCount,
        goalRate: 0,
        focusCategory: activeSummary.focus[0]?.name || '',
        strengthCategory: activeSummary.strength?.name || ''
      });
    }
    return { id, pilotName: safePilotName, profiles };
  }

  function summary() {
    const profile = profileInfo();
    return {
      ...summarizeLearningProgress(load()),
      profileId: profile.id,
      profileName: profile.pilotName,
      profileCount: profile.profiles.length,
      availableProfiles: profile.profiles
    };
  }

  function createBackup({ exportedAt } = {}) {
    return createLearningBackupFile(load(), {
      pilotName: activePilotName(),
      exportedAt
    });
  }

  function createDeviceBackup({ exportedAt } = {}) {
    return createLearningDeviceBackupFile(loadCollection(), { exportedAt });
  }

  function importBackup(source) {
    const verified = verifyLearningBackup(source, { expectedPilotName: activePilotName() });
    const progress = save(verified.progress);
    return { ...verified, progress };
  }

  function removeProfile(profileId) {
    const activeProfileId = createLearningProfileId(activePilotName());
    const result = removeLearningProfileById(loadCollection(), profileId, {
      protectedProfileId: activeProfileId
    });
    if (!result.removed) throw new Error('No se encontró el perfil pedagógico solicitado.');

    if (Object.keys(result.collection.profiles).length) writeCollection(result.collection);
    else removeStorageValue(STORAGE_KEYS.learningProfiles, options);
    return {
      removed: result.removed,
      profiles: listLearningProfiles(result.collection, { activePilotName: activePilotName() })
    };
  }

  function reset() {
    const collection = removeLearningProfile(loadCollection(), activePilotName());
    if (Object.keys(collection.profiles).length) writeCollection(collection);
    else removeStorageValue(STORAGE_KEYS.learningProfiles, options);
    return createLearningProgress();
  }

  return Object.freeze({
    load,
    save,
    record,
    completeSession,
    setGoal,
    resetGoal,
    setTracking,
    summary,
    profileInfo,
    createBackup,
    createDeviceBackup,
    importBackup,
    removeProfile,
    reset
  });
}
