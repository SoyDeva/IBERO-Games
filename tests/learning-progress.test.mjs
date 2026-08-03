import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLearningProgress,
  learningCategoryNeed,
  normalizeLearningProgress,
  recordLearningAnswer,
  summarizeLearningProgress
} from '../js/core/learning-progress.js';

test('normaliza datos dañados y conserva categorías válidas', () => {
  const progress = normalizeLearningProgress({
    totals: { attempts: 99, correct: 80, currentStreak: 50 },
    categories: {
      Matemáticas: { attempts: 3, correct: 2, bestStreak: 2 },
      '': { attempts: 20, correct: 20 },
      Ciencias: { attempts: -4, correct: 8 }
    }
  });

  assert.deepEqual(progress.totals, {
    attempts: 3,
    correct: 2,
    incorrect: 1,
    currentStreak: 2,
    bestStreak: 2
  });
  assert.deepEqual(progress.categories.Matemáticas, {
    attempts: 3,
    correct: 2,
    incorrect: 1,
    currentStreak: 0,
    bestStreak: 2
  });
  assert.equal(progress.categories[''], undefined);
});

test('registra misión y práctica sin convertir el tutorial en estadística', () => {
  const question = { category: 'Espacio' };
  let progress = createLearningProgress();
  progress = recordLearningAnswer(progress, { question, correct: true, mode: 'mission' });
  progress = recordLearningAnswer(progress, { question, correct: false, mode: 'practice' });
  progress = recordLearningAnswer(progress, { question, correct: true, mode: 'tutorial' });

  assert.deepEqual(progress.totals, {
    attempts: 2,
    correct: 1,
    incorrect: 1,
    currentStreak: 0,
    bestStreak: 1
  });
  assert.equal(progress.categories.Espacio.attempts, 2);
  assert.equal(progress.categories.Espacio.incorrect, 1);
});

test('prioriza categorías con evidencia de dificultad y resume sin calificar', () => {
  let progress = createLearningProgress();
  for (let index = 0; index < 5; index += 1) {
    progress = recordLearningAnswer(progress, { question: { category: 'Matemáticas' }, correct: index === 0 });
    progress = recordLearningAnswer(progress, { question: { category: 'Lenguaje' }, correct: true });
  }

  assert.ok(learningCategoryNeed(progress, 'Matemáticas') > learningCategoryNeed(progress, 'Lenguaje'));
  const summary = summarizeLearningProgress(progress);
  assert.equal(summary.attempts, 10);
  assert.equal(summary.accuracy, 60);
  assert.equal(summary.focus[0].name, 'Matemáticas');
  assert.equal(summary.strength.name, 'Lenguaje');
  assert.match(summary.recommendation, /Matemáticas/);
});
