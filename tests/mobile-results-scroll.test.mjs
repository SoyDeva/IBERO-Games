import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/system-fixes.css', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../js/ui/game-over-screen.js', import.meta.url), 'utf8');

test('la bitácora móvil desplaza la pantalla completa con un estado explícito', () => {
  assert.match(css, /\.flight-stage\.game-over-active \.flight-overlay[\s\S]*position: fixed !important;/);
  assert.match(css, /\.flight-stage\.game-over-active \.flight-overlay[\s\S]*overflow-y: auto;/);
  assert.match(css, /\.flight-stage\.game-over-active \.flight-overlay[\s\S]*touch-action: pan-y;/);
  assert.match(css, /\.flight-stage\.game-over-active \.flight-overlay[\s\S]*-webkit-overflow-scrolling: touch;/);
  assert.match(css, /\.flight-stage\.game-over-active \.stranded-card[\s\S]*max-height: none;/);
  assert.match(css, /\.flight-stage\.game-over-active \.stranded-card[\s\S]*overflow: visible;/);
  assert.doesNotMatch(css, /:has\(/);
});

test('el renderizador activa y limpia el estado de derrota', () => {
  assert.match(screen, /classList\?\.add\?\.\('game-over-active'\)/);
  assert.match(screen, /classList\?\.remove\?\.\('game-over-active'\)/);
  assert.match(screen, /overlay\.scrollTop = 0/);
});

test('los controles de vuelo no cubren las acciones cuando aparece la derrota', () => {
  assert.match(css, /\.flight-stage\.game-over-active \.mobile-flight-controls,[\s\S]*\.flight-stage\.game-over-active \.flight-stage-actions[\s\S]*visibility: hidden !important;/);
  assert.match(css, /\.flight-stage\.game-over-active[\s\S]*touch-action: pan-y;/);
});
