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

test('clasifica celulares modestos, equipos equilibrados y computadores capaces', () => {
  assert.equal(detectFlightQuality({ viewportWidth: 390, hardwareConcurrency: 8, deviceMemory: 8 }), 'economy');
  assert.equal(detectFlightQuality({ viewportWidth: 820, hardwareConcurrency: 8, deviceMemory: 8 }), 'balanced');
  assert.equal(detectFlightQuality({ viewportWidth: 1440, hardwareConcurrency: 12, deviceMemory: 16, devicePixelRatio: 1 }), 'high');
  assert.equal(detectFlightQuality({ viewportWidth: 1440, hardwareConcurrency: 12, deviceMemory: 16, saveData: true }), 'economy');
});

test('los perfiles limitan densidad, estrellas, partículas y frecuencia visual', () => {
  assert.deepEqual(Object.keys(FLIGHT_QUALITY_PROFILES), ['economy', 'balanced', 'high']);
  assert.equal(getFlightQualityProfile('economy').pixelRatioCap, 1);
  assert.equal(getFlightQualityProfile('high').pixelRatioCap, 1.75);
  assert.ok(getFlightQualityProfile('economy').starCount < getFlightQualityProfile('balanced').starCount);
  assert.ok(getFlightQualityProfile('balanced').starCount < getFlightQualityProfile('high').starCount);
  assert.equal(scaledVisualCount(40, 'economy'), 15);
  assert.equal(scaledVisualCount(40, 'balanced'), 27);
  assert.equal(shouldRenderFlightFrame(1, 'economy', true), false);
  assert.equal(shouldRenderFlightFrame(2, 'economy', true), true);
  assert.equal(shouldRenderFlightFrame(1, 'high', true), true);
});

test('degrada calidad ante fotogramas lentos y solo recupera hasta el perfil inicial', () => {
  let performanceState = createFlightPerformanceState({ viewportWidth: 1440, hardwareConcurrency: 12, deviceMemory: 16 });
  assert.equal(performanceState.quality, 'high');
  for (let index = 0; index < 190; index += 1) {
    performanceState = updateFlightPerformance(performanceState, 34).state;
  }
  assert.equal(performanceState.quality, 'balanced');

  let mobileState = createFlightPerformanceState({ viewportWidth: 390, hardwareConcurrency: 8, deviceMemory: 8 });
  for (let index = 0; index < 1000; index += 1) {
    mobileState = updateFlightPerformance(mobileState, 10).state;
  }
  assert.equal(mobileState.maximumQuality, 'economy');
  assert.equal(mobileState.quality, 'economy');
});

test('el Canvas evita reinicios repetidos y respeta el límite dinámico de píxeles', () => {
  const transforms = [];
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 400, height: 500 })
  };
  const context = { setTransform: (...values) => transforms.push(values) };

  const first = resizeFlightCanvas({ canvas, context, devicePixelRatio: 3, maxPixelRatio: 1.35 });
  const second = resizeFlightCanvas({ canvas, context, devicePixelRatio: 3, maxPixelRatio: 1.35 });
  assert.deepEqual(first, { width: 400, height: 500, ratio: 1.35 });
  assert.deepEqual(second, first);
  assert.equal(canvas.width, 540);
  assert.equal(canvas.height, 675);
  assert.deepEqual(transforms, [[1.35, 0, 0, 1.35, 0, 0]]);
});
