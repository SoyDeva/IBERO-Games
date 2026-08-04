import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const inputController = readFileSync(new URL('../js/services/flight-input-controller.js', import.meta.url), 'utf8');
const excitementRenderer = readFileSync(new URL('../js/ui/flight-excitement-renderer.js', import.meta.url), 'utf8');

test('el Canvas ignora gestos secundarios y bloquea desplazamientos del navegador', () => {
  assert.match(inputController, /if \(event\?\.isPrimary === false\) return;/);
  assert.match(inputController, /if \(Number\.isFinite\(event\?\.button\) && event\.button !== 0\) return;/);
  assert.match(inputController, /event\.preventDefault\?\.\(\);[\s\S]*canvas\.getBoundingClientRect\(\)/);
  assert.match(inputController, /canvas\.addEventListener\('pointerdown', onPointer, \{ passive: false \}\)/);
});

test('el controlador captura el click antes de listeners heredados y evita acciones dobles', () => {
  assert.match(inputController, /const CONTROL_CLICK_CAPTURE = true;/);
  assert.match(inputController, /addEventListener\('click', onControlClick, CONTROL_CLICK_CAPTURE\)/);
  assert.match(inputController, /removeEventListener\('click', onControlClick, CONTROL_CLICK_CAPTURE\)/);
  assert.match(inputController, /stopImmediatePropagation/);
  assert.match(inputController, /SYNTHETIC_CLICK_WINDOW_MS/);
});

test('la capa móvil conserva guías nítidas sin un segundo dibujo de la nave', () => {
  assert.match(excitementRenderer, /Mantiene guías nítidas/);
  assert.match(excitementRenderer, /strokeStyle = 'rgba\(86,231,255,\.58\)'/);
  assert.doesNotMatch(excitementRenderer, /drawCrispShip|shipHullPath|SHIP_SKINS|SHIP_TRAILS/);
  assert.doesNotMatch(excitementRenderer, /Máscara oscura|rgba\(5,5,18,\.96\)/);
});
