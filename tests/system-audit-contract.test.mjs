import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { SHIP_SKINS, SHIP_TRAILS } from '../js/config/ship-catalog.js';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const galacticErrors = readFileSync(new URL('../js/core/galactic-errors.js', import.meta.url), 'utf8');
const galacticService = readFileSync(new URL('../js/services/galactic-league-service.js', import.meta.url), 'utf8');
const compatibility = readFileSync(new URL('../js/compatibility.js', import.meta.url), 'utf8');
const scoreMigration = readFileSync(new URL('../supabase/migrations/20260804225000_align_galactic_score_validation.sql', import.meta.url), 'utf8');
const pinMigration = readFileSync(new URL('../supabase/migrations/20260804180700_extend_galactic_pin_length.sql', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('el formulario presenta la contraseña como requisito real', () => {
  assert.match(indexHtml, /<span>Contraseña del apodo<\/span>/);
  assert.match(indexHtml, /id="pilot-pin"[^>]*type="password"[^>]*required[^>]*minlength="4"[^>]*maxlength="12"/);
  assert.match(indexHtml, /placeholder="4 a 12 caracteres"/);
  assert.doesNotMatch(indexHtml, /Contraseña del apodo[^<]*<small>\(opcional\)<\/small>/);
});

test('cliente, interfaz y base de datos comparten el límite de 12 caracteres', () => {
  assert.match(appSource, /pin\.length > 12/);
  assert.match(appSource, /entre 4 y 12 caracteres/);
  assert.match(galacticService, /const MAX_PIN_LENGTH = 12;/);
  assert.match(galacticErrors, /entre 4 y 12 caracteres/);
  assert.match(pinMigration, /char_length\(v_pin\) not between 4 and 12/);
  assert.match(pinMigration, /security definer/);
  assert.match(pinMigration, /set search_path = pg_catalog, public, private, extensions/);
});

test('el respaldo de ResizeObserver carga antes del módulo principal y queda disponible sin conexión', () => {
  const compatibilityPosition = indexHtml.indexOf('js/compatibility.js?v=24');
  const appPosition = indexHtml.indexOf('js/app.js?v=25');
  assert.ok(compatibilityPosition >= 0 && appPosition > compatibilityPosition);
  assert.match(compatibility, /typeof globalThis\.ResizeObserver === 'function'/);
  assert.match(compatibility, /globalThis\.ResizeObserver = ResizeObserverFallback/);
  assert.match(serviceWorker, /\.\/js\/compatibility\.js/);
});

test('la migración de la Liga acepta todo el catálogo vigente', () => {
  for (const skin of Object.keys(SHIP_SKINS)) {
    assert.match(scoreMigration, new RegExp("'" + skin + "'"), `falta la nave ${skin}`);
  }
  for (const trail of Object.keys(SHIP_TRAILS)) {
    assert.match(scoreMigration, new RegExp("'" + trail + "'"), `falta la estela ${trail}`);
  }
  assert.match(scoreMigration, /v_max_destroyed := 12 \+ 8 \* p_checkpoints/);
  assert.match(scoreMigration, /security definer/);
  assert.match(scoreMigration, /set search_path = pg_catalog, public, private, extensions/);
  assert.match(scoreMigration, /enforce_galactic_rate_limit\('score'/);
});
