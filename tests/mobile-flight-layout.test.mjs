import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/flight-mobile-cleanup.css', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('la vista de vuelo queda anclada al viewport y no conserva desplazamiento previo', () => {
  assert.match(css, /@media \(max-width: 850px\)[\s\S]*body\.flight-route\s*\{[\s\S]*position: fixed;/);
  assert.match(css, /width: var\(--flight-viewport-width\)/);
  assert.match(css, /height: var\(--flight-viewport-height\)/);
  assert.match(css, /overscroll-behavior: none/);
});

test('la composición móvil elimina superposiciones y reserva una fila para controles', () => {
  assert.match(css, /body\.flight-route \.sector-badge\s*\{\s*display: none;/);
  assert.match(css, /body\.flight-route \.fullscreen-flight,[\s\S]*body\.flight-route \.music-flight\s*\{\s*display: none;/);
  assert.match(css, /body\.flight-route \.pause-flight,[\s\S]*body\.flight-route \.exit-flight[\s\S]*width: 38px;/);
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) auto/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls[\s\S]*position: relative;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls[\s\S]*grid-row: 2;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls button[\s\S]*min-height: 52px;/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('el HUD móvil usa dos columnas compactas y mantiene los cuatro datos esenciales', () => {
  assert.match(css, /grid-template-columns: minmax\(0, 1\.18fr\) minmax\(0, 0\.82fr\)/);
  assert.match(css, /body\.flight-route \.fuel-hud,[\s\S]*body\.flight-route \.difficulty-hud[\s\S]*grid-column: 1;/);
  assert.match(css, /body\.flight-route \.hull-hud,[\s\S]*body\.flight-route \.ammo-hud[\s\S]*grid-column: 2;/);
  assert.match(css, /body\.flight-route \.distance-hud,[\s\S]*body\.flight-route \.checkpoint-hud[\s\S]*display: none;/);
  assert.match(css, /min-height: 38px/);
});

test('la capa correctiva conserva orden, caché local y ausencia de dependencias remotas', () => {
  const polish = indexHtml.indexOf('css/flight-polish.css?v=23');
  const cleanup = indexHtml.indexOf('css/flight-mobile-cleanup.css?v=23');
  const accessibility = indexHtml.indexOf('css/accessibility.css?v=23');

  assert.ok(polish >= 0 && cleanup > polish && accessibility > cleanup);
  assert.match(serviceWorker, /mision-nebula-mobile-overhaul-v29/);
  assert.match(serviceWorker, /\.\/css\/flight-mobile-cleanup\.css/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});
