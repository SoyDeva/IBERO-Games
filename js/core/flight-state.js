import { resolveFlightLoadout } from './flight-loadout.js?v=23';

export const FLIGHT_SECTORS = Object.freeze([
  Object.freeze({ name: 'Nebulosa Violeta', icon: '🌌', top: '#09041f', middle: '#21125b', bottom: '#08051b', glow: '124,78,255', route: '94,232,239' }),
  Object.freeze({ name: 'Cinturón Helado', icon: '❄️', top: '#031a32', middle: '#0d4c6f', bottom: '#071524', glow: '94,232,239', route: '151,225,255' }),
  Object.freeze({ name: 'Galaxia Roja', icon: '🔥', top: '#260414', middle: '#681c3b', bottom: '#170510', glow: '255,83,125', route: '255,190,104' }),
  Object.freeze({ name: 'Zona Alienígena', icon: '👽', top: '#041d18', middle: '#17523f', bottom: '#06120f', glow: '87,224,160', route: '174,255,113' }),
  Object.freeze({ name: 'Vacío Dorado', icon: '✨', top: '#211503', middle: '#594113', bottom: '#130d03', glow: '247,203,98', route: '255,232,147' })
]);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function createFlightState({
  mode = 'idle',
  practice = false,
  tutorial = false,
  shipSkin = 'nebula',
  shipTrail = 'pulse'
} = {}) {
  const running = mode === 'running';
  const loadout = resolveFlightLoadout({ shipSkin, shipTrail });
  const baseFuel = practice && running ? 78 : 62;
  return {
    mode,
    lane: 0,
    lanePosition: 0,
    fuel: clamp(baseFuel + (running ? loadout.startingFuelBonus : 0), 0, 100),
    hull: 3,
    distance: 0,
    checkpoints: 0,
    nextCheckpoint: tutorial && running ? 99999 : 280,
    ammo: 3 + (running ? loadout.startingAmmoBonus : 0),
    obstacles: [],
    projectiles: [],
    explosions: [],
    spawnTimer: running ? 2.1 : 1.8,
    elapsed: 0,
    shake: 0,
    flash: 0,
    weaponPulse: 0,
    practice: Boolean(practice),
    tutorial: Boolean(tutorial),
    tutorialStep: tutorial && running ? 'left' : '',
    invulnerable: 0,
    adaptiveAssist: 0,
    correctStreak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    destroyed: 0,
    totalCollisions: 0,
    collisionsThisLeg: 0,
    celebrationParticles: [],
    shipSkin: loadout.shipSkin,
    shipTrail: loadout.shipTrail,
    shipPerk: loadout.skinPerk,
    trailPerk: loadout.trailPerk,
    fuelDrainMultiplier: loadout.fuelDrainMultiplier,
    collisionFuelLossMultiplier: loadout.collisionFuelLossMultiplier,
    obstacleSpeedMultiplier: loadout.obstacleSpeedMultiplier,
    spawnIntervalMultiplier: loadout.spawnIntervalMultiplier,
    pairChanceModifier: loadout.pairChanceModifier,
    stationSlowdown: 0
  };
}

export function flightDifficulty(state = {}) {
  const checkpoints = Math.max(0, Number(state.checkpoints) || 0);
  const hull = Math.max(0, Number(state.hull) || 0);
  const adaptiveAssist = Math.max(0, Number(state.adaptiveAssist) || 0);
  const stationSlowdown = Math.max(0, Number(state.stationSlowdown) || 0);
  const correctStreak = Math.max(0, Number(state.correctStreak) || 0);
  const obstacleSpeedMultiplier = clamp(Number(state.obstacleSpeedMultiplier) || 1, .78, 1.2);
  const spawnIntervalMultiplier = clamp(Number(state.spawnIntervalMultiplier) || 1, .8, 1.3);
  const pairChanceModifier = clamp(Number(state.pairChanceModifier) || 0, -.3, .15);
  const introEase = checkpoints < 2 ? (2 - checkpoints) * .045 : 0;
  const hullAssist = Math.max(0, 3 - hull) * .018;
  const practiceEase = state.practice ? .075 : 0;
  const streakPressure = Math.min(.045, correctStreak * .009);
  const obstacleSpeed = .36 + checkpoints * .042 - introEase - adaptiveAssist - hullAssist - practiceEase - stationSlowdown + streakPressure;
  const spawnInterval = 1.42 - checkpoints * .085 + introEase * 1.8 + adaptiveAssist + practiceEase + stationSlowdown * 1.6 - streakPressure;
  const pairChance = .12 + checkpoints * .115 - adaptiveAssist * .8 - practiceEase - stationSlowdown * 1.2 + pairChanceModifier;
  return {
    level: checkpoints + 1,
    obstacleSpeed: clamp(obstacleSpeed * obstacleSpeedMultiplier, .26, .7),
    spawnInterval: clamp(spawnInterval * spawnIntervalMultiplier, .62, 1.75),
    pairChance: clamp(pairChance, .08, .82)
  };
}

export function flightSectorIndex(checkpoints = 0) {
  return Math.min(FLIGHT_SECTORS.length - 1, Math.floor(Math.max(0, Number(checkpoints) || 0) / 2));
}

export function flightSector(checkpoints = 0) {
  const index = flightSectorIndex(checkpoints);
  return { ...FLIGHT_SECTORS[index], index };
}

export function ammoMilestone(checkpoints = 0, ammo = 0) {
  const level = Math.max(0, Number(checkpoints) || 0);
  const currentAmmo = Math.max(0, Number(ammo) || 0);
  if (level <= 0 || level % 5 !== 0) {
    return { recharged: false, ammo: currentAmmo, restored: 0, level };
  }
  const nextAmmo = Math.max(currentAmmo, 3);
  return { recharged: true, ammo: nextAmmo, restored: nextAmmo - currentAmmo, level };
}

export function flightSummary(state = {}) {
  return {
    distance: Math.round(Number(state.distance) || 0),
    checkpoints: Math.max(0, Number(state.checkpoints) || 0),
    correct: Math.max(0, Number(state.totalCorrect) || 0),
    bestStreak: Math.max(0, Number(state.bestStreak) || 0),
    destroyed: Math.max(0, Number(state.destroyed) || 0),
    collisions: Math.max(0, Number(state.totalCollisions) || 0),
    sector: flightSector(state.checkpoints).name,
    practice: Boolean(state.practice)
  };
}

export function flightHud(state = {}) {
  const checkpoints = Math.max(0, Number(state.checkpoints) || 0);
  return {
    fuel: Math.round(Number(state.fuel) || 0),
    hull: Math.max(0, Number(state.hull) || 0),
    distance: Math.round(Number(state.distance) || 0),
    checkpoint: checkpoints + 1,
    remaining: Math.max(0, Math.round((Number(state.nextCheckpoint) || 0) - (Number(state.distance) || 0))),
    level: checkpoints + 1,
    speed: Math.round(flightDifficulty(state).obstacleSpeed * 100),
    ammo: Math.max(0, Number(state.ammo) || 0),
    levelsUntilAmmo: 5 - (checkpoints % 5),
    streak: Math.max(0, Number(state.correctStreak) || 0),
    sector: flightSector(checkpoints),
    practice: Boolean(state.practice)
  };
}
