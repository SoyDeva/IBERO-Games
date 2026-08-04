import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../js/space-game.js', import.meta.url), 'utf8');
const excitementRenderer = readFileSync(new URL('../js/ui/flight-excitement-renderer.js', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('SpaceFlight aplica contexto, densidad, estrellas y render adaptativos', () => {
  assert.match(source, /getContext\('2d', \{ alpha: false, desynchronized: true \}\)/);
  assert.match(source, /createFlightPerformanceState\(browserPerformanceCapabilities\(\)\)/);
  assert.match(source, /length: this\.performanceProfile\.starCount/);
  assert.match(source, /maxPixelRatio: this\.performanceProfile\.pixelRatioCap/);
  assert.match(source, /updateFlightPerformance\(this\.performanceState, frameMs\)/);
  assert.match(source, /shouldRenderFlightFrame\(this\.frameNumber, this\.performanceProfile, this\.mode === 'running'\)/);
});

test('el HUD y las celebraciones reducen trabajo sin cambiar la simulación', () => {
  assert.match(source, /this\.emitHud\(false\);/);
  assert.match(source, /now - this\.lastHudAt < this\.performanceProfile\.hudInterval/);
  assert.match(source, /scaledVisualCount\(count, this\.performanceProfile/);
  assert.match(source, /72 - this\.celebrationParticles\.length/);
  assert.doesNotMatch(source, /setInterval|localStorage|fetch\(/);
  assert.match(source, /advanceFlightVitals\(/);
  assert.match(source, /isShipCollision\(/);
});

test('la claridad móvil sigue el perfil y no crea infraestructura paralela', () => {
  assert.match(excitementRenderer, /this\.flight\.performanceProfile\?\.detailRatio/);
  assert.match(excitementRenderer, /drawMobileClarity/);
  assert.match(excitementRenderer, /drawCrispShip/);
  assert.match(excitementRenderer, /compact \? 12 : 18/);
  assert.doesNotMatch(excitementRenderer, /requestAnimationFrame|setInterval|fetch\(/);
  assert.match(serviceWorker, /mision-nebula-mobile-controls-v30/);
  assert.match(serviceWorker, /flight-performance\.js/);
  assert.match(serviceWorker, /ignoreSearch: true/);
});
