import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('app registra respuestas y entrega progreso al selector adaptativo', () => {
  assert.match(appSource, /createLearningProgressStore/);
  assert.match(appSource, /adaptiveQuestionIndex/);
  assert.match(appSource, /learningProgressStore\.summary\(\)/);
  assert.match(appSource, /questionSession\.next\(meta\.number, \{ progress: learningProgressStore\.load\(\) \}\)/);
  assert.match(appSource, /learningProgressStore\.record\(\{\s*question: questionSession\.getCurrent\(\),\s*correct: outcome\.correct,\s*mode: flightMode\s*\}\)/s);
});

test('la portada carga los estilos del panel pedagógico', () => {
  assert.match(indexSource, /css\/learning-progress\.css\?v=23/);
});
