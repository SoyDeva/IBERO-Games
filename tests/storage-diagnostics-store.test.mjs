import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEYS } from '../js/config/storage-keys.js';
import { createLearningProgressStore } from '../js/services/learning-progress-store.js';
import {
  collectStorageSnapshot,
  createStorageDiagnosticsStore,
  probeStorageWrite
} from '../js/services/storage-diagnostics-store.js';

function createMemoryStorage(initial = {}, { blockWrites = false, blockReads = false } = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    getItem(key) {
      if (blockReads) throw new Error('lectura bloqueada');
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (blockWrites) throw new Error('escritura bloqueada');
      values.set(key, String(value));
    },
    removeItem(key) {
      if (blockWrites) throw new Error('escritura bloqueada');
      values.delete(key);
    }
  };
}

test('recoge claves reales y prueba escritura sin dejar residuos', () => {
  const storage = createMemoryStorage({ alpha: '1', beta: 'dos' });
  const snapshot = collectStorageSnapshot({ storage });

  assert.deepEqual(snapshot.entries, { alpha: '1', beta: 'dos' });
  assert.equal(snapshot.readable, true);
  assert.equal(probeStorageWrite({ storage }), true);
  assert.equal(storage.values.has('__mision_nebula_storage_probe__'), false);
});

test('limpia solo las claves que el diagnóstico vuelve a clasificar como obsoletas', () => {
  const storage = createMemoryStorage({
    [STORAGE_KEYS.learningProfiles]: JSON.stringify({ version: 1, profiles: {} }),
    [STORAGE_KEYS.learningProgress]: JSON.stringify({ version: 1 }),
    [STORAGE_KEYS.rankingPrefix + '21']: '[]',
    'otra-aplicacion': 'conservar'
  });
  const diagnostics = createStorageDiagnosticsStore({ storage });
  const result = diagnostics.cleanupObsolete();

  assert.deepEqual(result.removed, [
    STORAGE_KEYS.learningProgress,
    STORAGE_KEYS.rankingPrefix + '21'
  ].sort());
  assert.equal(storage.getItem('otra-aplicacion'), 'conservar');
  assert.equal(storage.getItem(STORAGE_KEYS.learningProfiles) !== null, true);
  assert.equal(result.after.cleanupCount, 0);
});

test('informa almacenamiento bloqueado sin lanzar durante el diagnóstico', () => {
  const readBlocked = createStorageDiagnosticsStore({
    storage: createMemoryStorage({}, { blockReads: true })
  }).diagnose();
  const writeBlocked = createStorageDiagnosticsStore({
    storage: createMemoryStorage({}, { blockWrites: true })
  }).diagnose();

  assert.equal(readBlocked.status, 'critical');
  assert.equal(readBlocked.readable, false);
  assert.equal(writeBlocked.status, 'critical');
  assert.equal(writeBlocked.writable, false);
});

test('el almacén pedagógico bloquea respaldos cuando la colección es ilegible', () => {
  const storage = createMemoryStorage({
    [STORAGE_KEYS.learningProfiles]: '{json dañado'
  });
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Luna' });

  assert.equal(store.storageInfo().status, 'critical');
  assert.throws(() => store.createBackup(), /No es seguro crear el respaldo/);
  assert.throws(() => store.createDeviceBackup(), /No es seguro crear el respaldo consolidado/);
  assert.throws(() => store.previewDeviceBackup('{}'), /No es seguro previsualizar/);
});

test('el almacén expone diagnóstico y limpieza sin borrar perfiles', () => {
  const storage = createMemoryStorage({
    [STORAGE_KEYS.learningProfiles]: JSON.stringify({ version: 1, profiles: {} }),
    [STORAGE_KEYS.learningProgress]: JSON.stringify({ version: 1 }),
    [STORAGE_KEYS.rankingPrefix + '20']: '[]'
  });
  const store = createLearningProgressStore({ storage, resolvePilotName: () => 'Luna' });
  const before = store.storageInfo();
  const result = store.cleanupObsoleteStorage();

  assert.equal(before.cleanupCount, 2);
  assert.equal(result.removed.length, 2);
  assert.notEqual(storage.getItem(STORAGE_KEYS.learningProfiles), null);
  assert.equal(store.storageInfo().cleanupCount, 0);
});
