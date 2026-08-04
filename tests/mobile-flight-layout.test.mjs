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
  assert.match(css, /touch-action: none/);
});

test('la composición móvil elimina superposiciones y fija los controles al viewport', () => {
  assert.match(css, /body\.flight-route \.sector-badge\s*\{\s*display: none;/);
  assert.match(css, /body\.flight-route \.fullscreen-flight,[\s\S]*body\.flight-route \.music-flight\s*\{\s*display: none;/);
  assert.match(css, /body\.flight-route \.pause-flight,[\s\S]*body\.flight-route \.exit-flight[\s\S]*width: 38px;/);
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\)/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls[\s\S]*position: fixed !important;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls[\s\S]*bottom: max\(0\.35rem, env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls button[\s\S]*min-height: 54px;/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('los botones móviles reciben el gesto sin que Canvas o sus hijos lo intercepten', () => {
  assert.match(css, /body\.flight-route \.flight-stage[\s\S]*isolation: isolate;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls[\s\S]*pointer-events: auto;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls button[\s\S]*pointer-events: auto;[\s\S]*touch-action: none;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls button > \*[\s\S]*pointer-events: none;/);
  assert.match(css, /body\.flight-route \.mobile-flight-controls button\.is-pressed/);
  assert.match(css, /-webkit-touch-callout: none;/);
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
  const cleanup = indexHtml.indexOf('css/flight-mobile-cleanup.css?v=24');
  const systemFixes = indexHtml.indexOf('css/system-fixes.css?v=24');
  const accessibility = indexHtml.indexOf('css/accessibility.css?v=23');

  assert.ok(polish >= 0 && cleanup > polish && systemFixes > cleanup && accessibility > systemFixes);
  assert.match(serviceWorker, /mision-nebula-pin-length-v33/);
  assert.match(serviceWorker, /\.\/css\/flight-mobile-cleanup\.css/);
  assert.match(serviceWorker, /\.\/css\/system-fixes\.css/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});
