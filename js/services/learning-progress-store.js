import { STORAGE_KEYS } from '../config/storage-keys.js';
import { createLearningProgress, normalizeLearningProgress, recordLearningAnswer, summarizeLearningProgress } from '../core/learning-progress.js';
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

  function summary() {
    return summarizeLearningProgress(load());
  }

  function reset() {
    removeStorageValue(STORAGE_KEYS.learningProgress, { storage });
    return createLearningProgress();
  }

  return Object.freeze({ load, save, record, summary, reset });
}
