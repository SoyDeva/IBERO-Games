import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFlightPerformanceState,
  detectFlightQuality,
  FLIGHT_QUALITY_PROFILES,
  getFlightQualityProfile,
  scaledVisualCount,
  shouldRenderFlightFrame,
  updateFlightPerformance
} from '../js/core/flight-performance.js';
import { resizeFlightCanvas } from '../js/core/flight-geometry.js';

test('clasifica por capacidad y no confunde una pantalla Retina con un equipo lento', () => {
  assert.equal(detectFlightQuality({ viewportWidth: 390, devicePixelRatio: 3, hardwareConcurrency: 8, deviceMemory: 8 }), 'high');
  assert.equal(detectFlightQuality({ viewportWidth: 390, devicePixelRatio: 3, hardwareConcurrency: 4, deviceMemory: 4 }), 'economy');
  assert.equal(detectFlightQuality({ viewportWidth: 820, hardwareConcurrency: 6, deviceMemory: 6 }), 'balanced');
  assert.equal(detectFlightQuality({ viewportWidth: 1440, hardwareConcurrency: 12, deviceMemory: 16, devicePixelRatio: 1 }), 'high');
  assert.equal(detectFlightQuality({ viewportWidth: 1440, hardwareConcurrency: 12, deviceMemory: 16, saveData: true }), 'economy');
});

test('los perfiles preservan nitidez Retina y limitan efectos de forma independiente', () => {
  assert.deepEqual(Object.keys(FLIGHT_QUALITY_PROFILES), ['economy', 'balanced', 'high']);
  assert.equal(getFlightQualityProfile('economy').pixelRatioCap, 1.25);
  assert.equal(getFlightQualityProfile('balanced').pixelRatioCap, 2);
  assert.equal(getFlightQualityProfile('high').pixelRatioCap, 2.5);
  assert.ok(getFlightQualityProfile('economy').starCount < getFlightQualityProfile('balanced').starCount);
  assert.ok(getFlightQualityProfile('balanced').starCount < getFlightQualityProfile('high').starCount);
  assert.equal(scaledVisualCount(40, 'economy'), 15);
  assert.equal(scaledVisualCount(40, 'balanced'), 27);
  assert.equal(shouldRenderFlightFrame(1, 'economy', true), false);
  assert.equal(shouldRenderFlightFrame(2, 'economy', true), true);
  assert.equal(shouldRenderFlightFrame(1, 'high', true), true);
});

test('degrada calidad ante fotogramas lentos y no eleva un equipo restringido', () => {
  let performanceState = createFlightPerformanceState({ viewportWidth: 390, devicePixelRatio: 3, hardwareConcurrency: 8, deviceMemory: 8 });
  assert.equal(performanceState.quality, 'high');
  for (let index = 0; index < 190; index += 1) {
    performanceState = updateFlightPerformance(performanceState, 34).state;
  }
  assert.equal(performanceState.quality, 'balanced');

  let constrainedState = createFlightPerformanceState({ viewportWidth: 390, devicePixelRatio: 3, hardwareConcurrency: 4, deviceMemory: 4 });
  for (let index = 0; index < 1000; index += 1) {
    constrainedState = updateFlightPerformance(constrainedState, 10).state;
  }
  assert.equal(constrainedState.maximumQuality, 'economy');
  assert.equal(constrainedState.quality, 'economy');
});

test('el Canvas evita reinicios repetidos y usa hasta 2.5 píxeles por punto CSS', () => {
  const transforms = [];
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 400, height: 500 })
  };
  const context = { setTransform: (...values) => transforms.push(values) };

  const first = resizeFlightCanvas({ canvas, context, devicePixelRatio: 3, maxPixelRatio: 2.5 });
  const second = resizeFlightCanvas({ canvas, context, devicePixelRatio: 3, maxPixelRatio: 2.5 });
  assert.deepEqual(first, { width: 400, height: 500, ratio: 2.5 });
  assert.deepEqual(second, first);
  assert.equal(canvas.width, 1000);
  assert.equal(canvas.height, 1250);
  assert.deepEqual(transforms, [[2.5, 0, 0, 2.5, 0, 0]]);
});
