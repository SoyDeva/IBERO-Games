import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceChallengeTimer,
  applyChallengeReward,
  createFlightChallengeState,
  createSectorChallenge,
  FLIGHT_CHALLENGES,
  progressSectorChallenge
} from '../js/core/flight-challenges.js';

test('define tres desafíos breves con recompensas limitadas', () => {
  assert.equal(FLIGHT_CHALLENGES.length, 3);
  assert.equal(new Set(FLIGHT_CHALLENGES.map((challenge) => challenge.id)).size, 3);
  for (const challenge of FLIGHT_CHALLENGES) {
    assert.ok(challenge.title);
    assert.ok(challenge.instruction);
    assert.equal(challenge.target, 1);
    assert.ok(challenge.reward.rush > 0 && challenge.reward.rush <= 12);
    assert.ok(challenge.reward.fuel <= 8);
    assert.ok(challenge.reward.ammo <= 1);
  }
});

test('crea estado independiente y evita repetir el desafío anterior', () => {
  const state = createFlightChallengeState();
  assert.equal(state.sectorChallenge, null);
  assert.equal(state.challengesCompleted, 0);

  const challenge = createSectorChallenge({ previousId: 'destroy', random: () => 0 });
  assert.notEqual(challenge.id, 'destroy');
  assert.equal(challenge.progress, 0);
  assert.equal(challenge.status, 'active');

  challenge.reward.fuel = 99;
  assert.notEqual(FLIGHT_CHALLENGES.find((item) => item.id === challenge.id).reward.fuel, 99);
});

test('completa objetivos de destrucción y recolección al registrar la acción correcta', () => {
  const destroy = createSectorChallenge({ previousId: 'collect', random: () => 0 });
  assert.equal(destroy.id, 'destroy');
  const destroyed = progressSectorChallenge(destroy, { type: 'destroy' });
  assert.equal(destroyed.completed, true);
  assert.equal(destroyed.challenge.status, 'completed');
  assert.equal(destroyed.challenge.progress, 1);

  const collect = FLIGHT_CHALLENGES.find((challenge) => challenge.id === 'collect');
  const collected = progressSectorChallenge({ ...collect, reward: { ...collect.reward }, progress: 0, status: 'active' }, { type: 'collect' });
  assert.equal(collected.completed, true);
  assert.equal(collected.challenge.progress, 1);
});

test('el vuelo limpio falla al chocar y los objetivos pendientes vencen en el portal', () => {
  const clean = FLIGHT_CHALLENGES.find((challenge) => challenge.id === 'clean');
  const failedClean = progressSectorChallenge({ ...clean, reward: { ...clean.reward }, progress: 0, status: 'active' }, { type: 'collision' });
  assert.equal(failedClean.failed, true);
  assert.equal(failedClean.challenge.status, 'failed');

  const collect = FLIGHT_CHALLENGES.find((challenge) => challenge.id === 'collect');
  const expired = progressSectorChallenge({ ...collect, reward: { ...collect.reward }, progress: 0, status: 'active' }, { type: 'checkpoint', clean: true });
  assert.equal(expired.failed, true);

  const cleanArrival = progressSectorChallenge({ ...clean, reward: { ...clean.reward }, progress: 0, status: 'active' }, { type: 'checkpoint', clean: true });
  assert.equal(cleanArrival.completed, true);
});

test('aplica recompensas sin superar combustible, plasma ni conteos defensivos', () => {
  const challenge = FLIGHT_CHALLENGES.find((item) => item.id === 'destroy');
  const patch = applyChallengeReward({ fuel: 98, ammo: 9, challengesCompleted: 2 }, challenge);
  assert.equal(patch.fuel, 98);
  assert.equal(patch.ammo, 9);
  assert.equal(patch.challengesCompleted, 3);
  assert.equal(patch.challengeMessageTime, 2.6);

  const ticking = advanceChallengeTimer({ challengeMessageTime: 1.2 }, .4);
  assert.ok(Math.abs(ticking.challengeMessageTime - .8) < Number.EPSILON * 2);
  assert.deepEqual(advanceChallengeTimer({ challengeMessageTime: .2 }, 1), { challengeMessageTime: 0 });
});
