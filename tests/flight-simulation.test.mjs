import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceExplosions,
  advanceFlightVitals,
  advanceObstacles,
  advanceProjectile,
  cleanupFlightObjects,
  collisionOutcome,
  createObstacleWave,
  destructionOutcome,
  isShipCollision,
  projectileHitsObstacle,
  resolveFuelDepletion
} from '../js/core/flight-simulation.js';

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} no está cerca de ${expected}`);
}

test('avanza posición, distancia, combustible y efectos con las fórmulas actuales', () => {
  const next = advanceFlightVitals({
    elapsed: 2,
    lane: 1,
    lanePosition: 0,
    checkpoints: 2,
    distance: 100,
    fuel: 62,
    practice: false,
    tutorial: false,
    flash: 1,
    shake: .8,
    weaponPulse: .5,
    invulnerable: .7
  }, .04);

  closeTo(next.elapsed, 2.04);
  closeTo(next.lanePosition, .44);
  closeTo(next.distance, 100.824);
  closeTo(next.fuel, 61.9552);
  closeTo(next.flash, .928);
  closeTo(next.shake, .7);
  closeTo(next.weaponPulse, .3);
  closeTo(next.invulnerable, .66);
});

test('el tutorial congela distancia y combustible, y la práctica reduce el consumo', () => {
  const tutorial = advanceFlightVitals({
    checkpoints: 4, distance: 50, fuel: 30, tutorial: true, practice: false
  }, .04);
  assert.equal(tutorial.distance, 50);
  assert.equal(tutorial.fuel, 30);

  const practice = advanceFlightVitals({
    checkpoints: 0, distance: 0, fuel: 78, tutorial: false, practice: true
  }, 1);
  closeTo(practice.distance, 17);
  closeTo(practice.fuel, 77.265);
});

test('resuelve agotamiento de combustible según misión o práctica', () => {
  const mission = resolveFuelDepletion({ fuel: 0, practice: false });
  assert.equal(mission.status, 'stranded');
  assert.match(mission.reason, /combustible/);

  const practice = resolveFuelDepletion({ fuel: 0, practice: true, hull: 0, adaptiveAssist: .14 });
  assert.equal(practice.status, 'rescued');
  assert.deepEqual(practice.patch, { fuel: 45, hull: 1, adaptiveAssist: .16 });

  assert.equal(resolveFuelDepletion({ fuel: .1 }).status, 'ok');
});

test('avanza obstáculos, explosiones y proyectiles sin mutar las entradas', () => {
  const obstacle = { lane: 0, depth: .6, spin: .2, spinSpeed: 2, speedFactor: .5, tutorialTarget: true };
  const [moved] = advanceObstacles([obstacle], { delta: .2, obstacleSpeed: 1 });
  assert.equal(obstacle.depth, .6);
  assert.equal(moved.previousDepth, .6);
  assert.equal(moved.depth, .66);
  closeTo(moved.spin, .6);

  const explosion = { depth: .3, age: .1 };
  const [advancedExplosion] = advanceExplosions([explosion], { delta: .2, obstacleSpeed: .5 });
  closeTo(advancedExplosion.age, .3);
  closeTo(advancedExplosion.depth, .35);

  const projectile = advanceProjectile({ depth: .79, age: 0 }, .1);
  assert.equal(projectile.previousDepth, .79);
  closeTo(projectile.depth, .618);
  closeTo(projectile.age, .1);
});

test('detecta cruces de plasma y colisiones de nave con los límites originales', () => {
  assert.equal(projectileHitsObstacle(
    { lane: 1, previousDepth: .7, depth: .5 },
    { lane: 1, previousDepth: .6, depth: .55, hit: false }
  ), true);
  assert.equal(projectileHitsObstacle(
    { lane: 1, previousDepth: .7, depth: .5 },
    { lane: 0, previousDepth: .6, depth: .55, hit: false }
  ), false);

  assert.equal(isShipCollision({
    obstacle: { lane: 0, depth: .9, hit: false }, lanePosition: .2, invulnerable: 0
  }), true);
  assert.equal(isShipCollision({
    obstacle: { lane: 0, depth: .9, hit: false }, lanePosition: .4, invulnerable: 0
  }), false);
  assert.equal(isShipCollision({
    obstacle: { lane: 0, depth: .9, hit: false }, lanePosition: 0, invulnerable: .1
  }), false);
});

test('genera oleadas simples y dobles dentro del catálogo y carriles válidos', () => {
  const alwaysZero = () => 0;
  const simple = createObstacleWave({ checkpoints: 1, pairChance: 1, random: alwaysZero });
  assert.equal(simple.length, 1);

  const pair = createObstacleWave({ checkpoints: 6, pairChance: 1, random: alwaysZero });
  assert.equal(pair.length, 2);
  assert.equal(new Set(pair.map((item) => item.lane)).size, 2);
  pair.forEach((item) => {
    assert.ok(['planet', 'meteor', 'star', 'ship'].includes(item.type));
    assert.ok([-1, 0, 1].includes(item.lane));
    assert.equal(item.hit, false);
    assert.ok(item.speedFactor >= .92 && item.speedFactor < 1.08);
    assert.ok(item.size >= .84 && item.size < 1.16);
  });
  assert.equal(pair[1].depth, .135);
});

test('calcula una colisión de misión y conserva el escudo informado antes del rescate', () => {
  const mission = collisionOutcome({
    hull: 2,
    fuel: 60,
    practice: false,
    totalCollisions: 4,
    collisionsThisLeg: 1,
    correctStreak: 3,
    adaptiveAssist: .15
  }, { type: 'meteor', lane: -1, depth: .92 }, () => .5);

  assert.equal(mission.patch.hull, 1);
  assert.equal(mission.patch.fuel, 48);
  assert.equal(mission.patch.totalCollisions, 5);
  assert.equal(mission.patch.collisionsThisLeg, 2);
  assert.equal(mission.patch.correctStreak, 0);
  assert.equal(mission.patch.adaptiveAssist, .16);
  assert.deepEqual(mission.collision, { name: 'un meteorito', hull: 1 });
  assert.equal(mission.gameOverReason, '');

  const practice = collisionOutcome({
    hull: 1,
    fuel: 8,
    practice: true,
    totalCollisions: 0,
    collisionsThisLeg: 0,
    adaptiveAssist: 0
  }, { type: 'ship', lane: 1, depth: .9 }, () => 0);
  assert.equal(practice.collision.hull, 0);
  assert.equal(practice.patch.hull, 3);
  assert.equal(practice.patch.fuel, 48);
  assert.equal(practice.rescueReason, 'hull');

  const stranded = collisionOutcome({ hull: 1, fuel: 50, practice: false }, { type: 'planet' }, () => 0);
  assert.match(stranded.gameOverReason, /demasiados golpes/);
});

test('calcula destrucción, efectos y transición del tutorial', () => {
  const outcome = destructionOutcome({
    destroyed: 2,
    flash: .2,
    shake: .1,
    ammo: 1,
    tutorial: true,
    tutorialStep: 'fire'
  }, { type: 'star', lane: 0, depth: .5 }, () => .25);

  assert.equal(outcome.patch.destroyed, 3);
  assert.equal(outcome.patch.flash, .72);
  assert.equal(outcome.patch.shake, .24);
  assert.equal(outcome.patch.tutorialStep, 'question');
  assert.deepEqual(outcome.destroyed, { name: 'ESTRELLA', ammo: 1, type: 'star' });
  assert.equal(outcome.tutorialStep, 'question');
  assert.equal(outcome.explosion.kind, 'plasma');
});

test('elimina objetos terminados con los umbrales actuales', () => {
  const cleaned = cleanupFlightObjects({
    explosions: [{ age: .6 }, { age: .7 }, { age: .8, duration: 1 }],
    projectiles: [
      { hit: false, depth: .02, age: .8 },
      { hit: true, depth: .5, age: .1 },
      { hit: false, depth: .01, age: .1 },
      { hit: false, depth: .5, age: .9 }
    ],
    obstacles: [{ depth: 1.23, hit: false }, { depth: 1.24, hit: false }, { depth: .5, hit: true }]
  });

  assert.equal(cleaned.explosions.length, 2);
  assert.equal(cleaned.projectiles.length, 1);
  assert.equal(cleaned.obstacles.length, 1);
});
