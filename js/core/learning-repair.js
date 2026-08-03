import {
  MAX_LEARNING_PROFILES,
  createLearningProfileCollection,
  createLearningProfileId,
  listLearningProfiles,
  normalizeLearningProfileCollection
} from './learning-profiles.js';

export const LEARNING_REPAIR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function utf8Bytes(value) {
  return new TextEncoder().encode(String(value || '')).length;
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value || '')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 'fnv1a32:' + hash.toString(16).padStart(8, '0');
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertSafeKeys(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (RESERVED_KEYS.has(key)) {
      throw new Error('La colección contiene una clave reservada no permitida.');
    }
    assertSafeKeys(value[key], seen);
  }
}

function sourceEntries(value) {
  if (!isObject(value) || !isObject(value.profiles)) return null;
  return Object.entries(value.profiles);
}

function normalizeCandidate(sourceId, candidate) {
  if (!isObject(candidate) || !isObject(candidate.progress)) return null;
  const rawName = String(candidate.pilotName || '').trim().slice(0, 48);
  if (!rawName && sourceId !== 'local') return null;
  const pilotName = rawName || 'Piloto local';
  const normalizedId = sourceId === 'local' && !rawName ? 'local' : createLearningProfileId(pilotName);
  const single = normalizeLearningProfileCollection({
    version: 1,
    profiles: {
      [normalizedId]: {
        pilotName,
        updatedAt: candidate.updatedAt,
        progress: candidate.progress
      }
    }
  });
  const entry = single.profiles[normalizedId];
  return entry ? { id: normalizedId, entry } : null;
}

function chooseLatest(previous, candidate) {
  if (!previous) return candidate;
  return Date.parse(candidate.updatedAt) >= Date.parse(previous.updatedAt) ? candidate : previous;
}

function safeTimestamp(value = new Date().toISOString()) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString();
}

function filenameTimestamp(value) {
  return safeTimestamp(value).replace(/[:.]/g, '-');
}

export function createLearningRepairPreview(rawSource, { activePilotName = '' } = {}) {
  const source = rawSource === null || rawSource === undefined ? '' : String(rawSource);
  const sourceBytes = utf8Bytes(source);
  const sourceFingerprint = fnv1a32(source);
  const base = {
    sourcePresent: source.length > 0,
    sourceBytes,
    sourceFingerprint,
    validJson: false,
    canRepair: false,
    status: 'unavailable',
    sourceEntryCount: 0,
    recoveredCount: 0,
    repairedCount: 0,
    droppedCount: 0,
    duplicateCount: 0,
    profiles: [],
    messages: [],
    collection: createLearningProfileCollection()
  };

  if (!source) {
    return { ...base, messages: ['No existe una colección pedagógica guardada para reparar.'] };
  }
  if (sourceBytes > LEARNING_REPAIR_MAX_SOURCE_BYTES) {
    return {
      ...base,
      status: 'oversized',
      messages: ['La colección supera el límite defensivo de 5 MB y no puede analizarse automáticamente.']
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return {
      ...base,
      status: 'invalid-json',
      messages: ['El contenido original no es JSON legible. Puede descargarse, pero no se modificará automáticamente.']
    };
  }

  try {
    assertSafeKeys(parsed);
  } catch (error) {
    return {
      ...base,
      validJson: true,
      status: 'unsafe',
      messages: [error.message]
    };
  }

  const entries = sourceEntries(parsed);
  if (!entries) {
    return {
      ...base,
      validJson: true,
      status: 'invalid-shape',
      messages: ['El JSON no contiene una colección de perfiles reconocible. El original puede descargarse, pero no se guardará una reparación.']
    };
  }

  const profiles = {};
  let recoveredCount = 0;
  let repairedCount = 0;
  let droppedCount = 0;
  let duplicateCount = 0;
  const limitedEntries = entries.slice(0, MAX_LEARNING_PROFILES);
  droppedCount += Math.max(0, entries.length - limitedEntries.length);

  for (const [sourceId, candidate] of limitedEntries) {
    const normalized = normalizeCandidate(sourceId, candidate);
    if (!normalized) {
      droppedCount += 1;
      continue;
    }
    recoveredCount += 1;
    if (profiles[normalized.id]) duplicateCount += 1;
    profiles[normalized.id] = chooseLatest(profiles[normalized.id], normalized.entry);
    const originalComparable = isObject(candidate)
      ? {
          pilotName: String(candidate.pilotName || '').trim().slice(0, 48) || 'Piloto local',
          updatedAt: candidate.updatedAt,
          progress: candidate.progress
        }
      : null;
    if (sourceId !== normalized.id || JSON.stringify(originalComparable) !== JSON.stringify(normalized.entry)) {
      repairedCount += 1;
    }
  }

  const collection = normalizeLearningProfileCollection({ version: 1, profiles });
  const profileViews = listLearningProfiles(collection, { activePilotName });
  const uniqueRecovered = profileViews.length;
  const changed = repairedCount > 0 || droppedCount > 0 || duplicateCount > 0
    || parsed.version !== collection.version
    || entries.length !== uniqueRecovered;
  const canRepair = uniqueRecovered > 0 && changed;
  const messages = [];
  if (canRepair) {
    messages.push('La vista previa recupera ' + uniqueRecovered + (uniqueRecovered === 1 ? ' perfil reconocible.' : ' perfiles reconocibles.'));
  } else if (uniqueRecovered > 0) {
    messages.push('La colección ya coincide con la estructura normalizada y no requiere reparación.');
  } else {
    messages.push('No se encontraron perfiles con apodo y progreso suficientes para una reparación segura.');
  }
  if (droppedCount) messages.push(droppedCount + (droppedCount === 1 ? ' entrada irreconocible será excluida.' : ' entradas irreconocibles serán excluidas.'));
  if (duplicateCount) messages.push(duplicateCount + (duplicateCount === 1 ? ' coincidencia de apodo se resolverá conservando la actualización más reciente.' : ' coincidencias de apodo se resolverán conservando la actualización más reciente.'));

  return {
    ...base,
    validJson: true,
    canRepair,
    status: canRepair ? 'repairable' : uniqueRecovered ? 'clean' : 'unrecoverable',
    sourceEntryCount: entries.length,
    recoveredCount: uniqueRecovered,
    repairedCount,
    droppedCount,
    duplicateCount,
    profiles: profileViews,
    messages,
    collection
  };
}

export function createLearningRepairOriginalFile(rawSource, {
  createdAt = new Date().toISOString()
} = {}) {
  const source = rawSource === null || rawSource === undefined ? '' : String(rawSource);
  if (!source) throw new Error('No existe contenido pedagógico original para descargar.');
  if (utf8Bytes(source) > LEARNING_REPAIR_MAX_SOURCE_BYTES) {
    throw new Error('El contenido original supera el límite defensivo de 5 MB.');
  }
  let extension = 'json';
  try { JSON.parse(source); } catch (error) { extension = 'txt'; }
  return {
    content: source,
    mime: extension === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    extension,
    filename: 'mision-nebula-original-pedagogico-' + filenameTimestamp(createdAt) + '.' + extension,
    sourceFingerprint: fnv1a32(source)
  };
}

export function applyLearningRepair(rawSource, expectedFingerprint, options = {}) {
  const preview = createLearningRepairPreview(rawSource, options);
  if (preview.sourceFingerprint !== String(expectedFingerprint || '')) {
    throw new Error('Los datos locales cambiaron después de la vista previa. Vuelve a revisar la reparación.');
  }
  if (!preview.canRepair) {
    throw new Error('La colección no contiene una reparación segura que pueda aplicarse.');
  }
  return {
    collection: preview.collection,
    preview
  };
}
