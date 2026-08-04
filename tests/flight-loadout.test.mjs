import assert from 'node:assert/strict';
import test from 'node:test';

import { SHIP_SKINS, SHIP_TRAILS } from '../js/config/ship-catalog.js';
import { combineFlightEffects, resolveFlightLoadout } from '../js/core/flight-loadout.js';
import { createFlightState, flightDifficulty } from '../js/core/flight-state.js';
import { advanceFlightVitals, collisionOutcome } from '../js/core/flight-simulation.js';

test('todas las naves y sistemas explican una ventaja funcional', () => {
  assert.equal(Object.keys(SHIP_SKINS).length, 6);
  assert.ok(Object.keys(SHIP_TRAILS).length >= 8);

  for (const item of [...Object.values(SHIP_SKINS), ...Object.values(SHIP_TRAILS)]) {
    assert.ok(item.perk?.name);
    assert.ok(item.perk?.description);
    assert.ok(item.effect && Object.keys(item.effect).length > 0);
  }
});

test('combina una habilidad de nave y un sistema sin superar límites defensivos', () => {
  const guardianVector = resolveFlightLoadout({ shipSkin: 'guardian', shipTrail: 'vector' });
  assert.equal(guardianVector.shipSkin, 'guardian');
  assert.equal(guardianVector.shipTrail, 'vector');
  assert.ok(guardianVector.collisionFuelLossMultiplier >= .3);
  assert.ok(guardianVector.collisionFuelLossMultiplier < .4);

  const quasarAurora = resolveFlightLoadout({ shipSkin: 'aurora', shipTrail: 'quasar' });
  assert.equal(quasarAurora.startingFuelBonus, 8);
  assert.equal(quasarAurora.startingAmmoBonus, 2);

  const bounded = combineFlightEffects(
    { startingFuelBonus: 30, startingAmmoBonus: 2, obstacleSpeedMultiplier: .84 },
    { startingFuelBonus: 30, startingAmmoBonus: 2, obstacleSpeedMultiplier: .84 }
  );
  assert.equal(bounded.startingFuelBonus, 40);
  assert.equal(bounded.startingAmmoBonus, 3);
  assert.ok(bounded.obstacleSpeedMultiplier >= .78);
});

test('la configuración activa modifica únicamente parámetros de supervivencia', () => {
  const standard = createFlightState({ mode: 'running', shipSkin: 'nebula', shipTrail: 'pulse' });
  const endurance = createFlightState({ mode: 'running', shipSkin: 'aqua', shipTrail: 'nature' });
  const armed = createFlightState({ mode: 'running', shipSkin: 'aurora', shipTrail: 'quasar' });

  assert.equal(standard.distance, 0);
  assert.equal(endurance.distance, 0);
  assert.equal(armed.distance, 0);
  assert.equal(armed.ammo, 5);
  assert.equal(armed.fuel, 70);
  assert.ok(endurance.fuelDrainMultiplier < standard.fuelDrainMultiplier);

  const standardVitals = advanceFlightVitals(standard, 1);
  const enduranceVitals = advanceFlightVitals(endurance, 1);
  assert.ok(enduranceVitals.fuel > standardVitals.fuel);

  const standardDifficulty = flightDifficulty(standard);
  const standardCloneDifficulty = flightDifficulty({ ...standard, obstacleSpeedMultiplier: 1, spawnIntervalMultiplier: 1 });
  assert.ok(standardDifficulty.obstacleSpeed <= standardCloneDifficulty.obstacleSpeed);
});

test('el blindaje reduce pérdida de combustible sin evitar la pérdida de escudo', () => {
  const protectedState = createFlightState({ mode: 'running', shipSkin: 'guardian', shipTrail: 'vector' });
  const outcome = collisionOutcome(
    { ...protectedState, fuel: 60, hull: 2 },
    { type: 'meteor', lane: 0, depth: .92 },
    () => .5
  );

  assert.equal(outcome.patch.hull, 1);
  assert.ok(outcome.patch.fuel > 55);
  assert.equal(outcome.patch.totalCollisions, 1);
});

test('identificadores desconocidos vuelven a la configuración inicial', () => {
  const loadout = resolveFlightLoadout({ shipSkin: 'fantasma', shipTrail: 'inexistente' });
  assert.equal(loadout.shipSkin, 'nebula');
  assert.equal(loadout.shipTrail, 'pulse');
});
