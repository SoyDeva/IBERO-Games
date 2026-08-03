import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../js/space-game.js', import.meta.url), 'utf8');

test('SpaceFlight enlaza el controlador de entrada con sus operaciones públicas', () => {
  assert.match(source, /createFlightInputController/);
  assert.match(source, /getMode: \(\) => this\.mode/);
  assert.match(source, /moveLane: \(direction\) => this\.moveLane\(direction\)/);
  assert.match(source, /setLane: \(lane\) => this\.setLane\(lane\)/);
  assert.match(source, /fire: \(\) => this\.fire\(\)/);
  assert.match(source, /this\.inputController\.bind\(\)/);
});

test('SpaceFlight no interpreta directamente eventos de teclado o puntero', () => {
  assert.doesNotMatch(source, /this\.boundKey\s*=/);
  assert.doesNotMatch(source, /this\.boundPointer\s*=/);
  assert.doesNotMatch(source, /window\.addEventListener\('keydown'/);
  assert.doesNotMatch(source, /canvas\.addEventListener\('pointerdown'/);
  assert.doesNotMatch(source, /\n\s*onKey\(event\) \{/);
  assert.doesNotMatch(source, /\n\s*onPointer\(event\) \{/);
});
