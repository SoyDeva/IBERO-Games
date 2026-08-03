import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const screens = readFileSync(new URL('../js/ui/static-screens.js', import.meta.url), 'utf8');
const tools = readFileSync(new URL('../js/ui/learning-tools-controller.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../css/learning-progress.css', import.meta.url), 'utf8');

test('app inicia y cierra el historial pedagógico por sesión', () => {
  assert.match(app, /let learningSessionBaseline = null/);
  assert.match(app, /learningSessionBaseline = learningProgressStore\.load\(\)/);
  assert.match(app, /learningProgressStore\.completeSession\(\{/);
  assert.match(app, /baseline: learningSessionBaseline/);
  assert.match(app, /learningSessionBaseline = null/);
});

test('la guía docente recibe el resumen local y delega impresión y exportación', () => {
  assert.match(app, /renderTeacher\(\{ learning: learningProgressStore\.summary\(\), pilotName: getPilotName\(\) \}\)/);
  assert.match(app, /bindLearningTools\(\{/);
  assert.match(tools, /data-print-learning-report/);
  assert.match(tools, /windowRef\?\.print\?\.\(\)/);
  assert.match(tools, /data-export-learning-json/);
  assert.match(screens, /renderTeacherLearningReport/);
  assert.match(styles, /teacher-learning-report/);
});