import assert from 'node:assert/strict';
import test from 'node:test';
import { STORAGE_KEYS } from '../js/config/storage-keys.js';
import {
  assertStorageDiagnosticReady,
  diagnoseStorageSnapshot,
  formatStorageBytes
} from '../js/core/storage-diagnostics.js';
import {
  createLearningProfileCollection,
  upsertLearningProfile
} from '../js/core/learning-profiles.js';
import { recordLearningAnswer } from '../js/core/learning-progress.js';

function validCollection() {
  return upsertLearningProfile(createLearningProfileCollection(), {
    pilotName: 'Luna',
    updatedAt: '2026-08-03T20:00:00.000Z',
    progress: recordLearningAnswer(undefined, {
      question: { category: 'Ciencias' },
      correct: true,
      mode: 'practice'
    })
  });
}

test('mide almacenamiento saludable y permite respaldar', () => {
  const entries = {
    [STORAGE_KEYS.learningProfiles]: JSON.stringify(validCollection()),
    [STORAGE_KEYS.economy]: JSON.stringify({ credits: 12 })
  };
  const report = diagnoseStorageSnapshot({ entries, readable: true, writable: true });

  assert.equal(report.status, 'ok');
  assert.equal(report.profileCount, 1);
  assert.equal(report.damagedProfiles, 0);
  assert.equal(report.canBackup, true);
  assert.equal(report.canRestore, true);
  assert.ok(report.totalBytes >= report.appBytes);
  assert.match(formatStorageBytes(report.learningBytes), /B|KB/);
  assert.equal(assertStorageDiagnosticReady(report, 'respaldar'), report);
});

test('clasifica JSON pedagógico ilegible como crítico', () => {
  const report = diagnoseStorageSnapshot({
    entries: { [STORAGE_KEYS.learningProfiles]: '{incompleto' },
    readable: true,
    writable: true
  });

  assert.equal(report.status, 'critical');
  assert.equal(report.canBackup, false);
  assert.match(report.issues[0].message, /JSON ilegible/);
  assert.throws(() => assertStorageDiagnosticReady(report, 'crear un respaldo'), /No es seguro/);
});

test('identifica únicamente residuos seguros para limpieza', () => {
  const entries = {
    [STORAGE_KEYS.learningProfiles]: JSON.stringify(validCollection()),
    [STORAGE_KEYS.learningProgress]: JSON.stringify({ version: 1 }),
    [STORAGE_KEYS.learningRecovery]: '{dañado',
    [STORAGE_KEYS.rankingPrefix + '22']: JSON.stringify([{ pilot: 'Antiguo' }]),
    'otra-aplicacion': 'conservar'
  };
  const report = diagnoseStorageSnapshot({ entries, readable: true, writable: true });

  assert.equal(report.status, 'warning');
  assert.deepEqual(report.cleanupKeys, [
    STORAGE_KEYS.learningProgress,
    STORAGE_KEYS.learningRecovery,
    STORAGE_KEYS.rankingPrefix + '22'
  ].sort());
  assert.equal(report.cleanupKeys.includes('otra-aplicacion'), false);
  assert.equal(report.cleanupCount, 3);
});

test('informa perfiles reparables sin bloquear el uso', () => {
  const damaged = {
    version: 1,
    profiles: {
      'pilot-inconsistente': {
        pilotName: 'Luna',
        updatedAt: 'fecha inválida',
        progress: { version: 1 }
      }
    }
  };
  const report = diagnoseStorageSnapshot({
    entries: { [STORAGE_KEYS.learningProfiles]: JSON.stringify(damaged) },
    readable: true,
    writable: true
  });

  assert.equal(report.status, 'warning');
  assert.equal(report.damagedProfiles, 1);
  assert.equal(report.canBackup, true);
  assert.match(report.issues[0].message, /reparables/);
});

test('bloquea acciones cuando lectura o escritura no están disponibles', () => {
  const report = diagnoseStorageSnapshot({ entries: {}, readable: false, writable: false });
  assert.equal(report.status, 'critical');
  assert.equal(report.issues.filter((issue) => issue.level === 'critical').length, 2);
});
