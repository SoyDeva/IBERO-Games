import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readRenderer = () => readFile(new URL('../js/ui/flight-renderer.js', import.meta.url), 'utf8');

test('el renderizador compone profundidad, velocidad, portal, obstáculos y nave renovados', async () => {
  const source = await readRenderer();

  for (const method of [
    'visualSpeed',
    'drawDistantBody',
    'drawSpeedBands',
    'drawObstacleAura',
    'drawShipWake',
    'drawVignette'
  ]) {
    assert.match(source, new RegExp('\\b' + method + '\\('));
  }

  assert.match(source, /this\.drawSpace\(ctx\);[\s\S]*this\.drawSpeedBands\(ctx\);[\s\S]*this\.drawRoute\(ctx\);/);
  assert.match(source, /ctx\.setLineDash\(/);
  assert.match(source, /ctx\.lineDashOffset = -this\.elapsed/);
  assert.match(source, /globalCompositeOperation = 'lighter'/);
  assert.match(source, /SHIP_SKINS\[this\.shipSkin\]/);
  assert.match(source, /SHIP_TRAILS\[this\.shipTrail\]/);
});

test('los efectos de Canvas no modifican mecánicas ni crean infraestructura paralela', async () => {
  const source = await readRenderer();

  assert.match(source, /projectFlightPoint\(/);
  assert.match(source, /this\.nextCheckpoint - this\.distance/);
  assert.match(source, /this\.obstacles\.filter/);
  assert.match(source, /FLIGHT_LANES\.find/);

  assert.doesNotMatch(source, /this\.(?:distance|fuel|hull|checkpoints|nextCheckpoint|ammo|mode|obstacles|projectiles)\s*=/);
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|setTimeout|setInterval/);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
  assert.doesNotMatch(source, /addEventListener|removeEventListener/);
});
