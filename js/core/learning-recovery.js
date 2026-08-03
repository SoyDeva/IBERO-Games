import { normalizeLearningProfileCollection } from './learning-profiles.js';

export const LEARNING_RECOVERY_SCHEMA = 'mision-nebula-learning-recovery-v1';
export const LEARNING_RECOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ACTIONS = Object.freeze({
  delete: 'eliminación de perfil',
  import: 'importación de perfil',
  restore: 'restauración consolidada'
});
const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  const result = Object.create(null);
  for (const key of Object.keys(value).sort()) result[key] = stableValue(value[key]);
  return result;
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (const character of JSON.stringify(stableValue(value))) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 'fnv1a32:' + hash.toString(16).padStart(8, '0');
}

function assertSafeKeys(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (RESERVED_KEYS.has(key)) throw new Error('El punto de recuperación contiene una clave reservada no permitida.');
    assertSafeKeys(value[key], seen);
  }
}

function normalizeDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function payloadWithoutIntegrity(value) {
  return {
    schema: value.schema,
    action: value.action,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
    previousCollection: value.previousCollection,
    expectedCurrentFingerprint: value.expectedCurrentFingerprint
  };
}

export function learningCollectionFingerprint(collection) {
  return fnv1a32(normalizeLearningProfileCollection(collection));
}

export function createLearningRecoveryPoint(previousCollection, currentCollection, {
  action,
  createdAt = new Date().toISOString(),
  maxAgeMs = LEARNING_RECOVERY_MAX_AGE_MS
} = {}) {
  if (!Object.hasOwn(ACTIONS, action)) throw new Error('La acción no admite punto de recuperación.');
  const created = normalizeDate(createdAt);
  if (!created) throw new Error('La fecha del punto de recuperación no es válida.');
  const age = Math.max(60_000, Math.min(Number(maxAgeMs) || LEARNING_RECOVERY_MAX_AGE_MS, LEARNING_RECOVERY_MAX_AGE_MS));
  const payload = {
    schema: LEARNING_RECOVERY_SCHEMA,
    action,
    createdAt: created,
    expiresAt: new Date(Date.parse(created) + age).toISOString(),
    previousCollection: normalizeLearningProfileCollection(previousCollection),
    expectedCurrentFingerprint: learningCollectionFingerprint(currentCollection)
  };
  return {
    ...payload,
    integrity: {
      algorithm: 'FNV-1a 32-bit',
      checksum: fnv1a32(payload)
    }
  };
}

export function inspectLearningRecoveryPoint(source, currentCollection, {
  now = new Date().toISOString()
} = {}) {
  if (!source || typeof source !== 'object') return null;
  assertSafeKeys(source);
  if (source.schema !== LEARNING_RECOVERY_SCHEMA || !Object.hasOwn(ACTIONS, source.action)) return null;
  if (!source.integrity || source.integrity.checksum !== fnv1a32(payloadWithoutIntegrity(source))) return null;
  const createdAt = normalizeDate(source.createdAt);
  const expiresAt = normalizeDate(source.expiresAt);
  const currentTime = Date.parse(now);
  if (!createdAt || !expiresAt || !Number.isFinite(currentTime) || currentTime > Date.parse(expiresAt)) return null;
  if (source.expectedCurrentFingerprint !== learningCollectionFingerprint(currentCollection)) return null;
  return {
    available: true,
    action: source.action,
    label: ACTIONS[source.action],
    createdAt,
    expiresAt
  };
}

export function restoreLearningRecoveryPoint(source, currentCollection, options = {}) {
  const info = inspectLearningRecoveryPoint(source, currentCollection, options);
  if (!info) throw new Error('El punto de recuperación ya no está disponible porque venció o existen cambios posteriores.');
  return {
    ...info,
    collection: normalizeLearningProfileCollection(source.previousCollection)
  };
}
