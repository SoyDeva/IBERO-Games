import { normalizeLearningProfileCollection } from './learning-profiles.js';

export const LEARNING_DEVICE_BACKUP_SCHEMA = 'mision-nebula-learning-device-backup-v1';
const MAX_DEVICE_BACKUP_BYTES = 5 * 1024 * 1024;
const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
}

function checksum(value) {
  let hash = 0x811c9dc5;
  for (const character of JSON.stringify(stableValue(value))) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 'fnv1a32:' + hash.toString(16).padStart(8, '0');
}

function normalizeDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString();
}

function assertSafeKeys(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (RESERVED_KEYS.has(key)) throw new Error('El respaldo consolidado contiene una clave reservada no permitida.');
    assertSafeKeys(value[key], seen);
  }
}

function parseSource(source) {
  if (typeof source === 'string') {
    if (new TextEncoder().encode(source).length > MAX_DEVICE_BACKUP_BYTES) {
      throw new Error('El respaldo consolidado supera el límite de 5 MB.');
    }
    try {
      return JSON.parse(source);
    } catch (error) {
      throw new Error('El archivo no contiene un respaldo consolidado JSON válido.');
    }
  }
  if (!source || typeof source !== 'object') throw new Error('El respaldo consolidado no tiene una estructura válida.');
  return source;
}

function payloadWithoutIntegrity(value) {
  return {
    schema: value.schema,
    exportedAt: value.exportedAt,
    profileCount: value.profileCount,
    privacy: value.privacy,
    collection: value.collection
  };
}

export function createLearningDeviceBackup(collection, {
  exportedAt = new Date().toISOString()
} = {}) {
  const normalized = normalizeLearningProfileCollection(collection);
  const payload = {
    schema: LEARNING_DEVICE_BACKUP_SCHEMA,
    exportedAt: normalizeDate(exportedAt),
    profileCount: Object.keys(normalized.profiles).length,
    privacy: 'Respaldo pedagógico local del dispositivo; no contiene contraseñas, tokens ni datos de Supabase.',
    collection: normalized
  };
  return {
    ...payload,
    integrity: {
      algorithm: 'FNV-1a 32-bit',
      purpose: 'Detección de daños accidentales; no autentica la identidad ni la autoría del archivo.',
      checksum: checksum(payload)
    }
  };
}

export function createLearningDeviceBackupFile(collection, options = {}) {
  const backup = createLearningDeviceBackup(collection, options);
  const datePart = backup.exportedAt.slice(0, 10);
  return {
    format: 'json',
    mime: 'application/json;charset=utf-8',
    extension: 'json',
    filename: 'mision-nebula-respaldo-dispositivo-' + datePart + '.json',
    content: JSON.stringify(backup, null, 2),
    backup
  };
}

export function verifyLearningDeviceBackup(source) {
  const parsed = parseSource(source);
  assertSafeKeys(parsed);
  if (parsed.schema !== LEARNING_DEVICE_BACKUP_SCHEMA) {
    throw new Error('El archivo no pertenece al formato de respaldo consolidado compatible.');
  }
  if (!parsed.integrity || typeof parsed.integrity !== 'object') {
    throw new Error('El respaldo consolidado no incluye verificación de integridad.');
  }

  const actualChecksum = checksum(payloadWithoutIntegrity(parsed));
  if (parsed.integrity.checksum !== actualChecksum) {
    throw new Error('La verificación de integridad del respaldo consolidado falló.');
  }

  const collection = normalizeLearningProfileCollection(parsed.collection);
  const profileCount = Object.keys(collection.profiles).length;
  if (Number(parsed.profileCount) !== profileCount) {
    throw new Error('El número de perfiles del respaldo consolidado es inconsistente.');
  }

  return {
    schema: LEARNING_DEVICE_BACKUP_SCHEMA,
    exportedAt: normalizeDate(parsed.exportedAt),
    profileCount,
    collection,
    checksum: actualChecksum
  };
}
