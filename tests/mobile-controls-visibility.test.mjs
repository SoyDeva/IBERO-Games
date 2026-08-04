import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/flight-mobile-cleanup.css', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('los tres controles móviles quedan fijados dentro del viewport visible', () => {
  assert.match(css, /body\.flight-route \.mobile-flight-controls\s*\{[\s\S]*position: fixed !important;/);
  assert.match(css, /bottom: max\(0\.35rem, env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /display: grid !important/);
  assert.match(css, /grid-template-columns: 1fr 1\.12fr 1fr/);
  assert.match(css, /transform: translateX\(-50%\)/);
  assert.match(css, /visibility: visible !important/);
  assert.match(css, /opacity: 1 !important/);
});

test('la página reserva espacio inferior y el escenario no puede recortar los controles', () => {
  assert.match(css, /padding-bottom: calc\(92px \+ max\(0\.35rem, env\(safe-area-inset-bottom\)\)\)/);
  assert.match(css, /padding-bottom: calc\(72px \+ max\(0\.28rem, env\(safe-area-inset-bottom\)\)\)/);
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\)/);
  assert.doesNotMatch(css, /grid-template-rows: minmax\(0, 1fr\) auto/);
});

test('el disparo central conserva mayor presencia y un objetivo táctil seguro', () => {
  assert.match(css, /\.mobile-fire-control\s*\{[\s\S]*min-height: 58px;/);
  assert.match(css, /border: 2px solid #56e7ff/);
  assert.match(css, /\.mobile-flight-controls button\s*\{[\s\S]*min-height: 54px;/);
});

test('la corrección fuerza una caché nueva para reemplazar recursos anteriores', () => {
  assert.match(serviceWorker, /mision-nebula-pin-length-v33/);
  assert.match(serviceWorker, /\.\/css\/flight-mobile-cleanup\.css/);
  assert.match(serviceWorker, /\.\/css\/system-fixes\.css/);
});
