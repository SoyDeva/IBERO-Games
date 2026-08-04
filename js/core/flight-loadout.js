import { SHIP_SKINS, SHIP_TRAILS } from '../config/ship-catalog.js?v=23';

const BASE_EFFECT = Object.freeze({
  startingFuelBonus: 0,
  startingAmmoBonus: 0,
  fuelDrainMultiplier: 1,
  collisionFuelLossMultiplier: 1,
  obstacleSpeedMultiplier: 1,
  spawnIntervalMultiplier: 1,
  pairChanceModifier: 0
});

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function effectOf(item = {}) {
  const effect = item.effect || {};
  return {
    startingFuelBonus: clamp(finite(effect.startingFuelBonus, 0), 0, 30),
    startingAmmoBonus: clamp(Math.floor(finite(effect.startingAmmoBonus, 0)), 0, 2),
    fuelDrainMultiplier: clamp(finite(effect.fuelDrainMultiplier, 1), .72, 1.12),
    collisionFuelLossMultiplier: clamp(finite(effect.collisionFuelLossMultiplier, 1), .35, 1.2),
    obstacleSpeedMultiplier: clamp(finite(effect.obstacleSpeedMultiplier, 1), .84, 1.12),
    spawnIntervalMultiplier: clamp(finite(effect.spawnIntervalMultiplier, 1), .88, 1.2),
    pairChanceModifier: clamp(finite(effect.pairChanceModifier, 0), -.24, .12)
  };
}

export function combineFlightEffects(...effects) {
  return effects.reduce((combined, rawEffect) => {
    const effect = effectOf({ effect: rawEffect });
    return {
      startingFuelBonus: clamp(combined.startingFuelBonus + effect.startingFuelBonus, 0, 40),
      startingAmmoBonus: clamp(combined.startingAmmoBonus + effect.startingAmmoBonus, 0, 3),
      fuelDrainMultiplier: clamp(combined.fuelDrainMultiplier * effect.fuelDrainMultiplier, .65, 1.2),
      collisionFuelLossMultiplier: clamp(combined.collisionFuelLossMultiplier * effect.collisionFuelLossMultiplier, .3, 1.25),
      obstacleSpeedMultiplier: clamp(combined.obstacleSpeedMultiplier * effect.obstacleSpeedMultiplier, .78, 1.2),
      spawnIntervalMultiplier: clamp(combined.spawnIntervalMultiplier * effect.spawnIntervalMultiplier, .8, 1.3),
      pairChanceModifier: clamp(combined.pairChanceModifier + effect.pairChanceModifier, -.3, .15)
    };
  }, { ...BASE_EFFECT });
}

export function resolveFlightLoadout({
  shipSkin = 'nebula',
  shipTrail = 'pulse',
  skins = SHIP_SKINS,
  trails = SHIP_TRAILS
} = {}) {
  const resolvedSkinId = skins[shipSkin] ? shipSkin : 'nebula';
  const resolvedTrailId = trails[shipTrail] ? shipTrail : 'pulse';
  const skin = skins[resolvedSkinId] || {};
  const trail = trails[resolvedTrailId] || {};
  const effect = combineFlightEffects(effectOf(skin), effectOf(trail));

  return {
    shipSkin: resolvedSkinId,
    shipTrail: resolvedTrailId,
    skinPerk: skin.perk || null,
    trailPerk: trail.perk || null,
    ...effect
  };
}
