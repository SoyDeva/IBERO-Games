import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEYS } from '../js/config/storage-keys.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';
import { createLearningProgressStore } from '../js/services/learning-progress-store.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test('cambia de perfil pedagógico al cambiar de piloto', () => {
  const storage = createMemoryStorage();
  let pilotName = 'Luna';
  const store = createLearningProgressStore({ storage, resolvePilotName: () => pilotName });

  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });
  pilotName = 'Nova';
  assert.equal(store.load().totals.attempts, 0);
  store.record({ question: { category: 'Matemáticas' }, correct: false, mode: 'practice' });

  pilotName = 'Luna';
  assert.equal(store.load().categories.Ciencias.correct, 1);
  assert.equal(store.load().categories.Matemáticas, undefined);
  assert.equal(store.summary().profileCount, 2);
});

test('migra el progreso único anterior al primer piloto activo', () => {
  const legacy = recordLearningAnswer(undefined, {
    question: { category: 'Lenguaje' },
    correct: true,
    mode: 'mission'
  });
  const storage = createMemoryStorage({
    [STORAGE_KEYS.learningProgress]: JSON.stringify(legacy)
  });
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Cometa' });

  assert.equal(store.load().totals.attempts, 1);
  assert.equal(storage.getItem(STORAGE_KEYS.learningProgress), null);
  assert.notEqual(storage.getItem(STORAGE_KEYS.learningProfiles), null);
  assert.equal(store.summary().profileName, 'Cometa');
});

test('restaura un respaldo únicamente sobre el piloto correspondiente', () => {
  const storage = createMemoryStorage();
  let pilotName = 'Luna';
  const store = createLearningProgressStore({ storage, resolvePilotName: () => pilotName });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });
  const backup = store.createBackup({ exportedAt: '2026-08-03T21:00:00.000Z' });

  store.reset();
  assert.equal(store.load().totals.attempts, 0);
  const restored = store.importBackup(backup.content);
  assert.equal(restored.progress.totals.attempts, 1);

  pilotName = 'Nova';
  assert.throws(() => store.importBackup(backup.content), /pertenece a Luna/);
});
