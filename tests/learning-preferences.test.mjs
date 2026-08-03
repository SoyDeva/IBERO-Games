import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendLearningSession,
  clearLearningGoal,
  configureLearningGoal,
  createLearningGoal,
  createLearningProgress,
  setLongitudinalTracking,
  summarizeLearningProgress,
  summarizeLearningTrend
} from '../js/core/learning-progress.js';

function session(completedAt, answers, correct) {
  return {
    completedAt,
    mode: 'practice',
    answers,
    correct,
    targetAnswers: 8,
    targetAccuracy: 70
  };
}

test('normaliza una meta personalizada y permite restaurar la automática', () => {
  let progress = configureLearningGoal(createLearningProgress(), {
    mode: 'both',
    targetAnswers: 99,
    targetAccuracy: 20,
    focusCategory: 'Matemáticas'
  });

  const custom = createLearningGoal(progress, { mode: 'mission' });
  assert.equal(custom.custom, true);
  assert.equal(custom.targetAnswers, 20);
  assert.equal(custom.targetAccuracy, 50);
  assert.equal(custom.focusCategory, 'Matemáticas');

  progress = clearLearningGoal(progress);
  const automatic = createLearningGoal(progress, { mode: 'mission' });
  assert.equal(automatic.custom, false);
  assert.equal(automatic.targetAnswers, 5);
  assert.equal(automatic.targetAccuracy, 70);
});

test('la retención ampliada es opcional y vuelve a doce sesiones al desactivarse', () => {
  let progress = setLongitudinalTracking(createLearningProgress(), true);
  for (let index = 0; index < 20; index += 1) {
    progress = appendLearningSession(progress, session(new Date(Date.UTC(2026, 0, index + 1)).toISOString(), 8, 6));
  }

  assert.equal(summarizeLearningProgress(progress).sessionCount, 20);
  assert.equal(summarizeLearningProgress(progress).sessionLimit, 60);

  progress = setLongitudinalTracking(progress, false);
  assert.equal(summarizeLearningProgress(progress).sessionCount, 12);
  assert.equal(summarizeLearningProgress(progress).sessionLimit, 12);
});

test('compara bloques de sesiones sin convertir un intento aislado en tendencia', () => {
  let progress = setLongitudinalTracking(createLearningProgress(), true);
  progress = appendLearningSession(progress, session('2026-08-01T12:00:00.000Z', 10, 5));
  progress = appendLearningSession(progress, session('2026-08-02T12:00:00.000Z', 10, 6));
  progress = appendLearningSession(progress, session('2026-08-03T12:00:00.000Z', 10, 8));
  progress = appendLearningSession(progress, session('2026-08-04T12:00:00.000Z', 10, 9));

  const trend = summarizeLearningTrend(progress);
  assert.equal(trend.available, true);
  assert.equal(trend.direction, 'improving');
  assert.ok(trend.accuracyDelta >= 20);
  assert.match(trend.text, /subió/);
});