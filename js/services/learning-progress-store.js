import { STORAGE_KEYS } from '../config/storage-keys.js';
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
import { readStorageJson, removeStorageValue, writeStorageJson } from './browser-storage.js';

export function createLearningProgressStore({ storage } = {}) {
  function load() {
    return normalizeLearningProgress(readStorageJson(STORAGE_KEYS.learningProgress, createLearningProgress(), { storage }));
  }

  function save(progress) {
    const normalized = normalizeLearningProgress(progress);
    writeStorageJson(STORAGE_KEYS.learningProgress, normalized, { storage });
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

  function summary() {
    return summarizeLearningProgress(load());
  }

  function reset() {
    removeStorageValue(STORAGE_KEYS.learningProgress, { storage });
    return createLearningProgress();
  }

  return Object.freeze({ load, save, record, completeSession, setGoal, resetGoal, setTracking, summary, reset });
}