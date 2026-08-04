import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createMissionSummary } from '../js/core/mission-summary.js';

const screen = readFileSync(new URL('../js/ui/game-over-screen.js', import.meta.url), 'utf8');

test('la bitácora normaliza y conserva los desafíos completados', () => {
  const summary = createMissionSummary({
    result: { distance: 420, challengesCompleted: 3 },
    previousBest: 300
  });
  assert.equal(summary.challengesCompleted, 3);
  assert.equal(summary.best, 420);

  const invalid = createMissionSummary({ result: { challengesCompleted: -4 } });
  assert.equal(invalid.challengesCompleted, 0);
});

test('la pantalla final muestra la métrica de desafíos sin cambiar sus acciones', () => {
  assert.match(screen, /metric\(summary\.challengesCompleted, 'Desafíos'\)/);
  assert.match(screen, /id="restart-flight"/);
  assert.match(screen, /id="ranking-after-game"/);
  assert.match(screen, /id="shop-after-game"/);
  assert.match(screen, /id="practice-after-game"/);
});
