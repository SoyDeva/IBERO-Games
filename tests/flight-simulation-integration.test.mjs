import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../js/space-game.js', import.meta.url), 'utf8');

test('SpaceFlight conecta las reglas de simulación y conserva la dificultad local', () => {
  assert.match(source, /from '\.\/core\/flight-simulation\.js\?v=23'/);
  assert.match(
    source,
    /update\(delta\) \{\s+Object\.assign\(this, advanceFlightVitals\(this, delta\)\);\s+const difficulty = this\.getDifficulty\(\);/
  );
  assert.match(source, /obstacleSpeed: difficulty\.obstacleSpeed/);
  assert.match(source, /this\.spawnTimer = difficulty\.spawnInterval \+ Math\.random\(\) \* \.32/);
});

test('SpaceFlight no conserva implementaciones duplicadas de la simulación extraída', () => {
  assert.doesNotMatch(source, /const LANES = \[-1, 0, 1\]/);
  assert.doesNotMatch(source, /const OBSTACLE_TYPES = \['planet'/);
  assert.doesNotMatch(source, /this\.elapsed \+= delta/);
  assert.doesNotMatch(source, /this\.hull -= 1/);
  assert.doesNotMatch(source, /const lanes = \[\.\.\.LANES\]/);
});
