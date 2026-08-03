import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('la portada carga la capa visual antes de accesibilidad', async () => {
  const html = await read('index.html');
  const visualIndex = html.indexOf('css/nebula-bright.css?v=23');
  const accessibilityIndex = html.indexOf('css/accessibility.css?v=23');

  assert.ok(visualIndex > 0);
  assert.ok(accessibilityIndex > visualIndex);
  assert.match(html, /meta name="theme-color" content="#0b071b"/);
});

test('Nébula brillante define identidad, respuesta móvil y reducción de movimiento sin red', async () => {
  const css = await read('css/nebula-bright.css');

  assert.match(css, /--color-space|--ink: #f7f8ff/);
  assert.match(css, /\.site-header\s*\{/);
  assert.match(css, /\.flight-home\s*\{/);
  assert.match(css, /\.home-actions \.launch-button\s*\{/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});

test('la mejora visual conserva las acciones funcionales de Inicio', async () => {
  const source = await read('js/ui/home-screen.js');

  assert.match(source, /data-nav="flight" data-mode="mission"/);
  assert.match(source, /data-nav="shop"/);
  assert.match(source, /data-nav="ranking"/);
  assert.match(source, /data-nav="flight" data-mode="tutorial"/);
  assert.match(source, /data-nav="flight" data-mode="practice"/);
  assert.match(source, /data-change-pilot/);
});
