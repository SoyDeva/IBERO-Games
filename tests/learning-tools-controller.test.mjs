import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadLearningExport } from '../js/ui/learning-tools-controller.js';
import { renderTeacherLearningReport } from '../js/ui/teacher-learning-report.js';
import { createLearningProgress } from '../js/core/learning-progress.js';

test('crea una descarga local únicamente después de una acción explícita', () => {
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

  const file = downloadLearningExport({
    progress: createLearningProgress(),
    pilotName: 'Piloto',
    format: 'json',
    documentRef,
    windowRef
  });

  assert.equal(clicked, true);
  assert.equal(appended, true);
  assert.equal(link.download, file.filename);
  assert.equal(revoked, 'blob:local-learning-export');
});

test('presenta metas, seguimiento y exportación con contenido escapado', () => {
  const html = renderTeacherLearningReport({
    learning: {
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
  assert.match(html, /Exportar JSON/);
  assert.match(html, /Exportar CSV/);
  assert.match(html, /data-learning-tracking checked/);
  assert.match(html, /&lt;Ciencias&gt;/);
  assert.doesNotMatch(html, /<Ciencias>/);
});