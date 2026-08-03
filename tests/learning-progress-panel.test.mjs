import assert from 'node:assert/strict';
import test from 'node:test';
import { renderLearningProgressPanel } from '../js/ui/learning-progress-panel.js';

test('explica el panel antes de tener respuestas', () => {
  const html = renderLearningProgressPanel({ hasData: false });
  assert.match(html, /Tu panel pedagógico/);
  assert.match(html, /No es una calificación/);
});

test('representa métricas, refuerzos y fortalezas de forma segura', () => {
  const html = renderLearningProgressPanel({
    hasData: true,
    attempts: 8,
    accuracy: 75,
    bestStreak: 4,
    focus: [{ name: '<Matemáticas>', status: 'En refuerzo', accuracy: 40 }],
    strength: { name: 'Ciencias & Espacio', accuracy: 100 },
    recommendation: 'Practica <álgebra>.'
  });

  assert.match(html, /8/);
  assert.match(html, /75%/);
  assert.match(html, /🔥 4/);
  assert.match(html, /&lt;Matemáticas&gt;/);
  assert.match(html, /Ciencias &amp; Espacio/);
  assert.match(html, /Practica &lt;álgebra&gt;\./);
  assert.doesNotMatch(html, /<Matemáticas>/);
});
