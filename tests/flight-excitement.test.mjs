import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceEnergyCores,
  advanceExcitementTimers,
  chargeNebulaRush,
  cleanupEnergyCores,
  collectEnergyCore,
  createEnergyCore,
  createFlightExcitementState,
  ENERGY_CORE_CHARGE,
  ENERGY_CORE_FUEL,
  isEnergyCoreCollected,
  nebulaRushFuelMultiplier,
  NEBULA_RUSH_DURATION,
  penalizeNebulaRush
} from '../js/core/flight-excitement.js';

test('crea una sesión de emoción independiente y desactiva núcleos en el tutorial', () => {
  const mission = createFlightExcitementState({ running: true });
  const tutorial = createFlightExcitementState({ running: true, tutorial: true });

  assert.equal(mission.coreSpawnTimer, 7.5);
  assert.equal(mission.rushCharge, 0);
  assert.deepEqual(mission.energyCores, []);
  assert.equal(tutorial.coreSpawnTimer, 99999);

  mission.energyCores.push({ lane: 0 });
  assert.equal(tutorial.energyCores.length, 0);
});

test('genera núcleos en carriles libres y los mueve sin mutar la entrada', () => {
  const core = createEnergyCore({ blockedLanes: [-1, 0], random: () => .4 });
  assert.equal(core.lane, 1);

  const advanced = advanceEnergyCores([core], { delta: 1, speed: .5 });
  assert.equal(core.depth, .045);
  assert.ok(advanced[0].depth > core.depth);
  assert.equal(advanced[0].previousDepth, core.depth);
});

test('detecta la recolección solo al cruzar la zona de la nave', () => {
  const core = { lane: 0, depth: .9, collected: false };
  assert.equal(isEnergyCoreCollected({ core, lanePosition: .1 }), true);
  assert.equal(isEnergyCoreCollected({ core, lanePosition: 1 }), false);
  assert.equal(isEnergyCoreCollected({ core: { ...core, depth: .5 }, lanePosition: 0 }), false);
  assert.equal(isEnergyCoreCollected({ core: { ...core, collected: true }, lanePosition: 0 }), false);
});

test('recoger núcleos restaura combustible, carga impulso y premia cada tercero con plasma', () => {
  const first = collectEnergyCore({ fuel: 70, ammo: 2, coresCollected: 0, rushCharge: 0, rushTime: 0, rushes: 0, flash: 0 });
  assert.equal(first.patch.fuel, 70 + ENERGY_CORE_FUEL);
  assert.equal(first.patch.rushCharge, ENERGY_CORE_CHARGE);
  assert.equal(first.patch.ammo, 2);
  assert.equal(first.ammoBonus, 0);

  const third = collectEnergyCore({ fuel: 98, ammo: 2, coresCollected: 2, rushCharge: 40, rushTime: 0, rushes: 0, flash: 0 });
  assert.equal(third.patch.coresCollected, 3);
  assert.equal(third.patch.fuel, 100);
  assert.equal(third.patch.ammo, 3);
  assert.equal(third.ammoBonus, 1);
});

test('activa el Modo Nébula al completar la barra y limita cargas durante el impulso', () => {
  const activation = chargeNebulaRush({ rushCharge: 84, rushTime: 0, rushes: 1, ammo: 2, flash: 0 }, 18);
  assert.equal(activation.activated, true);
  assert.equal(activation.patch.rushCharge, 0);
  assert.equal(activation.patch.rushTime, NEBULA_RUSH_DURATION);
  assert.equal(activation.patch.rushes, 2);
  assert.equal(activation.patch.ammo, 3);

  const activeCharge = chargeNebulaRush({ rushCharge: 10, rushTime: 4, ammo: 3 }, 20);
  assert.equal(activeCharge.activated, false);
  assert.equal(activeCharge.patch.rushCharge, 15);
});

test('el impulso reduce consumo, avanza temporizadores y un choque cancela la ventaja', () => {
  assert.equal(nebulaRushFuelMultiplier({ rushTime: 3 }), .45);
  assert.equal(nebulaRushFuelMultiplier({ rushTime: 0 }), 1);

  assert.deepEqual(
    advanceExcitementTimers({ coreSpawnTimer: 2, rushTime: 1, rushMessageTime: .5 }, .75),
    { coreSpawnTimer: 1.25, rushTime: .25, rushMessageTime: 0 }
  );

  assert.deepEqual(
    penalizeNebulaRush({ rushCharge: 55, rushTime: 3, rushMessageTime: 1 }),
    { rushCharge: 25, rushTime: 0, rushMessageTime: 0 }
  );

  assert.deepEqual(cleanupEnergyCores([
    { depth: .8, collected: false },
    { depth: 1.2, collected: false },
    { depth: .9, collected: true }
  ]), [{ depth: .8, collected: false }]);
});
