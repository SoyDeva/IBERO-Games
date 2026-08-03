import { createLearningProgress, normalizeLearningProgress } from './learning-progress.js';

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

export function listLearningProfiles(collection) {
  const normalized = normalizeLearningProfileCollection(collection);
  return Object.entries(normalized.profiles)
    .map(([id, entry]) => ({
      id,
      pilotName: entry.pilotName,
      updatedAt: entry.updatedAt,
      attempts: entry.progress.totals.attempts,
      sessions: entry.progress.sessions.length
    }))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.pilotName.localeCompare(b.pilotName));
}
