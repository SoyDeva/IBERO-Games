import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningBackup, createLearningBackupFile, verifyLearningBackup } from '../js/core/learning-backup.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';

function progressWithAnswer() {
  return recordLearningAnswer(undefined, {
    question: { category: 'Ciencias' },
    correct: true,
    mode: 'practice'
  });
}

test('crea y verifica un respaldo del perfil activo', () => {
  const file = createLearningBackupFile(progressWithAnswer(), {
    pilotName: 'Luna',
    exportedAt: '2026-08-03T21:00:00.000Z'
  });
  const verified = verifyLearningBackup(file.content, { expectedPilotName: 'luna' });

  assert.match(file.filename, /mision-nebula-respaldo-2026-08-03\.json/);
  assert.equal(verified.pilotName, 'Luna');
  assert.equal(verified.progress.totals.attempts, 1);
  assert.match(verified.checksum, /^fnv1a32:[0-9a-f]{8}$/);
});

test('rechaza un respaldo alterado después de ser creado', () => {
  const backup = createLearningBackup(progressWithAnswer(), { pilotName: 'Nova' });
  backup.progress.totals.attempts = 99;

  assert.throws(() => verifyLearningBackup(backup, { expectedPilotName: 'Nova' }), /integridad falló/);
});

test('rechaza importar el respaldo de otro piloto', () => {
  const backup = createLearningBackup(progressWithAnswer(), { pilotName: 'Cometa' });

  assert.throws(() => verifyLearningBackup(backup, { expectedPilotName: 'Luna' }), /pertenece a Cometa/);
});

test('rechaza documentos JSON que no usan el esquema de respaldo', () => {
  assert.throws(() => verifyLearningBackup('{"schema":"otro-formato"}'), /formato de respaldo compatible/);
});
