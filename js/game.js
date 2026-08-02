import { ZONES, PROBLEMS, RESOURCES, RESTRICTIONS, TWISTS, ROLES } from './data.js';

/**
 * Crea el estado serializable de una expedición nueva.
 * @param {object} config Configuración elegida por la tripulación.
 * @returns {object} Estado inicial de la partida.
 */
export function createGame(config) {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config,
    currentMission: 0,
    missionCount: config.length === 'quick' ? 3 : 5,
    missions: [],
    totalEnergy: 0,
    completed: false
  };
}

function sample(items, count) {
  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, count);
}

function pickUnused(items, usedValues) {
  const available = items.filter((item) => !usedValues.has(item));
  return sample(available.length ? available : items, 1)[0];
}

/**
 * Genera una misión reproducible durante la sesión y evita repetir problemas y giros ya usados.
 * @param {object} game Estado de la partida.
 * @param {number} index Índice de misión.
 * @returns {object} Misión creada o previamente guardada.
 */
export function generateMission(game, index = game.currentMission) {
  const existing = game.missions[index];
  if (existing) return existing;
  const usedProblems = new Set(game.missions.map((mission) => mission.problem));
  const usedTwists = new Set(game.missions.map((mission) => mission.twist));
  const resourceCount = 3;
  const minimumResources = 2;
  const zoneIndex = game.config.length === 'quick' ? Math.round(index * 2) : index;
  return {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()) + '-' + index,
    index,
    zone: ZONES[Math.min(zoneIndex, 4)],
    problem: pickUnused(PROBLEMS, usedProblems),
    resources: sample(RESOURCES, resourceCount),
    minimumResources,
    restriction: sample(RESTRICTIONS, 1)[0],
    twist: pickUnused(TWISTS, usedTwists),
    roles: assignRoles(game.config.players, index),
    solution: emptySolution(),
    evaluation: null,
    energy: 0,
    badge: null,
    completedAt: null
  };
}

export function emptySolution() {
  return {
    name: '', description: '', solvedProblem: '', alternatives: '', selectedResources: [],
    resourceFunctions: {}, steps: '', reasoning: '', environment: '',
    changes: '', changeReason: '', drawing: '', blueprintId: '', powers: {}, primaryPower: '',
    reasonChoices: [], careChoice: '', optionalDetail: '', adaptationChoice: '', adaptedResource: ''
  };
}

export function assignRoles(players, missionIndex) {
  if (!players.length) return [];
  return ROLES.map((role, roleIndex) => ({
    ...role,
    player: players[(roleIndex + missionIndex) % players.length]
  }));
}

export function missionProgress(game) {
  return Math.round((game.currentMission / game.missionCount) * 100);
}

export function completeMission(game, mission) {
  const copy = typeof structuredClone === 'function' ? structuredClone(game) : JSON.parse(JSON.stringify(game));
  copy.missions[mission.index] = mission;
  copy.totalEnergy = copy.missions.reduce((sum, item) => sum + (item.energy || 0), 0);
  copy.currentMission = mission.index + 1;
  copy.completed = copy.currentMission >= copy.missionCount;
  copy.updatedAt = new Date().toISOString();
  return copy;
}

export function elapsedMinutes(game) {
  const start = new Date(game.createdAt).getTime();
  const end = game.completed ? new Date(game.updatedAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / 60000));
}
