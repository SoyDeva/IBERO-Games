import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningExport } from '../js/core/learning-export.js';
import {
  appendLearningSession,
  createLearningProgress,
  recordLearningAnswer
} from '../js/core/learning-progress.js';

function createProgress() {
  let progress = createLearningProgress();
  progress = recordLearningAnswer(progress, { question: { category: 'Ciencias, espacio' }, correct: true, mode: 'practice' });
  return appendLearningSession(progress, {
    completedAt: '2026-08-03T20:00:00.000Z',
    mode: 'practice',
    answers: 1,
    correct: 1,
    distance: 420,
    checkpoints: 1,
    focusCategory: 'Ciencias, espacio',
    targetAnswers: 8,
    targetAccuracy: 70
  });
}

test('genera un respaldo JSON local con esquema y privacidad explícitos', () => {
  const file = createLearningExport(createProgress(), {
    format: 'json',
    pilotName: 'LunaEstelar',
    generatedAt: '2026-08-03T21:00:00.000Z'
  });
  const payload = JSON.parse(file.content);

  assert.equal(file.extension, 'json');
  assert.equal(payload.schema, 'mision-nebula-learning-export-v1');
  assert.equal(payload.pilotName, 'LunaEstelar');
  assert.equal(payload.progress.sessions.length, 1);
  assert.match(payload.privacy, /no enviada/);
  assert.doesNotMatch(file.content, /password|pilotToken|supabase/i);
});

test('genera un CSV compatible y protege categorías con comas', () => {
  const file = createLearningExport(createProgress(), {
    format: 'csv',
    generatedAt: '2026-08-03T21:00:00.000Z'
  });

  assert.equal(file.extension, 'csv');
  assert.equal(file.content.charCodeAt(0), 0xFEFF);
  assert.match(file.content, /"Ciencias, espacio"/);
  assert.match(file.content, /Exportación voluntaria/);
  assert.doesNotMatch(file.content, /password|pilotToken|supabase/i);
});