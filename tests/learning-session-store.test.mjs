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

test('cierra una sesión usando el progreso acumulado desde su inicio', () => {
  const store = createLearningProgressStore({ storage: createMemoryStorage() });
  const baseline = store.load();
  store.record({ question: { category: 'Geografía' }, correct: true, mode: 'practice' });
  store.record({ question: { category: 'Geografía' }, correct: false, mode: 'practice' });

  const completed = store.completeSession({
    baseline,
    mode: 'practice',
    result: { distance: 1200, checkpoints: 3 },
    completedAt: '2026-08-03T20:00:00.000Z'
  });

  assert.equal(completed.session.answers, 2);
  assert.equal(completed.session.accuracy, 50);
  assert.equal(store.summary().sessionCount, 1);
  assert.equal(store.summary().recentSessions[0].distance, 1200);
});

test('omite tutoriales y sesiones sin respuestas', () => {
  const store = createLearningProgressStore({ storage: createMemoryStorage() });
  const baseline = store.load();

  assert.equal(store.completeSession({ baseline, mode: 'tutorial' }).session, null);
  assert.equal(store.completeSession({ baseline, mode: 'mission' }).session, null);
  assert.equal(store.summary().sessionCount, 0);
});
