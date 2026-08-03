import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const controllerSource = await readFile(new URL('../js/ui/learning-tools-controller.js', import.meta.url), 'utf8');

test('app enlaza las herramientas pedagógicas locales mediante su controlador', () => {
  assert.match(appSource, /import \{ bindLearningTools \} from '\.\/ui\/learning-tools-controller\.js\?v=23';/);
  assert.match(appSource, /bindLearningTools\(\{/);
  assert.match(appSource, /store: learningProgressStore/);
  assert.match(appSource, /onChanged: \(message\) =>/);
  assert.doesNotMatch(appSource, /data-export-learning-json.*fetch\(/s);
});

test('el controlador exporta con Blob y no realiza solicitudes de red', () => {
  assert.match(controllerSource, /new Blob/);
  assert.match(controllerSource, /createObjectURL/);
  assert.doesNotMatch(controllerSource, /\bfetch\s*\(|XMLHttpRequest|supabase/i);
});