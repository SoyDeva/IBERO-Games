import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createFlightRenderer } from '../js/ui/flight-renderer.js';

const flightSource = readFileSync(new URL('../js/space-game.js', import.meta.url), 'utf8');
const rendererSource = readFileSync(new URL('../js/ui/flight-renderer.js', import.meta.url), 'utf8');

test('SpaceFlight delega Canvas y conserva una fachada pequeña', () => {
  assert.match(flightSource, /createFlightRenderer\(this\)/);
  assert.match(flightSource, /resizeFlightCanvas\(\{/);
  assert.match(flightSource, /this\.renderer\.draw\(\)/);
  assert.match(flightSource, /this\.inputController\.destroy\(\)/);
  assert.doesNotMatch(flightSource, /drawSpace\(ctx\)/);
  assert.doesNotMatch(flightSource, /drawShip\(ctx\)/);
  assert.doesNotMatch(flightSource, /project\(lane, depth\)/);
  assert.doesNotMatch(flightSource, /this\.boundKey|this\.boundPointer/);
});

test('el renderizador conserva la escena y usa geometría compartida', () => {
  assert.match(rendererSource, /projectFlightPoint/);
  assert.match(rendererSource, /drawSpace\(ctx\)/);
  assert.match(rendererSource, /drawRoute\(ctx\)/);
  assert.match(rendererSource, /drawCheckpoint\(ctx\)/);
  assert.match(rendererSource, /drawObstacle\(ctx, obstacle\)/);
  assert.match(rendererSource, /drawProjectile\(ctx, projectile\)/);
  assert.match(rendererSource, /drawExplosion\(ctx, explosion\)/);
  assert.match(rendererSource, /drawCelebration\(ctx\)/);
  assert.match(rendererSource, /drawShip\(ctx\)/);
});

test('el renderizador proyecta leyendo el estado actual del vuelo', () => {
  const flight = { context: {}, width: 960, height: 600 };
  const renderer = createFlightRenderer(flight);
  const first = renderer.project(0, 0);
  assert.deepEqual(first, { x: 480, y: 141, scale: .1 });

  flight.width = 640;
  const second = renderer.project(0, 0);
  assert.equal(second.x, 320);
  assert.throws(() => createFlightRenderer({}), /contexto Canvas/);
});
