import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEYS } from '../js/config/storage-keys.js';
import { createLearningDeviceBackupFile } from '../js/core/learning-device-backup.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';
import {
  createLearningProfileCollection,
  createLearningProfileId,
  upsertLearningProfile
} from '../js/core/learning-profiles.js';
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

test('previsualiza sin escribir y aplica únicamente la selección consolidada', () => {
  const storage = createMemoryStorage();
  let pilotName = 'Luna';
  const store = createLearningProgressStore({ storage, resolvePilotName: () => pilotName });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });

  let incoming = createLearningProfileCollection();
  incoming = upsertLearningProfile(incoming, {
    pilotName: 'Luna',
    progress: recordLearningAnswer(undefined, {
      question: { category: 'Lenguaje' }, correct: false, mode: 'practice'
    })
  });
  incoming = upsertLearningProfile(incoming, {
    pilotName: 'Nova',
    progress: recordLearningAnswer(undefined, {
      question: { category: 'Matemáticas' }, correct: true, mode: 'practice'
    })
  });
  const backup = createLearningDeviceBackupFile(incoming).content;
  const beforePreview = storage.getItem(STORAGE_KEYS.learningProfiles);
  const preview = store.previewDeviceBackup(backup);

  assert.equal(storage.getItem(STORAGE_KEYS.learningProfiles), beforePreview);
  assert.equal(preview.conflictCount, 1);
  assert.equal(preview.newProfileCount, 1);

  const result = store.restoreDeviceBackup(backup, [
    { profileId: createLearningProfileId('Luna'), action: 'keep' },
    { profileId: createLearningProfileId('Nova'), action: 'add' }
  ]);
  assert.equal(result.added, 1);
  assert.equal(result.kept, 1);

  assert.equal(store.load().categories.Ciencias.correct, 1);
  assert.equal(store.load().categories.Lenguaje, undefined);
  pilotName = 'Nova';
  assert.equal(store.load().categories.Matemáticas.correct, 1);
});

test('la vista previa no persiste una migración heredada', () => {
  const legacy = recordLearningAnswer(undefined, {
    question: { category: 'Lenguaje' }, correct: true, mode: 'practice'
  });
  const storage = createMemoryStorage({
    [STORAGE_KEYS.learningProgress]: JSON.stringify(legacy)
  });
  const incoming = upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Nova',
    progress: recordLearningAnswer(undefined, {
      question: { category: 'Ciencias' }, correct: true, mode: 'practice'
    })
  });
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Cometa' });
  const preview = store.previewDeviceBackup(createLearningDeviceBackupFile(incoming).content);

  assert.equal(preview.currentProfileCount, 1);
  assert.equal(storage.getItem(STORAGE_KEYS.learningProfiles), null);
  assert.notEqual(storage.getItem(STORAGE_KEYS.learningProgress), null);
});

test('rechaza la restauración cuando el navegador bloquea la escritura protegida', () => {
  const local = upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Luna',
    progress: recordLearningAnswer(undefined, {
      question: { category: 'Ciencias' }, correct: true, mode: 'practice'
    })
  });
  const values = new Map([[STORAGE_KEYS.learningProfiles, JSON.stringify(local)]]);
  const storage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem() { throw new Error('bloqueado'); },
    removeItem: (key) => values.delete(key)
  };
  const incoming = upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Nova',
    progress: recordLearningAnswer(undefined, {
      question: { category: 'Matemáticas' }, correct: true, mode: 'practice'
    })
  });
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Luna' });
  const source = createLearningDeviceBackupFile(incoming).content;

  assert.throws(() => store.restoreDeviceBackup(source, [
    { profileId: createLearningProfileId('Nova'), action: 'add' }
  ]), /punto de recuperación/);
  assert.equal(JSON.parse(values.get(STORAGE_KEYS.learningProfiles)).profiles[createLearningProfileId('Nova')], undefined);
});
