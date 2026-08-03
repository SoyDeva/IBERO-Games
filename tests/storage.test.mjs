import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSettings } from '../js/core/settings.js';
import {
  hasStorageValue,
  readStorageJson,
  removeStorageValue,
  writeStorageJson
} from '../js/services/browser-storage.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test('normaliza ajustes dañados o fuera de rango', () => {
  assert.deepEqual(normalizeSettings({
    sound: 0,
    musicVolume: 4,
    effectsVolume: -2,
    reducedMotion: 1
  }), {
    sound: false,
    musicVolume: 1,
    effectsVolume: 0,
    reducedMotion: true,
    highContrast: false,
    largeText: false
  });
});

test('lee y escribe JSON sin depender del navegador', () => {
  const storage = createMemoryStorage();
  assert.equal(writeStorageJson('profile', { name: 'Asteria' }, { storage }), true);
  assert.deepEqual(readStorageJson('profile', null, { storage }), { name: 'Asteria' });
  assert.equal(hasStorageValue('profile', { storage }), true);
  assert.equal(removeStorageValue('profile', { storage }), true);
  assert.equal(hasStorageValue('profile', { storage }), false);
});

test('recupera el valor alternativo cuando el JSON está dañado', () => {
  const storage = createMemoryStorage({ settings: '{incompleto' });
  let errors = 0;
  const result = readStorageJson('settings', { sound: true }, {
    storage,
    onError: () => { errors += 1; }
  });

  assert.deepEqual(result, { sound: true });
  assert.equal(errors, 1);
});

test('tolera navegadores que bloquean el almacenamiento', () => {
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  let errors = 0;
  const onError = () => { errors += 1; };

  assert.equal(readStorageJson('x', null, { storage, onError }), null);
  assert.equal(writeStorageJson('x', {}, { storage, onError }), false);
  assert.equal(removeStorageValue('x', { storage, onError }), false);
  assert.equal(errors, 3);
});
