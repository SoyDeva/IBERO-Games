import assert from 'node:assert/strict';
import test from 'node:test';
import { recordLearningAnswer } from '../js/core/learning-progress.js';
import {
  adoptLocalLearningProfile,
  createLearningProfileCollection,
  createLearningProfileId,
  listLearningProfiles,
  readLearningProfile,
  upsertLearningProfile
} from '../js/core/learning-profiles.js';

function answered(category, correct) {
  return recordLearningAnswer(undefined, { question: { category }, correct, mode: 'practice' });
}

test('genera una identidad local estable sin guardar tokens', () => {
  assert.equal(createLearningProfileId('LunaEstelar'), createLearningProfileId('lunaestelar'));
  assert.equal(createLearningProfileId(''), 'local');
  assert.match(createLearningProfileId('Órbita 7'), /^pilot-[0-9a-f]{8}$/);
  assert.notEqual(createLearningProfileId('Piloto local'), 'local');
});

test('mantiene progreso independiente para pilotos del mismo dispositivo', () => {
  let collection = createLearningProfileCollection();
  collection = upsertLearningProfile(collection, { pilotName: 'Luna', progress: answered('Ciencias', true) });
  collection = upsertLearningProfile(collection, { pilotName: 'Nova', progress: answered('Matemáticas', false) });

  assert.equal(readLearningProfile(collection, 'Luna').categories.Ciencias.correct, 1);
  assert.equal(readLearningProfile(collection, 'Luna').categories.Matemáticas, undefined);
  assert.equal(readLearningProfile(collection, 'Nova').categories.Matemáticas.incorrect, 1);
  assert.equal(listLearningProfiles(collection).length, 2);
});

test('asigna el progreso local anterior al primer piloto identificado', () => {
  let collection = upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: '',
    progress: answered('Lenguaje', true)
  });

  collection = adoptLocalLearningProfile(collection, 'Cometa');
  assert.equal(readLearningProfile(collection, 'Cometa').totals.attempts, 1);
  assert.equal(collection.profiles.local, undefined);
});
