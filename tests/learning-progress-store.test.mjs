import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningProgressStore } from '../js/services/learning-progress-store.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test('persiste respuestas y recupera el resumen pedagógico', () => {
  const storage = createMemoryStorage();
  const store = createLearningProgressStore({ storage });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'mission' });
  store.record({ question: { category: 'Ciencias' }, correct: false, mode: 'practice' });

  assert.equal(store.load().categories.Ciencias.attempts, 2);
  assert.equal(store.summary().accuracy, 50);
  assert.equal(store.summary().focus[0].name, 'Ciencias');

  store.reset();
  assert.equal(store.load().totals.attempts, 0);
});

test('continúa funcionando cuando el navegador bloquea localStorage', () => {
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const store = createLearningProgressStore({ storage });
  const saved = store.record({ question: { category: 'Espacio' }, correct: true });

  assert.equal(saved.totals.attempts, 1);
  assert.equal(store.load().totals.attempts, 0);
  assert.doesNotThrow(() => store.reset());
});
