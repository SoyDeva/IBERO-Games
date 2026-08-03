import assert from 'node:assert/strict';
import test from 'node:test';
import { renderStorageDiagnosticsPanel } from '../js/ui/storage-diagnostics-panel.js';
import { bindLearningTools } from '../js/ui/learning-tools-controller.js';

test('representa estado, métricas y problemas sin inyectar HTML', () => {
  const html = renderStorageDiagnosticsPanel({
    status: 'warning',
    totalText: '12 KB',
    appText: '8 KB',
    learningText: '5 KB',
    profileCount: 2,
    damagedProfiles: 1,
    readable: true,
    writable: true,
    cleanupCount: 2,
    issues: [{ level: 'warning', cleanable: true, message: '<dato antiguo>' }]
  });

  assert.match(html, /Diagnóstico de almacenamiento local/);
  assert.match(html, /12 KB/);
  assert.match(html, /data-cleanup-learning-storage/);
  assert.match(html, /data-refresh-learning-storage/);
  assert.match(html, /&lt;dato antiguo&gt;/);
  assert.doesNotMatch(html, /<dato antiguo>/);
});

test('oculta limpieza cuando no existen elementos obsoletos y bloquea visualmente el estado crítico', () => {
  const html = renderStorageDiagnosticsPanel({
    status: 'critical',
    totalText: '0 B',
    appText: '0 B',
    learningText: '0 B',
    cleanupCount: 0,
    readable: false,
    writable: false,
    issues: [{ level: 'critical', message: 'Lectura bloqueada.' }]
  });

  assert.match(html, /Requiere atención/);
  assert.match(html, /respaldos e importaciones quedan bloqueados/);
  assert.doesNotMatch(html, /data-cleanup-learning-storage/);
});

test('el controlador confirma la limpieza y solicita un nuevo render', () => {
  let cleanupCalls = 0;
  let changedMessage = '';
  let clickHandler = null;
  const cleanupButton = {
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler;
    }
  };
  const refreshButton = { addEventListener() {} };
  const root = {
    querySelector(selector) {
      if (selector === '[data-cleanup-learning-storage]') return cleanupButton;
      if (selector === '[data-refresh-learning-storage]') return refreshButton;
      return null;
    },
    querySelectorAll() { return []; }
  };
  const store = {
    recoveryInfo: () => null,
    cleanupObsoleteStorage() {
      cleanupCalls += 1;
      return { removed: ['antiguo', 'cache'] };
    },
    storageInfo: () => ({ status: 'ok' })
  };
  const controller = bindLearningTools({
    root,
    store,
    onChanged(message) { changedMessage = message; },
    windowRef: { confirm: () => true }
  });

  assert.equal(typeof clickHandler, 'function');
  const result = controller.cleanupStorage();
  assert.equal(cleanupCalls, 1);
  assert.equal(result.removed.length, 2);
  assert.match(changedMessage, /2 elementos eliminados/);
});
