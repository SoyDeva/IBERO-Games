import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLearningDeviceBackup,
  createLearningDeviceBackupFile,
  verifyLearningDeviceBackup
} from '../js/core/learning-device-backup.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';
import { createLearningProfileCollection, upsertLearningProfile } from '../js/core/learning-profiles.js';

function answered(category, correct) {
  return recordLearningAnswer(undefined, { question: { category }, correct, mode: 'practice' });
}

function twoProfiles() {
  let collection = createLearningProfileCollection();
  collection = upsertLearningProfile(collection, { pilotName: 'Luna', progress: answered('Ciencias', true) });
  collection = upsertLearningProfile(collection, { pilotName: 'Nova', progress: answered('Lenguaje', false) });
  return collection;
}

test('crea y verifica un respaldo consolidado de todos los perfiles locales', () => {
  const file = createLearningDeviceBackupFile(twoProfiles(), {
    exportedAt: '2026-08-03T22:00:00.000Z'
  });
  const verified = verifyLearningDeviceBackup(file.content);

  assert.match(file.filename, /mision-nebula-respaldo-dispositivo-2026-08-03\.json/);
  assert.equal(verified.profileCount, 2);
  assert.equal(Object.keys(verified.collection.profiles).length, 2);
  assert.match(verified.checksum, /^fnv1a32:[0-9a-f]{8}$/);
  assert.doesNotMatch(JSON.stringify(verified.collection), /"(?:token|password|supabaseUrl)"/i);
});

test('detecta alteraciones y conteos inconsistentes en el respaldo consolidado', () => {
  const backup = createLearningDeviceBackup(twoProfiles());
  backup.collection.profiles[Object.keys(backup.collection.profiles)[0]].progress.totals.attempts = 99;
  assert.throws(() => verifyLearningDeviceBackup(backup), /integridad.*falló/i);

  const countMismatch = createLearningDeviceBackup(twoProfiles());
  countMismatch.profileCount = 40;
  assert.throws(() => verifyLearningDeviceBackup(countMismatch), /integridad.*falló/i);
});

test('rechaza claves reservadas en respaldos consolidados no confiables', () => {
  const backup = createLearningDeviceBackup(twoProfiles());
  Object.defineProperty(backup.collection, '__proto__', {
    value: { polluted: true },
    enumerable: true,
    configurable: true
  });
  assert.throws(() => verifyLearningDeviceBackup(backup), /clave reservada/);
});
