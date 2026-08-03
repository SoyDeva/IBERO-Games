import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bindLearningTools,
  downloadLearningBackup,
  downloadLearningDeviceBackup,
  downloadLearningExport
} from '../js/ui/learning-tools-controller.js';
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

test('descarga el respaldo consolidado preparado por el almacén', () => {
  const environment = createDownloadEnvironment();
  const file = downloadLearningDeviceBackup({
    store: {
      createDeviceBackup() {
        return {
          content: '{"schema":"mision-nebula-learning-device-backup-v1"}',
          mime: 'application/json;charset=utf-8',
          filename: 'dispositivo.json',
          backup: { profileCount: 2 }
        };
      }
    },
    documentRef: environment.documentRef,
    windowRef: environment.windowRef
  });

  assert.equal(file.filename, 'dispositivo.json');
  assert.equal(environment.link.download, 'dispositivo.json');
  assert.equal(environment.state().clicked, true);
});

test('importa únicamente después de seleccionar, confirmar y verificar un archivo local', async () => {
  let imported = '';
  let changedMessage = '';
  const status = { textContent: '' };
  const importInput = {
    value: 'respaldo.json',
    files: [{ size: 200, text: async () => '{"respaldo":true}' }],
    addEventListener() {}
  };
  const root = {
    querySelector(selector) {
      if (selector === '[data-import-learning]') return importInput;
      if (selector === '[data-learning-tools-status]') return status;
      return null;
    }
  };
  const store = {
    importBackup(content) {
      imported = content;
      return { pilotName: 'Luna' };
    }
  };
  const controller = bindLearningTools({
    root,
    store,
    pilotName: 'Luna',
    onChanged(message) { changedMessage = message; },
    windowRef: { confirm: () => true }
  });

  const result = await controller.importProgress();
  assert.equal(result.pilotName, 'Luna');
  assert.equal(imported, '{"respaldo":true}');
  assert.match(changedMessage, /verificado e importado/);
  assert.equal(importInput.value, '');
});

test('previsualiza antes de restaurar y aplica únicamente las decisiones visibles', async () => {
  let restoreCalls = 0;
  let changedMessage = '';
  const status = { textContent: '' };
  const deviceInput = {
    value: 'dispositivo.json',
    files: [{ size: 400, text: async () => '{"respaldo":"consolidado"}' }],
    addEventListener() {}
  };
  const applyButton = { addEventListener() {} };
  const cancelButton = { addEventListener() {} };
  const checkboxes = [
    { value: 'pilot-luna', checked: true },
    { value: 'pilot-nova', checked: true }
  ];
  const previewContainer = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '[data-apply-learning-device-restore]') return applyButton;
      if (selector === '[data-cancel-learning-device-restore]') return cancelButton;
      if (selector === '[data-restore-learning-action="pilot-luna"]') return { value: 'keep' };
      return null;
    },
    querySelectorAll(selector) {
      return selector === '[data-restore-learning-profile]' ? checkboxes : [];
    }
  };
  const root = {
    querySelector(selector) {
      if (selector === '[data-import-learning-device]') return deviceInput;
      if (selector === '[data-learning-device-restore-preview]') return previewContainer;
      if (selector === '[data-learning-tools-status]') return status;
      return null;
    },
    querySelectorAll() { return []; }
  };
  const store = {
    previewDeviceBackup(content) {
      assert.equal(content, '{"respaldo":"consolidado"}');
      return {
        exportedAt: '2026-08-03T12:00:00.000Z',
        newProfileCount: 1,
        conflictCount: 1,
        profiles: [
          { id: 'pilot-luna', pilotName: 'Luna', conflict: true, active: true, incoming: { attempts: 2, accuracy: 50, sessions: 1, updatedAt: '2026-08-03T10:00:00.000Z' }, local: { attempts: 1, accuracy: 100, sessions: 0, updatedAt: '2026-08-02T10:00:00.000Z' } },
          { id: 'pilot-nova', pilotName: 'Nova', conflict: false, active: false, incoming: { attempts: 1, accuracy: 100, sessions: 0, updatedAt: '2026-08-03T11:00:00.000Z' }, local: null }
        ]
      };
    },
    restoreDeviceBackup(content, decisions) {
      restoreCalls += 1;
      assert.equal(content, '{"respaldo":"consolidado"}');
      assert.deepEqual(decisions, [
        { profileId: 'pilot-luna', action: 'keep' },
        { profileId: 'pilot-nova', action: 'add' }
      ]);
      return { added: 1, replaced: 0, kept: 1 };
    }
  };
  const controller = bindLearningTools({
    root,
    store,
    onChanged(message) { changedMessage = message; },
    windowRef: { confirm: () => true }
  });

  const preview = await controller.previewDeviceRestore();
  assert.equal(preview.newProfileCount, 1);
  assert.equal(restoreCalls, 0);
  assert.match(previewContainer.innerHTML, /Vista previa verificada/);
  assert.match(status.textContent, /Revisa la selección/);

  const restored = controller.applyDeviceRestore();
  assert.equal(restored.added, 1);
  assert.equal(restoreCalls, 1);
  assert.match(changedMessage, /Restauración consolidada completada/);
  assert.equal(deviceInput.value, '');
  assert.equal(previewContainer.innerHTML, '');
});

test('elimina un perfil inactivo únicamente después de confirmación', () => {
  let changedMessage = '';
  const button = {
    dataset: { deleteLearningProfile: 'pilot-luna', learningProfileName: 'Luna' },
    addEventListener() {}
  };
  const root = {
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === '[data-delete-learning-profile]' ? [button] : []; }
  };
  const store = {
    removeProfile(profileId) {
      assert.equal(profileId, 'pilot-luna');
      return { removed: { pilotName: 'Luna' } };
    }
  };
  const controller = bindLearningTools({
    root,
    store,
    onChanged(message) { changedMessage = message; },
    windowRef: { confirm: () => true }
  });

  const result = controller.deleteProfile(button);
  assert.equal(result.removed.pilotName, 'Luna');
  assert.match(changedMessage, /eliminado del dispositivo/);
});

test('presenta metas, perfiles, seguimiento, respaldos e importación con contenido escapado', () => {
  const html = renderTeacherLearningReport({
    pilotName: '<Piloto>',
    learning: {
      profileId: 'pilot-activo',
      profileName: '<Piloto>',
      profileCount: 2,
      customGoal: { mode: 'both', targetAnswers: 10, targetAccuracy: 80, focusCategory: '<Ciencias>' },
      longitudinalTracking: true,
      goal: { text: 'Responder 10 preguntas.', custom: true },
      categories: [{ name: '<Ciencias>', attempts: 2, correct: 1, incorrect: 1, accuracy: 50, status: 'En refuerzo' }],
      trend: { available: false, text: 'Falta otra sesión.' },
      recentSessions: [],
      availableProfiles: [
        { id: 'pilot-activo', pilotName: '<Piloto>', active: true, attempts: 2, accuracy: 50, sessions: 0, goalRate: 0 },
        { id: 'pilot-otro', pilotName: '<Otro>', active: false, attempts: 1, accuracy: 100, sessions: 1, goalRate: 100 }
      ]
    }
  });

  assert.match(html, /Guardar meta/);
  assert.match(html, /Seguimiento longitudinal ampliado/);
  assert.match(html, /Exportar reporte JSON/);
  assert.match(html, /Exportar CSV/);
  assert.match(html, /Respaldar perfil activo/);
  assert.match(html, /Respaldar todos los perfiles/);
  assert.match(html, /data-import-learning/);
  assert.match(html, /data-import-learning-device/);
  assert.match(html, /data-learning-device-restore-preview/);
  assert.match(html, /2 perfiles guardados/);
  assert.match(html, /data-learning-tracking checked/);
  assert.match(html, /data-delete-learning-profile="pilot-otro"/);
  assert.match(html, /&lt;Ciencias&gt;/);
  assert.match(html, /&lt;Piloto&gt;/);
  assert.match(html, /&lt;Otro&gt;/);
  assert.doesNotMatch(html, /<Ciencias>|<Piloto>|<Otro>/);
});
