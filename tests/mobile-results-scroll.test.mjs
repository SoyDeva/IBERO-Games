import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/flight-mobile-cleanup.css', import.meta.url), 'utf8');

test('la bitácora móvil desplaza la pantalla completa sin depender del scroll interno de la tarjeta', () => {
  assert.match(css, /\.flight-overlay:has\(\.stranded-card\)[\s\S]*position: fixed !important;/);
  assert.match(css, /\.flight-overlay:has\(\.stranded-card\)[\s\S]*overflow-y: auto;/);
  assert.match(css, /\.flight-overlay:has\(\.stranded-card\)[\s\S]*touch-action: pan-y;/);
  assert.match(css, /\.flight-overlay:has\(\.stranded-card\)[\s\S]*-webkit-overflow-scrolling: touch;/);
  assert.match(css, /\.flight-overlay:has\(\.stranded-card\) \.stranded-card[\s\S]*max-height: none;/);
  assert.match(css, /\.flight-overlay:has\(\.stranded-card\) \.stranded-card[\s\S]*overflow: visible;/);
});

test('los controles de vuelo no cubren las acciones cuando aparece la derrota', () => {
  assert.match(css, /body\.flight-route:has\(\.stranded-card\) \.mobile-flight-controls,[\s\S]*body\.flight-route:has\(\.stranded-card\) \.flight-stage-actions[\s\S]*visibility: hidden !important;/);
  assert.match(css, /body\.flight-route:has\(\.stranded-card\)[\s\S]*touch-action: pan-y;/);
});
