import assert from 'node:assert/strict';
import test from 'node:test';
import { clamp, easeIn, projectFlightPoint, resizeFlightCanvas } from '../js/core/flight-geometry.js';

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} no está cerca de ${expected}`);
}

test('conserva límites y proyección de la ruta', () => {
  assert.equal(clamp(4, -1, 1), 1);
  assert.equal(clamp(-4, -1, 1), -1);
  assert.equal(easeIn(.5), .25);

  assert.deepEqual(projectFlightPoint({ width: 960, height: 600, lane: 0, depth: 0 }), {
    x: 480,
    y: 141,
    scale: .1
  });
  const point = projectFlightPoint({ width: 960, height: 600, lane: 1, depth: 1 });
  closeTo(point.x, 758.4);
  closeTo(point.y, 555);
  closeTo(point.scale, 1.32);
});

test('redimensiona el canvas con los mínimos y el límite de densidad actuales', () => {
  const transforms = [];
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 280, height: 360 })
  };
  const context = {
    setTransform: (...values) => transforms.push(values)
  };

  const metrics = resizeFlightCanvas({ canvas, context, devicePixelRatio: 3 });
  assert.deepEqual(metrics, { width: 320, height: 420, ratio: 2 });
  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 840);
  assert.deepEqual(transforms, [[2, 0, 0, 2, 0, 0]]);
});

test('rechaza superficies incompatibles', () => {
  assert.throws(() => resizeFlightCanvas(), /canvas y un contexto/);
});
