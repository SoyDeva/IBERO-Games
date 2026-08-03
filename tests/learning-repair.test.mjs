import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLearningRepair,
  createLearningRepairOriginalFile,
  createLearningRepairPreview
} from '../js/core/learning-repair.js';
import { createLearningProgress, recordLearningAnswer } from '../js/core/learning-progress.js';

function progress(category, correct = true) {
  return recordLearningAnswer(createLearningProgress(), {
    question: { category },
    correct,
    mode: 'practice'
  });
}

test('recupera perfiles reconocibles, excluye entradas inválidas y resuelve duplicados', () => {
  const source = JSON.stringify({
    version: 0,
    profiles: {
      'id-antiguo': {
        pilotName: 'Luna',
        updatedAt: '2026-08-01T10:00:00.000Z',
        progress: progress('Ciencias')
      },
      duplicado: {
        pilotName: 'Luna',
        updatedAt: '2026-08-03T10:00:00.000Z',
        progress: progress('Lenguaje', false)
      },
      roto: { pilotName: '', progress: null }
    }
  });

  const preview = createLearningRepairPreview(source, { activePilotName: 'Luna' });

  assert.equal(preview.status, 'repairable');
  assert.equal(preview.canRepair, true);
  assert.equal(preview.recoveredCount, 1);
  assert.equal(preview.droppedCount, 1);
  assert.equal(preview.duplicateCount, 1);
  assert.equal(preview.profiles[0].pilotName, 'Luna');
  assert.equal(preview.profiles[0].attempts, 1);
  assert.equal(preview.profiles[0].accuracy, 0);
  assert.equal(preview.profiles[0].active, true);
});

test('no inventa una reparación para JSON ilegible o estructura desconocida', () => {
  const invalid = createLearningRepairPreview('{"profiles":');
  const unknown = createLearningRepairPreview(JSON.stringify({ data: [] }));

  assert.equal(invalid.status, 'invalid-json');
  assert.equal(invalid.canRepair, false);
  assert.equal(unknown.status, 'invalid-shape');
  assert.equal(unknown.canRepair, false);
});

test('rechaza claves reservadas dentro de una fuente no confiable', () => {
  const source = '{"profiles":{"uno":{"pilotName":"Luna","progress":{"__proto__":{"polluted":true}}}}}';
  const preview = createLearningRepairPreview(source);

  assert.equal(preview.status, 'unsafe');
  assert.equal(preview.canRepair, false);
  assert.match(preview.messages[0], /clave reservada/);
});

test('descarga exactamente el original y usa texto cuando el JSON es ilegible', () => {
  const source = '{"profiles":';
  const file = createLearningRepairOriginalFile(source, {
    createdAt: '2026-08-03T22:00:00.000Z'
  });

  assert.equal(file.content, source);
  assert.equal(file.extension, 'txt');
  assert.match(file.filename, /original-pedagogico/);
  assert.match(file.mime, /text\/plain/);
});

test('aplica solamente la misma fuente que fue previsualizada', () => {
  const source = JSON.stringify({
    version: 0,
    profiles: {
      viejo: {
        pilotName: 'Nova',
        updatedAt: '2026-08-03T10:00:00.000Z',
        progress: progress('Matemáticas')
      }
    }
  });
  const preview = createLearningRepairPreview(source);
  const repaired = applyLearningRepair(source, preview.sourceFingerprint);

  assert.equal(Object.keys(repaired.collection.profiles).length, 1);
  assert.throws(
    () => applyLearningRepair(source + ' ', preview.sourceFingerprint),
    /cambiaron después de la vista previa/
  );
});
