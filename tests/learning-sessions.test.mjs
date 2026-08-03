import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendLearningSession,
  createLearningGoal,
  createLearningProgress,
  createLearningSession,
  normalizeLearningProgress,
  recordLearningAnswer,
  summarizeLearningProgress
} from '../js/core/learning-progress.js';

function answer(progress, category, correct, mode = 'practice') {
  return recordLearningAnswer(progress, { question: { category }, correct, mode });
}

test('migra progreso anterior y conserva un historial normalizado', () => {
  const progress = normalizeLearningProgress({
    version: 1,
    totals: { attempts: 2, correct: 1 },
    categories: { Ciencias: { attempts: 2, correct: 1 } },
    sessions: [
      { completedAt: '2026-08-03T15:00:00-05:00', mode: 'mission', answers: 4, correct: 3, targetAnswers: 5, targetAccuracy: 70 },
      { completedAt: 'fecha inválida', answers: 20, correct: 20 }
    ]
  });

  assert.equal(progress.version, 2);
  assert.equal(progress.sessions.length, 1);
  assert.equal(progress.sessions[0].accuracy, 75);
  assert.equal(progress.sessions[0].goalReached, false);
});

test('crea una meta moderada a partir del principal tema de refuerzo', () => {
  let progress = createLearningProgress();
  progress = answer(progress, 'Matemáticas', false);
  progress = answer(progress, 'Matemáticas', false);
  progress = answer(progress, 'Lenguaje', true);

  const goal = createLearningGoal(progress, { mode: 'practice' });
  assert.equal(goal.targetAnswers, 8);
  assert.equal(goal.targetAccuracy, 70);
  assert.equal(goal.focusCategory, 'Matemáticas');
  assert.match(goal.text, /Matemáticas/);
});

test('calcula una sesión por diferencia y conserva solo las doce recientes', () => {
  const baseline = createLearningProgress();
  let progress = answer(baseline, 'Ciencias', true, 'mission');
  progress = answer(progress, 'Ciencias', false, 'mission');
  const session = createLearningSession(progress, {
    baseline,
    mode: 'mission',
    result: { distance: 940, checkpoints: 2 },
    completedAt: '2026-08-03T20:00:00.000Z'
  });

  assert.deepEqual({ answers: session.answers, correct: session.correct, accuracy: session.accuracy }, { answers: 2, correct: 1, accuracy: 50 });
  assert.equal(session.distance, 940);
  assert.equal(session.checkpoints, 2);

  let history = progress;
  for (let index = 0; index < 15; index += 1) {
    history = appendLearningSession(history, { ...session, completedAt: new Date(Date.UTC(2026, 7, index + 1)).toISOString() });
  }
  const summary = summarizeLearningProgress(history);
  assert.equal(summary.sessionCount, 12);
  assert.equal(summary.recentSessions.length, 5);
});

test('no crea sesiones de tutorial ni sesiones sin respuestas', () => {
  const progress = createLearningProgress();
  assert.equal(createLearningSession(progress, { baseline: progress, mode: 'tutorial' }), null);
  assert.equal(createLearningSession(progress, { baseline: progress, mode: 'practice' }), null);
});
