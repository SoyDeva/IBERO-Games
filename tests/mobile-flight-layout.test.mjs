import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/flight-mobile-cleanup.css', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('la corrección móvil elimina las superposiciones observadas en iPhone', () => {
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /body\.flight-route \.sector-badge\s*\{\s*display: none;/);
  assert.match(css, /body\.flight-route \.fullscreen-flight,[\s\S]*body\.flight-route \.music-flight\s*\{\s*display: none;/);
  assert.match(css, /body\.flight-route \.pause-flight,[\s\S]*body\.flight-route \.exit-flight[\s\S]*width: 40px;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls button[\s\S]*min-height: 56px;/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('el HUD móvil conserva controles esenciales y reduce espacio vertical', () => {
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) minmax\(86px, 0\.82fr\)/);
  assert.match(css, /body\.flight-route \.fuel-hud[\s\S]*grid-column: span 2;/);
  assert.match(css, /body\.flight-route \.ammo-hud[\s\S]*grid-column: span 2;/);
  assert.match(css, /body\.flight-route \.distance-hud,[\s\S]*body\.flight-route \.checkpoint-hud[\s\S]*display: none;/);
  assert.match(css, /min-height: 45px/);
});

test('la capa correctiva se carga después del pulido y está disponible sin conexión', () => {
  const polish = indexHtml.indexOf('css/flight-polish.css?v=23');
  const cleanup = indexHtml.indexOf('css/flight-mobile-cleanup.css?v=23');
  const accessibility = indexHtml.indexOf('css/accessibility.css?v=23');

  assert.ok(polish >= 0 && cleanup > polish && accessibility > cleanup);
  assert.match(serviceWorker, /\.\/css\/flight-mobile-cleanup\.css/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});