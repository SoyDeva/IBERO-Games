import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLearningRecoveryPoint,
  inspectLearningRecoveryPoint,
  learningCollectionFingerprint,
  restoreLearningRecoveryPoint
} from '../js/core/learning-recovery.js';
import {
  createLearningProfileCollection,
  upsertLearningProfile
} from '../js/core/learning-profiles.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';

function progress(category, correct = true) {
  return recordLearningAnswer(undefined, {
    question: { category },
    correct,
    mode: 'practice'
  });
}

function collections() {
  const previous = upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Luna',
    progress: progress('Ciencias')
  });
  const current = upsertLearningProfile(previous, {
    pilotName: 'Nova',
    progress: progress('Lenguaje', false)
  });
  return { previous, current };
}

test('crea, inspecciona y restaura un punto compatible con el estado actual', () => {
  const { previous, current } = collections();
  const point = createLearningRecoveryPoint(previous, current, {
    action: 'restore',
    createdAt: '2026-08-03T20:00:00.000Z'
  });
  const info = inspectLearningRecoveryPoint(point, current, {
    now: '2026-08-03T21:00:00.000Z'
  });
  const restored = restoreLearningRecoveryPoint(point, current, {
    now: '2026-08-03T21:00:00.000Z'
  });

  assert.equal(info.action, 'restore');
  assert.match(info.label, /restauración consolidada/);
  assert.equal(learningCollectionFingerprint(restored.collection), learningCollectionFingerprint(previous));
});

test('invalida el punto al vencer o cuando existe actividad posterior', () => {
  const { previous, current } = collections();
  const point = createLearningRecoveryPoint(previous, current, {
    action: 'delete',
    createdAt: '2026-08-01T20:00:00.000Z'
  });
  const changed = upsertLearningProfile(current, {
    pilotName: 'Luna',
    progress: progress('Matemáticas')
  });

  assert.equal(inspectLearningRecoveryPoint(point, current, { now: '2026-08-03T21:00:00.000Z' }), null);
  assert.equal(inspectLearningRecoveryPoint(point, changed, { now: '2026-08-01T21:00:00.000Z' }), null);
  assert.throws(
    () => restoreLearningRecoveryPoint(point, changed, { now: '2026-08-01T21:00:00.000Z' }),
    /ya no está disponible/
  );
});

test('rechaza acciones desconocidas y puntos alterados', () => {
  const { previous, current } = collections();
  assert.throws(() => createLearningRecoveryPoint(previous, current, { action: 'reset' }), /no admite/);
  const point = createLearningRecoveryPoint(previous, current, { action: 'import' });
  point.previousCollection.profiles = {};
  assert.equal(inspectLearningRecoveryPoint(point, current), null);
});

test('descarta silenciosamente puntos con claves reservadas', () => {
  const { previous, current } = collections();
  const point = createLearningRecoveryPoint(previous, current, { action: 'delete' });
  const manipulated = JSON.parse(JSON.stringify(point).replace(
    '"previousCollection":{',
    '"previousCollection":{"__proto__":{"polluted":true},'
  ));
  assert.equal(inspectLearningRecoveryPoint(manipulated, current), null);
});
