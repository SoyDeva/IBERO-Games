import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { renderLearningRecoveryPanel } from '../js/ui/learning-recovery-panel.js';

test('representa el punto de recuperación con contenido escapado y acciones explícitas', () => {
  const html = renderLearningRecoveryPanel({
    available: true,
    label: '<eliminación>',
    createdAt: '2026-08-03T21:00:00.000Z'
  });

  assert.match(html, /Punto de recuperación disponible/);
  assert.match(html, /data-undo-learning-change/);
  assert.match(html, /data-dismiss-learning-recovery/);
  assert.match(html, /&lt;eliminación&gt;/);
  assert.doesNotMatch(html, /<eliminación>/);
});

test('no muestra controles cuando el punto ya no está disponible', () => {
  assert.equal(renderLearningRecoveryPanel(null), '');
  assert.equal(renderLearningRecoveryPanel({ available: false }), '');
});

test('el controlador enlaza deshacer y descartar mediante el almacén especializado', async () => {
  const source = await readFile(new URL('../js/ui/learning-tools-controller.js', import.meta.url), 'utf8');
  assert.match(source, /store\.undoLastDestructiveChange\(\)/);
  assert.match(source, /store\.dismissRecovery\(\)/);
  assert.match(source, /data-undo-learning-change/);
  assert.match(source, /data-dismiss-learning-recovery/);
});
