import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../js/space-game.js', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../js/ui/flight-excitement-renderer.js', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../js/core/flight-challenges.js', import.meta.url), 'utf8');

test('SpaceFlight inicia, progresa y renueva un desafío por ruta', () => {
  assert.match(source, /from '\.\/core\/flight-challenges\.js\?v=23'/);
  assert.match(source, /if \(!tutorial\) this\.startNextChallenge\(\)/);
  assert.match(source, /this\.recordChallengeEvent\(\{ type: 'collect' \}\)/);
  assert.match(source, /this\.recordChallengeEvent\(\{ type: 'destroy' \}\)/);
  assert.match(source, /this\.recordChallengeEvent\(\{ type: 'collision' \}\)/);
  assert.match(source, /this\.recordChallengeEvent\(\{ type: 'checkpoint', clean \}\)/);
  assert.match(source, /this\.startNextChallenge\(\);\s+this\.callbacks\.onLevelUp/);
});

test('las recompensas usan límites existentes y no alteran Liga, preguntas o almacenamiento', () => {
  assert.match(source, /Object\.assign\(this, applyChallengeReward\(this, outcome\.challenge\)\)/);
  assert.match(source, /this\.chargeRush\(outcome\.challenge\.reward\.rush, 'challenge'\)/);
  assert.doesNotMatch(rules, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(rules, /question|answer|ranking|supabase/i);
});

test('el Canvas muestra objetivo, progreso, recompensa y resultado sin nuevos eventos', () => {
  assert.match(renderer, /drawChallengeCard\(ctx\)/);
  assert.match(renderer, /DESAFÍO DE RUTA/);
  assert.match(renderer, /DESAFÍO COMPLETADO/);
  assert.match(renderer, /Sin penalización/);
  assert.match(renderer, /challenge\.reward\.label/);
  assert.doesNotMatch(renderer, /addEventListener|requestAnimationFrame|setInterval|setTimeout/);
});
