export const NEBULA_RUSH_MAX = 100;
export const NEBULA_RUSH_DURATION = 6;
export const ENERGY_CORE_CHARGE = 22;
export const ENERGY_CORE_FUEL = 6;

const LANES = Object.freeze([-1, 0, 1]);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function randomValue(random) {
  const value = finite(random(), 0);
  return clamp(value, 0, .999999999);
}

export function createFlightExcitementState({ running = false, tutorial = false } = {}) {
  return {
    energyCores: [],
    coreSpawnTimer: running && !tutorial ? 7.5 : 99999,
    rushCharge: 0,
    rushTime: 0,
    rushMessageTime: 0,
    rushes: 0,
    coresCollected: 0
  };
}

export function createEnergyCore({ blockedLanes = [], random = Math.random } = {}) {
  const source = typeof random === 'function' ? random : Math.random;
  const blocked = new Set(Array.isArray(blockedLanes) ? blockedLanes : []);
  const available = LANES.filter((lane) => !blocked.has(lane));
  const lanes = available.length ? available : [...LANES];
  const lane = lanes[Math.floor(randomValue(source) * lanes.length)];
  return {
    lane,
    depth: .045,
    previousDepth: .045,
    spin: randomValue(source) * Math.PI * 2,
    spinSpeed: 1.7 + randomValue(source) * 1.3,
    pulse: randomValue(source) * Math.PI * 2,
    collected: false
  };
}

export function advanceEnergyCores(cores, { delta = 0, speed = 0 } = {}) {
  const elapsed = Math.max(0, finite(delta));
  const travelSpeed = Math.max(0, finite(speed));
  return (Array.isArray(cores) ? cores : []).map((core) => {
    const depth = finite(core?.depth);
    return {
      ...core,
      previousDepth: depth,
      depth: depth + elapsed * travelSpeed * .82,
      spin: finite(core?.spin) + elapsed * finite(core?.spinSpeed, 2)
    };
  });
}

export function isEnergyCoreCollected({ core, lanePosition } = {}) {
  if (!core || core.collected) return false;
  const depth = finite(core.depth);
  return depth >= .86
    && depth <= 1.04
    && Math.abs(finite(core.lane) - finite(lanePosition)) < .34;
}

export function cleanupEnergyCores(cores) {
  return (Array.isArray(cores) ? cores : [])
    .filter((core) => !core?.collected && finite(core?.depth) < 1.14);
}

export function chargeNebulaRush(state = {}, amount = 0) {
  const gained = Math.max(0, finite(amount));
  const currentCharge = clamp(finite(state.rushCharge), 0, NEBULA_RUSH_MAX);
  const activeTime = Math.max(0, finite(state.rushTime));
  const effectiveGain = activeTime > 0 ? gained * .25 : gained;
  const nextCharge = clamp(currentCharge + effectiveGain, 0, NEBULA_RUSH_MAX);

  if (activeTime > 0 || nextCharge < NEBULA_RUSH_MAX) {
    return {
      activated: false,
      patch: { rushCharge: nextCharge }
    };
  }

  return {
    activated: true,
    patch: {
      rushCharge: 0,
      rushTime: NEBULA_RUSH_DURATION,
      rushMessageTime: 2.2,
      rushes: Math.max(0, finite(state.rushes)) + 1,
      ammo: Math.min(9, Math.max(0, finite(state.ammo)) + 1),
      flash: Math.max(.88, finite(state.flash))
    }
  };
}

export function collectEnergyCore(state = {}) {
  const collected = Math.max(0, finite(state.coresCollected)) + 1;
  const ammoBonus = collected % 3 === 0 ? 1 : 0;
  const basePatch = {
    coresCollected: collected,
    fuel: Math.min(100, Math.max(0, finite(state.fuel)) + ENERGY_CORE_FUEL),
    ammo: Math.min(9, Math.max(0, finite(state.ammo)) + ammoBonus),
    flash: Math.max(.48, finite(state.flash))
  };
  const rush = chargeNebulaRush({ ...state, ...basePatch }, ENERGY_CORE_CHARGE);
  return {
    activated: rush.activated,
    ammoBonus,
    patch: { ...basePatch, ...rush.patch }
  };
}

export function penalizeNebulaRush(state = {}) {
  return {
    rushCharge: Math.max(0, finite(state.rushCharge) - 30),
    rushTime: 0,
    rushMessageTime: 0
  };
}

export function advanceExcitementTimers(state = {}, delta = 0) {
  const elapsed = Math.max(0, finite(delta));
  return {
    coreSpawnTimer: Math.max(0, finite(state.coreSpawnTimer) - elapsed),
    rushTime: Math.max(0, finite(state.rushTime) - elapsed),
    rushMessageTime: Math.max(0, finite(state.rushMessageTime) - elapsed)
  };
}

export function nebulaRushFuelMultiplier(state = {}) {
  return finite(state.rushTime) > 0 ? .45 : 1;
}
