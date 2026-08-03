import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSeasonCode } from '../js/galactic-league.js';

test('normaliza versiones numéricas para Supabase', () => {
  assert.equal(normalizeSeasonCode('23'), 'v23');
});

test('evita duplicar el prefijo de versión', () => {
  assert.equal(normalizeSeasonCode('v23'), 'v23');
  assert.equal(normalizeSeasonCode('vv23'), 'v23');
});

test('genera una temporada local válida', () => {
  assert.equal(normalizeSeasonCode(''), 'vlocal');
  assert.equal(normalizeSeasonCode(null), 'vlocal');
});

test('elimina caracteres incompatibles con la función SQL', () => {
  assert.equal(normalizeSeasonCode(' versión 23 / beta '), 'vversin23beta');
});
