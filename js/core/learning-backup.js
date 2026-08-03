import { normalizeLearningProgress } from './learning-progress.js';
import { createLearningProfileId, normalizeLearningPilotName } from './learning-profiles.js';

export const LEARNING_BACKUP_SCHEMA = 'mision-nebula-learning-backup-v1';
const MAX_BACKUP_BYTES = 1024 * 1024;
const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function assertSafeKeys(value) {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (RESERVED_KEYS.has(key)) throw new Error('El respaldo contiene una clave reservada y no puede importarse.');
    assertSafeKeys(value[key]);
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  const result = Object.create(null);
  for (const key of Object.keys(value).sort()) result[key] = stableValue(value[key]);
  return result;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function checksum(value) {
  let hash = 0x811c9dc5;
  for (const character of stableStringify(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 'fnv1a32:' + hash.toString(16).padStart(8, '0');
}

function normalizeDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString();
}

function parseSource(source) {
  let parsed = source;
  if (typeof source === 'string') {
    if (new TextEncoder().encode(source).length > MAX_BACKUP_BYTES) throw new Error('El respaldo supera el límite de 1 MB.');
    try {
      parsed = JSON.parse(source);
    } catch (error) {
      throw new Error('El archivo no contiene un respaldo JSON válido.');
    }
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('El respaldo no tiene una estructura válida.');
  assertSafeKeys(parsed);
  return parsed;
}

function payloadWithoutIntegrity(value) {
  return {
    schema: value.schema,
    exportedAt: value.exportedAt,
    pilot: value.pilot,
    progress: value.progress
  };
}

export function createLearningBackup(progress, {
  pilotName = '',
  exportedAt = new Date().toISOString()
} = {}) {
  const safePilotName = normalizeLearningPilotName(pilotName);
  const payload = {
    schema: LEARNING_BACKUP_SCHEMA,
    exportedAt: normalizeDate(exportedAt),
    pilot: {
      id: createLearningProfileId(pilotName),
      name: safePilotName
    },
    progress: normalizeLearningProgress(progress)
  };
  return {
    ...payload,
    integrity: {
      algorithm: 'FNV-1a 32-bit',
      purpose: 'Detección de daños accidentales; no autentica la identidad del archivo.',
      checksum: checksum(payload)
    }
  };
}

export function createLearningBackupFile(progress, options = {}) {
  const backup = createLearningBackup(progress, options);
  const datePart = backup.exportedAt.slice(0, 10);
  return {
    format: 'json',
    mime: 'application/json;charset=utf-8',
    extension: 'json',
    filename: 'mision-nebula-respaldo-' + datePart + '.json',
    content: JSON.stringify(backup, null, 2),
    backup
  };
}

export function verifyLearningBackup(source, { expectedPilotName = '' } = {}) {
  const parsed = parseSource(source);
  if (parsed.schema !== LEARNING_BACKUP_SCHEMA) throw new Error('El archivo no pertenece al formato de respaldo compatible.');
  if (!parsed.pilot || typeof parsed.pilot !== 'object') throw new Error('El respaldo no identifica un perfil pedagógico.');
  if (!parsed.integrity || typeof parsed.integrity !== 'object') throw new Error('El respaldo no incluye verificación de integridad.');

  const pilotName = normalizeLearningPilotName(parsed.pilot.name);
  const pilotId = parsed.pilot.id === 'local' && pilotName === 'Piloto local'
    ? 'local'
    : createLearningProfileId(pilotName);
  if (parsed.pilot.id !== pilotId) throw new Error('La identidad local del respaldo es inconsistente.');

  const actualChecksum = checksum(payloadWithoutIntegrity(parsed));
  if (parsed.integrity.checksum !== actualChecksum) throw new Error('La verificación de integridad falló. El archivo pudo quedar incompleto o alterado.');

  const expectedId = expectedPilotName ? createLearningProfileId(expectedPilotName) : '';
  if (expectedId && expectedId !== pilotId) {
    throw new Error('Este respaldo pertenece a ' + pilotName + '. Cambia al piloto correspondiente antes de importarlo.');
  }

  return {
    schema: LEARNING_BACKUP_SCHEMA,
    exportedAt: normalizeDate(parsed.exportedAt),
    pilotId,
    pilotName,
    progress: normalizeLearningProgress(parsed.progress),
    checksum: actualChecksum
  };
}
