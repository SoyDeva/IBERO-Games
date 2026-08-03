import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadLearningBackup, downloadLearningExport } from '../js/ui/learning-tools-controller.js';
import { renderTeacherLearningReport } from '../js/ui/teacher-learning-report.js';
import { createLearningProgress } from '../js/core/learning-progress.js';

function createDownloadEnvironment() {
  let clicked = false;
  let appended = false;
  let revoked = '';
  const link = {
    hidden: false,
    click() { clicked = true; },
    remove() {}
  };
  const documentRef = {
    body: { append() { appended = true; } },
    createElement(tag) {
      assert.equal(tag, 'a');
      return link;
    }
  };
  const windowRef = {
    URL: {
      createObjectURL() { return 'blob:local-learning-export'; },
      revokeObjectURL(value) { revoked = value; }
    },
    setTimeout(callback) { callback(); }
  };
  return { documentRef, windowRef, link, state: () => ({ clicked, appended, revoked }) };
}

test('crea una descarga local únicamente después de una acción explícita', () => {
  const environment = createDownloadEnvironment();
  const file = downloadLearningExport({
    progress: createLearningProgress(),
    pilotName: 'Piloto',
    format: 'json',
    documentRef: environment.documentRef,
    windowRef: environment.windowRef
  });
  const state = environment.state();

  assert.equal(state.clicked, true);
  assert.equal(state.appended, true);
  assert.equal(environment.link.download, file.filename);
  assert.equal(state.revoked, 'blob:local-learning-export');
});

test('descarga el respaldo preparado por el almacén sin usar red', () => {
  const environment = createDownloadEnvironment();
  const file = downloadLearningBackup({
    store: {
      createBackup() {
        return {
          content: '{"schema":"mision-nebula-learning-backup-v1"}',
          mime: 'application/json;charset=utf-8',
          filename: 'respaldo.json'
        };
      }
    },
    documentRef: environment.documentRef,
    windowRef: environment.windowRef
  });

  assert.equal(file.filename, 'respaldo.json');
  assert.equal(environment.link.download, 'respaldo.json');
  assert.equal(environment.state().clicked, true);
});

test('presenta metas, perfiles, seguimiento, respaldo e importación con contenido escapado', () => {
  const html = renderTeacherLearningReport({
    pilotName: '<Piloto>',
    learning: {
      profileName: '<Piloto>',
      profileCount: 2,
      customGoal: { mode: 'both', targetAnswers: 10, targetAccuracy: 80, focusCategory: '<Ciencias>' },
      longitudinalTracking: true,
      goal: { text: 'Responder 10 preguntas.', custom: true },
      categories: [{ name: '<Ciencias>', attempts: 2, correct: 1, incorrect: 1, accuracy: 50, status: 'En refuerzo' }],
      trend: { available: false, text: 'Falta otra sesión.' },
      recentSessions: []
    }
  });

  assert.match(html, /Guardar meta/);
  assert.match(html, /Seguimiento longitudinal ampliado/);
  assert.match(html, /Exportar reporte JSON/);
  assert.match(html, /Exportar CSV/);
  assert.match(html, /Crear respaldo verificable/);
  assert.match(html, /data-import-learning/);
  assert.match(html, /2 perfiles guardados/);
  assert.match(html, /data-learning-tracking checked/);
  assert.match(html, /&lt;Ciencias&gt;/);
  assert.match(html, /&lt;Piloto&gt;/);
  assert.doesNotMatch(html, /<Ciencias>|<Piloto>/);
});
