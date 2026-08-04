import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { SHIP_SKINS, SHIP_TRAILS } from '../js/config/ship-catalog.js';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const compatibility = readFileSync(new URL('../js/compatibility.js', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260804225000_align_galactic_score_validation.sql', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('el formulario presenta la contraseña como requisito real', () => {
  assert.match(indexHtml, /<span>Contraseña del apodo<\/span>/);
  assert.match(indexHtml, /id="pilot-pin"[^>]*type="password"[^>]*required[^>]*minlength="4"[^>]*maxlength="8"/);
  assert.doesNotMatch(indexHtml, /Contraseña del apodo[^<]*<small>\(opcional\)<\/small>/);
});

test('el respaldo de ResizeObserver carga antes del módulo principal y queda disponible sin conexión', () => {
  const compatibilityPosition = indexHtml.indexOf('js/compatibility.js?v=24');
  const appPosition = indexHtml.indexOf('js/app.js?v=24');
  assert.ok(compatibilityPosition >= 0 && appPosition > compatibilityPosition);
  assert.match(compatibility, /typeof globalThis\.ResizeObserver === 'function'/);
  assert.match(compatibility, /globalThis\.ResizeObserver = ResizeObserverFallback/);
  assert.match(serviceWorker, /\.\/js\/compatibility\.js/);
});

test('la migración de la Liga acepta todo el catálogo vigente', () => {
  for (const skin of Object.keys(SHIP_SKINS)) {
    assert.match(migration, new RegExp("'" + skin + "'"), `falta la nave ${skin}`);
  }
  for (const trail of Object.keys(SHIP_TRAILS)) {
    assert.match(migration, new RegExp("'" + trail + "'"), `falta la estela ${trail}`);
  }
  assert.match(migration, /v_max_destroyed := 12 \+ 8 \* p_checkpoints/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = pg_catalog, public, private, extensions/);
  assert.match(migration, /enforce_galactic_rate_limit\('score'/);
});
