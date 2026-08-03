import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEYS } from '../js/config/storage-keys.js';
import { createLearningBackup } from '../js/core/learning-backup.js';
import { createLearningDeviceBackup } from '../js/core/learning-device-backup.js';
import { createLearningProfileId } from '../js/core/learning-profiles.js';
import { createLearningProgress, recordLearningAnswer } from '../js/core/learning-progress.js';
import { createLearningProgressStore } from '../js/services/learning-progress-store.js';

function createMemoryStorage({ blocked = false } = {}) {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if (blocked) throw new Error('blocked');
      values.set(key, value);
    },
    removeItem(key) {
      if (blocked) throw new Error('blocked');
      values.delete(key);
    }
  };
}

function answer(category, correct = true) {
  return recordLearningAnswer(createLearningProgress(), {
    question: { category },
    correct,
    mode: 'practice'
  });
}

test('elimina un perfil inactivo y revierte exactamente la colección anterior', () => {
  const storage = createMemoryStorage();
  let pilotName = 'Luna';
  const store = createLearningProgressStore({ storage, resolvePilotName: () => pilotName });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });
  pilotName = 'Nova';
  store.record({ question: { category: 'Lenguaje' }, correct: false, mode: 'practice' });

  store.removeProfile(createLearningProfileId('Luna'));
  assert.equal(store.profileInfo().profiles.some((profile) => profile.pilotName === 'Luna'), false);
  assert.equal(store.recoveryInfo().action, 'delete');

  store.undoLastDestructiveChange();
  assert.equal(store.profileInfo().profiles.some((profile) => profile.pilotName === 'Luna'), true);
  assert.equal(storage.getItem(STORAGE_KEYS.learningRecovery), null);
});

test('importa un perfil con punto de recuperación y lo invalida tras una respuesta nueva', () => {
  const storage = createMemoryStorage();
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Luna' });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });
  const backup = createLearningBackup(answer('Matemáticas', false), { pilotName: 'Luna' });

  store.importBackup(backup);
  assert.equal(store.load().categories.Matemáticas.incorrect, 1);
  assert.equal(store.recoveryInfo().action, 'import');

  store.record({ question: { category: 'Lenguaje' }, correct: true, mode: 'practice' });
  assert.equal(store.recoveryInfo(), null);
  assert.throws(() => store.undoLastDestructiveChange(), /ya no está disponible/);
});

test('revierte una restauración consolidada seleccionada', () => {
  const storage = createMemoryStorage();
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Luna' });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });

  const otherStorage = createMemoryStorage();
  let otherPilot = 'Luna';
  const other = createLearningProgressStore({ storage: otherStorage, resolvePilotName: () => otherPilot });
  other.record({ question: { category: 'Ciencias' }, correct: false, mode: 'practice' });
  otherPilot = 'Nova';
  other.record({ question: { category: 'Lenguaje' }, correct: true, mode: 'practice' });
  const backup = createLearningDeviceBackup(JSON.parse(otherStorage.getItem(STORAGE_KEYS.learningProfiles)));
  const preview = store.previewDeviceBackup(backup);
  const decisions = preview.profiles.map((profile) => ({
    profileId: profile.id,
    action: profile.conflict ? 'replace' : 'add'
  }));

  store.restoreDeviceBackup(backup, decisions);
  assert.equal(store.load().categories.Ciencias.incorrect, 1);
  assert.equal(store.profileInfo().profiles.some((profile) => profile.pilotName === 'Nova'), true);

  store.undoLastDestructiveChange();
  assert.equal(store.load().categories.Ciencias.correct, 1);
  assert.equal(store.profileInfo().profiles.some((profile) => profile.pilotName === 'Nova'), false);
});

test('aborta el cambio destructivo cuando no puede guardar el punto de recuperación', () => {
  const storage = createMemoryStorage({ blocked: true });
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Luna' });
  const backup = createLearningBackup(answer('Ciencias'), { pilotName: 'Luna' });
  assert.throws(() => store.importBackup(backup), /punto de recuperación/);
});
