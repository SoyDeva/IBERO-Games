import assert from 'node:assert/strict';
import test from 'node:test';
import { bindLearningRepairTools } from '../js/ui/learning-repair-controller.js';
import { renderLearningRepairPanel } from '../js/ui/learning-repair-panel.js';

function createButton() {
  return {
    disabled: true,
    attributes: {},
    listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
}

function createDownloadEnvironment() {
  let clicked = false;
  const link = {
    hidden: false,
    click() { clicked = true; },
    remove() {}
  };
  return {
    documentRef: {
      body: { append() {} },
      createElement() { return link; }
    },
    windowRef: {
      Blob,
      URL: {
        createObjectURL() { return 'blob:repair'; },
        revokeObjectURL() {}
      },
      setTimeout(callback) { callback(); },
      confirm() { return true; }
    },
    link,
    clicked: () => clicked
  };
}

test('representa una vista previa segura y escapa apodos no confiables', () => {
  const html = renderLearningRepairPanel({
    sourcePresent: true,
    status: 'repairable',
    canRepair: true,
    sourceEntryCount: 2,
    recoveredCount: 1,
    droppedCount: 1,
    sourceBytes: 300,
    messages: ['Se excluirá <contenido>.'],
    profiles: [{ pilotName: '<Luna>', attempts: 3, accuracy: 67, sessions: 1, active: true }]
  });

  assert.match(html, /Descargar contenido original/);
  assert.match(html, /Guardar versión reparada/);
  assert.match(html, /disabled/);
  assert.match(html, /&lt;Luna&gt;/);
  assert.match(html, /&lt;contenido&gt;/);
  assert.doesNotMatch(html, /<Luna>|<contenido>/);
});

test('un original ilegible solo ofrece descarga y nunca guardar', () => {
  const html = renderLearningRepairPanel({
    sourcePresent: true,
    status: 'invalid-json',
    canRepair: false,
    sourceBytes: 12,
    messages: ['No es JSON legible.'],
    profiles: []
  });

  assert.match(html, /Descargar contenido original/);
  assert.doesNotMatch(html, /Guardar versión reparada/);
});

test('habilita la reparación solo después de descargar el original', () => {
  const downloadButton = createButton();
  const applyButton = createButton();
  const status = { textContent: '' };
  const root = {
    querySelector(selector) {
      if (selector === '[data-download-learning-repair-original]') return downloadButton;
      if (selector === '[data-apply-learning-repair]') return applyButton;
      if (selector === '[data-learning-tools-status]') return status;
      return null;
    }
  };
  let applied = null;
  let changedMessage = '';
  const repairStore = {
    preview() {
      return {
        canRepair: true,
        sourceFingerprint: 'fnv1a32:12345678',
        recoveredCount: 2,
        droppedCount: 1
      };
    },
    createOriginalFile() {
      return {
        content: '{"original":true}',
        mime: 'application/json;charset=utf-8',
        filename: 'original.json'
      };
    },
    applyRepair(fingerprint, options) {
      applied = { fingerprint, options };
      return { recoveredCount: 2 };
    }
  };
  const environment = createDownloadEnvironment();
  const controller = bindLearningRepairTools({
    root,
    repairStore,
    documentRef: environment.documentRef,
    windowRef: environment.windowRef,
    onChanged(message) { changedMessage = message; }
  });

  assert.equal(controller.applyRepair(), null);
  assert.match(status.textContent, /Descarga primero/);
  const file = controller.downloadOriginal();
  assert.equal(file.filename, 'original.json');
  assert.equal(environment.clicked(), true);
  assert.equal(applyButton.disabled, false);
  assert.equal(applyButton.attributes['aria-disabled'], 'false');

  const result = controller.applyRepair();
  assert.equal(result.recoveredCount, 2);
  assert.deepEqual(applied, {
    fingerprint: 'fnv1a32:12345678',
    options: { originalDownloaded: true }
  });
  assert.match(changedMessage, /2 perfiles recuperados/);
});
