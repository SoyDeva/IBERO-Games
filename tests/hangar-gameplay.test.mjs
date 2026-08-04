import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('el Hangar presenta habilidades, sistemas y configuración activa', async () => {
  const source = await read('js/ui/hangar-screen.js');

  assert.match(source, /HABILIDAD PASIVA/);
  assert.match(source, /VENTAJA INSTALADA/);
  assert.match(source, /CONFIGURACIÓN ACTIVA/);
  assert.match(source, /data-buy-item/);
  assert.match(source, /data-equip-item/);
  assert.match(source, /data-kind=/);
  assert.match(source, /data-item=/);
  assert.match(source, /data-nav="flight" data-mode="mission"/);
  assert.match(source, /escapeHtml\(perk\.name\)/);
  assert.match(source, /escapeHtml\(perk\.description\)/);
});

test('la capa visual del Hangar funcional se carga antes de accesibilidad y no usa red', async () => {
  const html = await read('index.html');
  const css = await read('css/hangar-gameplay.css');
  const gameplayIndex = html.indexOf('css/hangar-gameplay.css?v=23');
  const accessibilityIndex = html.indexOf('css/accessibility.css?v=23');

  assert.ok(gameplayIndex > 0);
  assert.ok(accessibilityIndex > gameplayIndex);
  assert.match(css, /\.active-loadout\s*\{/);
  assert.match(css, /\.hangar-perk\s*\{/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /@import|https?:\/\/|url\s*\(/i);
});
