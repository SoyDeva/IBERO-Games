import { createLearningProgress, normalizeLearningProgress, summarizeLearningProgress } from './learning-progress.js';

const PROFILE_COLLECTION_VERSION = 1;
const MAX_PROFILES = 50;

function safeText(value, maximum = 80) {
  return String(value || '').trim().slice(0, maximum);
}

function normalizeDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date(0).toISOString();
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function normalizeLearningPilotName(value) {
  return safeText(value, 48) || 'Piloto local';
}

export function createLearningProfileId(pilotName) {
  const rawName = safeText(pilotName, 48);
  if (!rawName) return 'local';
  const canonical = rawName.normalize('NFKC').toLocaleLowerCase('es');
  return 'pilot-' + fnv1a32(canonical);
}

export function createLearningProfileCollection() {
  return { version: PROFILE_COLLECTION_VERSION, profiles: {} };
}

function normalizeProfileEntry(value = {}) {
  return {
    pilotName: normalizeLearningPilotName(value.pilotName),
    updatedAt: normalizeDate(value.updatedAt),
    progress: normalizeLearningProgress(value.progress)
  };
}

export function normalizeLearningProfileCollection(value) {
  const source = value && typeof value === 'object' ? value : {};
  const profiles = {};
  const entries = source.profiles && typeof source.profiles === 'object'
    ? Object.entries(source.profiles).slice(0, MAX_PROFILES)
    : [];

  for (const [sourceId, candidate] of entries) {
    const entry = normalizeProfileEntry(candidate);
    const id = sourceId === 'local' ? 'local' : createLearningProfileId(entry.pilotName);
    const previous = profiles[id];
    if (!previous || Date.parse(entry.updatedAt) >= Date.parse(previous.updatedAt)) profiles[id] = entry;
  }

  return { version: PROFILE_COLLECTION_VERSION, profiles };
}

export function readLearningProfile(collection, pilotName) {
  const normalized = normalizeLearningProfileCollection(collection);
  const id = createLearningProfileId(pilotName);
  return normalized.profiles[id]?.progress || createLearningProgress();
}

export function upsertLearningProfile(collection, {
  pilotName,
  progress,
  updatedAt = new Date().toISOString()
} = {}) {
  const normalized = normalizeLearningProfileCollection(collection);
  const safePilotName = normalizeLearningPilotName(pilotName);
  const id = createLearningProfileId(pilotName);
  return {
    version: PROFILE_COLLECTION_VERSION,
    profiles: {
      ...normalized.profiles,
      [id]: {
        pilotName: safePilotName,
        updatedAt: normalizeDate(updatedAt),
        progress: normalizeLearningProgress(progress)
      }
    }
  };
}

export function removeLearningProfile(collection, pilotName) {
  const normalized = normalizeLearningProfileCollection(collection);
  const id = createLearningProfileId(pilotName);
  const profiles = { ...normalized.profiles };
  delete profiles[id];
  return { version: PROFILE_COLLECTION_VERSION, profiles };
}

export function removeLearningProfileById(collection, profileId, { protectedProfileId = '' } = {}) {
  const normalized = normalizeLearningProfileCollection(collection);
  const id = safeText(profileId, 64);
  if (!id || !Object.hasOwn(normalized.profiles, id)) {
    return { collection: normalized, removed: null };
  }
  if (id === safeText(protectedProfileId, 64)) {
    throw new Error('El perfil pedagógico activo no puede eliminarse. Cambia de piloto antes de borrarlo.');
  }

  const profiles = { ...normalized.profiles };
  const removedEntry = profiles[id];
  delete profiles[id];
  return {
    collection: { version: PROFILE_COLLECTION_VERSION, profiles },
    removed: { id, pilotName: removedEntry.pilotName }
  };
}

export function adoptLocalLearningProfile(collection, pilotName) {
  const normalized = normalizeLearningProfileCollection(collection);
  const targetName = normalizeLearningPilotName(pilotName);
  const targetId = createLearningProfileId(pilotName);
  if (targetId === 'local' || normalized.profiles[targetId] || !normalized.profiles.local) return normalized;

  const profiles = { ...normalized.profiles };
  const local = profiles.local;
  delete profiles.local;
  profiles[targetId] = { ...local, pilotName: targetName, updatedAt: new Date().toISOString() };
  return { version: PROFILE_COLLECTION_VERSION, profiles };
}

function profileView(id, entry, activeProfileId) {
  const summary = summarizeLearningProgress(entry.progress);
  const sessions = entry.progress.sessions.length;
  const reachedGoals = entry.progress.sessions.filter((session) => session.goalReached).length;
  return {
    id,
    pilotName: entry.pilotName,
    updatedAt: entry.updatedAt,
    active: id === activeProfileId,
    attempts: summary.attempts,
    correct: summary.correct,
    accuracy: summary.accuracy,
    bestStreak: summary.bestStreak,
    sessions,
    goalRate: sessions ? Math.round((reachedGoals / sessions) * 100) : 0,
    focusCategory: summary.focus[0]?.name || '',
    strengthCategory: summary.strength?.name || ''
  };
}

export function listLearningProfiles(collection, { activePilotName = '' } = {}) {
  const normalized = normalizeLearningProfileCollection(collection);
  const activeProfileId = createLearningProfileId(activePilotName);
  return Object.entries(normalized.profiles)
    .map(([id, entry]) => profileView(id, entry, activeProfileId))
    .sort((a, b) => Number(b.active) - Number(a.active)
      || Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      || a.pilotName.localeCompare(b.pilotName));
}
