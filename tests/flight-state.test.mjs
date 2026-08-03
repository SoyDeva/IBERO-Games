import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ammoMilestone,
  createFlightState,
  flightDifficulty,
  flightHud,
  flightSector,
  flightSectorIndex,
  flightSummary,
  FLIGHT_SECTORS
} from '../js/core/flight-state.js';

test('crea estados independientes para reposo, misión, práctica y tutorial', () => {
  const idle = createFlightState();
  const mission = createFlightState({ mode: 'running', shipSkin: 'solar', shipTrail: 'comet' });
  const practice = createFlightState({ mode: 'running', practice: true });
  const tutorial = createFlightState({ mode: 'running', tutorial: true });

  assert.equal(idle.mode, 'idle');
  assert.equal(idle.spawnTimer, 1.8);
  assert.equal(mission.fuel, 62);
  assert.equal(mission.shipSkin, 'solar');
  assert.equal(mission.shipTrail, 'comet');
  assert.equal(practice.fuel, 78);
  assert.equal(tutorial.nextCheckpoint, 99999);
  assert.equal(tutorial.tutorialStep, 'left');

  mission.obstacles.push({});
  assert.equal(idle.obstacles.length, 0);
});

test('calcula dificultad con límites y ayudas adaptativas', () => {
  const initial = flightDifficulty({ checkpoints: 0, hull: 3 });
  assert.equal(initial.level, 1);
  assert.ok(initial.obstacleSpeed >= .26 && initial.obstacleSpeed <= .7);
  assert.ok(initial.spawnInterval >= .62 && initial.spawnInterval <= 1.75);

  const pressured = flightDifficulty({ checkpoints: 20, hull: 3, correctStreak: 8 });
  assert.equal(pressured.obstacleSpeed, .7);
  assert.equal(pressured.spawnInterval, .62);
  assert.ok(pressured.pairChance <= .82);

  const assisted = flightDifficulty({ checkpoints: 5, hull: 1, practice: true, adaptiveAssist: .16, stationSlowdown: .09 });
  assert.ok(assisted.obstacleSpeed < flightDifficulty({ checkpoints: 5, hull: 3 }).obstacleSpeed);
  assert.ok(assisted.spawnInterval > flightDifficulty({ checkpoints: 5, hull: 3 }).spawnInterval);
});

test('mantiene los cinco sectores y avanza cada dos portales', () => {
  assert.equal(FLIGHT_SECTORS.length, 5);
  assert.equal(flightSectorIndex(0), 0);
  assert.equal(flightSectorIndex(1), 0);
  assert.equal(flightSectorIndex(2), 1);
  assert.equal(flightSectorIndex(50), 4);
  assert.equal(flightSector(4).name, 'Galaxia Roja');
  assert.equal(flightSector(4).index, 2);
});

test('recarga plasma cada cinco niveles y conserva cargas superiores', () => {
  assert.deepEqual(ammoMilestone(4, 1), { recharged: false, ammo: 1, restored: 0, level: 4 });
  assert.deepEqual(ammoMilestone(5, 1), { recharged: true, ammo: 3, restored: 2, level: 5 });
  assert.deepEqual(ammoMilestone(10, 5), { recharged: true, ammo: 5, restored: 0, level: 10 });
});

test('genera resumen y HUD con las métricas actuales', () => {
  const state = {
    fuel: 63.6,
    hull: 2,
    distance: 704.7,
    checkpoints: 5,
    nextCheckpoint: 1000,
    ammo: 2,
    correctStreak: 3,
    totalCorrect: 5,
    bestStreak: 4,
    destroyed: 7,
    totalCollisions: 1,
    practice: false,
    adaptiveAssist: 0,
    stationSlowdown: 0
  };
  const summary = flightSummary(state);
  const hud = flightHud(state);

  assert.equal(summary.distance, 705);
  assert.equal(summary.sector, 'Galaxia Roja');
  assert.equal(summary.correct, 5);
  assert.equal(hud.fuel, 64);
  assert.equal(hud.checkpoint, 6);
  assert.equal(hud.remaining, 295);
  assert.equal(hud.levelsUntilAmmo, 5);
  assert.equal(hud.sector.index, 2);
});
