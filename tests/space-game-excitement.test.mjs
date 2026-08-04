import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const spaceGameSource = await readFile(new URL('../js/space-game.js', import.meta.url), 'utf8');
const rendererSource = await readFile(new URL('../js/ui/flight-excitement-renderer.js', import.meta.url), 'utf8');
const coreSource = await readFile(new URL('../js/core/flight-excitement.js', import.meta.url), 'utf8');

test('SpaceFlight integra núcleos, carga por habilidad y penalización por choque', () => {
  assert.match(spaceGameSource, /createFlightExcitementRenderer/);
  assert.match(spaceGameSource, /updateEnergyCores\(delta, difficulty, remaining\)/);
  assert.match(spaceGameSource, /this\.chargeRush\(28, 'answer'\)/);
  assert.match(spaceGameSource, /this\.chargeRush\(18, 'destroy'\)/);
  assert.match(spaceGameSource, /penalizeNebulaRush\(this\)/);
  assert.match(spaceGameSource, /this\.renderer\.draw\(\);\s*this\.excitementRenderer\.draw\(\);/);
});

test('la emoción se representa dentro del Canvas sin infraestructura paralela', () => {
  assert.match(rendererSource, /drawEnergyCore/);
  assert.match(rendererSource, /IMPULSO/);
  assert.match(rendererSource, /drawRushMessage/);
  assert.match(rendererSource, /¡MODO NÉBULA!/);

  const combined = coreSource + rendererSource;
  assert.doesNotMatch(combined, /fetch\s*\(/);
  assert.doesNotMatch(combined, /XMLHttpRequest/);
  assert.doesNotMatch(combined, /localStorage/);
  assert.doesNotMatch(combined, /setInterval|requestAnimationFrame/);
});
