import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEYS } from '../js/config/storage-keys.js';
import { createLearningProgress, recordLearningAnswer } from '../js/core/learning-progress.js';
import { createLearningRepairStore } from '../js/services/learning-repair-store.js';

function progress(category) {
  return recordLearningAnswer(createLearningProgress(), {
    question: { category },
    correct: true,
    mode: 'practice'
  });
}

function createMemoryStorage(initial = {}, { blocked = false } = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if (blocked) throw new Error('blocked');
      values.set(key, String(value));
    },
    removeItem(key) {
      if (blocked) throw new Error('blocked');
      values.delete(key);
    }
  };
}

function damagedSource() {
  return JSON.stringify({
    version: 0,
    profiles: {
      antiguo: {
        pilotName: 'Luna',
        updatedAt: '2026-08-03T10:00:00.000Z',
        progress: progress('Ciencias')
      },
      descartado: { pilotName: '', progress: null }
    }
  });
}

test('previsualiza y descarga sin modificar el almacenamiento', () => {
  const source = damagedSource();
  const storage = createMemoryStorage({ [STORAGE_KEYS.learningProfiles]: source });
  const store = createLearningRepairStore({
    storage,
    resolvePilotName: () => 'Luna',
    now: () => '2026-08-03T22:00:00.000Z'
  });

  const preview = store.preview();
  const file = store.createOriginalFile();

  assert.equal(preview.canRepair, true);
  assert.equal(file.content, source);
  assert.equal(storage.getItem(STORAGE_KEYS.learningProfiles), source);
});

test('exige descarga preventiva antes de guardar la colección normalizada', () => {
  const source = damagedSource();
  const storage = createMemoryStorage({
    [STORAGE_KEYS.learningProfiles]: source,
    [STORAGE_KEYS.learningRecovery]: '{"obsoleto":true}'
  });
  const store = createLearningRepairStore({ storage, resolvePilotName: () => 'Luna' });
  const preview = store.preview();

  assert.throws(
    () => store.applyRepair(preview.sourceFingerprint),
    /Descarga primero/
  );
  const result = store.applyRepair(preview.sourceFingerprint, { originalDownloaded: true });
  const saved = JSON.parse(storage.getItem(STORAGE_KEYS.learningProfiles));

  assert.equal(result.repaired, true);
  assert.equal(result.recoveredCount, 1);
  assert.equal(Object.keys(saved.profiles).length, 1);
  assert.equal(storage.getItem(STORAGE_KEYS.learningRecovery), null);
});

test('cancela si la fuente cambia después de la vista previa', () => {
  const storage = createMemoryStorage({ [STORAGE_KEYS.learningProfiles]: damagedSource() });
  const store = createLearningRepairStore({ storage });
  const preview = store.preview();
  storage.setItem(STORAGE_KEYS.learningProfiles, damagedSource() + ' ');

  assert.throws(
    () => store.applyRepair(preview.sourceFingerprint, { originalDownloaded: true }),
    /cambiaron después de la vista previa/
  );
});

test('no intenta reparar cuando la escritura local está bloqueada', () => {
  const storage = createMemoryStorage(
    { [STORAGE_KEYS.learningProfiles]: damagedSource() },
    { blocked: true }
  );
  const store = createLearningRepairStore({ storage });
  const preview = store.preview();

  assert.throws(
    () => store.applyRepair(preview.sourceFingerprint, { originalDownloaded: true }),
    /no permite leer y guardar/
  );
});
