import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningDeviceBackupFile } from '../js/core/learning-device-backup.js';
import {
  createLearningDeviceRestorePreview,
  restoreLearningDeviceProfiles
} from '../js/core/learning-device-restore.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';
import {
  MAX_LEARNING_PROFILES,
  createLearningProfileCollection,
  createLearningProfileId,
  readLearningProfile,
  upsertLearningProfile
} from '../js/core/learning-profiles.js';

function answered(category, correct, previous) {
  return recordLearningAnswer(previous, { question: { category }, correct, mode: 'practice' });
}

function localCollection() {
  return upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Luna',
    progress: answered('Ciencias', true),
    updatedAt: '2026-08-01T10:00:00.000Z'
  });
}

function backupContent() {
  let collection = createLearningProfileCollection();
  let lunaProgress = answered('Ciencias', false);
  lunaProgress = answered('Lenguaje', true, lunaProgress);
  collection = upsertLearningProfile(collection, {
    pilotName: 'Luna',
    progress: lunaProgress,
    updatedAt: '2026-08-02T10:00:00.000Z'
  });
  collection = upsertLearningProfile(collection, {
    pilotName: 'Nova',
    progress: answered('Matemáticas', true),
    updatedAt: '2026-08-02T11:00:00.000Z'
  });
  return createLearningDeviceBackupFile(collection, {
    exportedAt: '2026-08-03T12:00:00.000Z'
  }).content;
}

test('crea una vista previa sin mutar la colección local', () => {
  const current = localCollection();
  const snapshot = structuredClone(current);
  const preview = createLearningDeviceRestorePreview(current, backupContent(), {
    activePilotName: 'Luna'
  });

  assert.deepEqual(current, snapshot);
  assert.equal(preview.backupProfileCount, 2);
  assert.equal(preview.newProfileCount, 1);
  assert.equal(preview.conflictCount, 1);
  assert.equal(preview.activeConflictCount, 1);
  assert.equal(preview.profiles.find((profile) => profile.pilotName === 'Luna').defaultAction, 'keep');
  assert.equal(preview.profiles.find((profile) => profile.pilotName === 'Nova').defaultAction, 'add');
});

test('añade perfiles nuevos y conserva coincidencias locales por decisión explícita', () => {
  const current = localCollection();
  const lunaId = createLearningProfileId('Luna');
  const novaId = createLearningProfileId('Nova');
  const result = restoreLearningDeviceProfiles(current, backupContent(), [
    { profileId: lunaId, action: 'keep' },
    { profileId: novaId, action: 'add' }
  ], { activePilotName: 'Luna' });

  assert.equal(result.added, 1);
  assert.equal(result.replaced, 0);
  assert.equal(result.kept, 1);
  assert.equal(readLearningProfile(result.collection, 'Luna').totals.attempts, 1);
  assert.equal(readLearningProfile(result.collection, 'Nova').totals.attempts, 1);
});

test('reemplaza una coincidencia únicamente cuando se selecciona replace', () => {
  const lunaId = createLearningProfileId('Luna');
  const result = restoreLearningDeviceProfiles(localCollection(), backupContent(), [
    { profileId: lunaId, action: 'replace' }
  ], { activePilotName: 'Luna' });

  assert.equal(result.replaced, 1);
  assert.equal(result.activeProfileReplaced, true);
  assert.equal(readLearningProfile(result.collection, 'Luna').totals.attempts, 2);
  assert.equal(readLearningProfile(result.collection, 'Nova').totals.attempts, 0);
});

test('rechaza decisiones desconocidas, incompatibles o duplicadas', () => {
  const lunaId = createLearningProfileId('Luna');
  const novaId = createLearningProfileId('Nova');
  assert.throws(() => restoreLearningDeviceProfiles(localCollection(), backupContent(), [
    { profileId: 'pilot-inexistente', action: 'add' }
  ]), /no pertenece al respaldo/);
  assert.throws(() => restoreLearningDeviceProfiles(localCollection(), backupContent(), [
    { profileId: lunaId, action: 'add' }
  ]), /coincidente no puede añadirse/);
  assert.throws(() => restoreLearningDeviceProfiles(localCollection(), backupContent(), [
    { profileId: novaId, action: 'replace' }
  ]), /perfil nuevo/);
  assert.throws(() => restoreLearningDeviceProfiles(localCollection(), backupContent(), [
    { profileId: novaId, action: 'add' },
    { profileId: novaId, action: 'skip' }
  ]), /repite un perfil/);
});

test('rechaza una selección que excede el límite defensivo de perfiles', () => {
  let current = createLearningProfileCollection();
  for (let index = 0; index < MAX_LEARNING_PROFILES; index += 1) {
    current = upsertLearningProfile(current, {
      pilotName: 'Local ' + index,
      progress: answered('Ciencias', true),
      updatedAt: '2026-08-01T10:00:00.000Z'
    });
  }
  const incoming = upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Perfil adicional',
    progress: answered('Lenguaje', true)
  });
  const source = createLearningDeviceBackupFile(incoming).content;
  const incomingId = createLearningProfileId('Perfil adicional');

  assert.throws(() => restoreLearningDeviceProfiles(current, source, [
    { profileId: incomingId, action: 'add' }
  ]), /límite de 50 perfiles/);
});
