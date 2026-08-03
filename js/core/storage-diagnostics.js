import { STORAGE_KEYS } from '../config/storage-keys.js';
import { inspectLearningRecoveryPoint } from './learning-recovery.js';
import {
  createLearningProfileCollection,
  createLearningProfileId,
  normalizeLearningProfileCollection
} from './learning-profiles.js';

export const STORAGE_RECOMMENDED_LIMIT_BYTES = 4 * 1024 * 1024;
const PROGRESS_VERSION = 2;
const APP_KEYS = new Set(Object.values(STORAGE_KEYS));

function bytes(value) {
  return new TextEncoder().encode(String(value || '')).length;
}

function parseJson(raw) {
  if (raw === null || raw === '') return { present: false, value: null, valid: true };
  try {
    return { present: true, value: JSON.parse(raw), valid: true };
  } catch (error) {
    return { present: true, value: null, valid: false };
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function profileLooksDamaged(id, entry) {
  if (!isObject(entry) || typeof entry.pilotName !== 'string' || !entry.pilotName.trim()) return true;
  if (!Number.isFinite(Date.parse(entry.updatedAt))) return true;
  if (!isObject(entry.progress) || entry.progress.version !== PROGRESS_VERSION) return true;
  if (!isObject(entry.progress.totals) || !isObject(entry.progress.categories)) return true;
  if (!Array.isArray(entry.progress.sessions) || !isObject(entry.progress.preferences)) return true;
  return id !== 'local' && id !== createLearningProfileId(entry.pilotName);
}

function issue(level, code, message, { key = '', cleanable = false } = {}) {
  return { level, code, message, key, cleanable };
}

function summarizeStatus(issues) {
  if (issues.some((entry) => entry.level === 'critical')) return 'critical';
  if (issues.length) return 'warning';
  return 'ok';
}

export function formatStorageBytes(value) {
  const size = Math.max(0, Number(value) || 0);
  if (size < 1024) return Math.round(size) + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(size < 10 * 1024 ? 1 : 0) + ' KB';
  return (size / (1024 * 1024)).toFixed(2) + ' MB';
}

export function diagnoseStorageSnapshot({
  entries = {},
  readable = true,
  writable = true,
  now = new Date().toISOString()
} = {}) {
  const safeEntries = isObject(entries) ? entries : {};
  const issues = [];
  const cleanupKeys = new Set();
  let totalBytes = 0;
  let appBytes = 0;
  let learningBytes = 0;

  for (const [key, value] of Object.entries(safeEntries)) {
    const entryBytes = bytes(key) + bytes(value);
    totalBytes += entryBytes;
    if (APP_KEYS.has(key) || key.startsWith(STORAGE_KEYS.rankingPrefix)) appBytes += entryBytes;
    if ([STORAGE_KEYS.learningProfiles, STORAGE_KEYS.learningProgress, STORAGE_KEYS.learningRecovery].includes(key)) {
      learningBytes += entryBytes;
    }
  }

  if (!readable) issues.push(issue('critical', 'storage-unreadable', 'El navegador no permite leer el almacenamiento local.'));
  if (!writable) issues.push(issue('critical', 'storage-unwritable', 'El navegador no permite comprobar o guardar datos locales.'));

  const profilesRaw = Object.hasOwn(safeEntries, STORAGE_KEYS.learningProfiles)
    ? safeEntries[STORAGE_KEYS.learningProfiles]
    : null;
  const profilesParsed = parseJson(profilesRaw);
  let collection = createLearningProfileCollection();
  let profileCount = 0;
  let damagedProfiles = 0;

  if (profilesParsed.present && !profilesParsed.valid) {
    issues.push(issue('critical', 'profiles-invalid-json', 'La colección de perfiles pedagógicos contiene JSON ilegible.'));
  } else if (profilesParsed.present) {
    if (!isObject(profilesParsed.value) || !isObject(profilesParsed.value.profiles)) {
      issues.push(issue('critical', 'profiles-invalid-shape', 'La colección de perfiles pedagógicos no tiene una estructura válida.'));
    } else {
      collection = normalizeLearningProfileCollection(profilesParsed.value);
      profileCount = Object.keys(collection.profiles).length;
      damagedProfiles = Object.entries(profilesParsed.value.profiles)
        .filter(([id, entry]) => profileLooksDamaged(id, entry)).length;
      if (damagedProfiles) {
        issues.push(issue(
          'warning',
          'profiles-normalized',
          damagedProfiles + (damagedProfiles === 1
            ? ' perfil contiene datos reparables que el juego normaliza al leerlo.'
            : ' perfiles contienen datos reparables que el juego normaliza al leerlos.')
        ));
      }
    }
  }

  const legacyPresent = Object.hasOwn(safeEntries, STORAGE_KEYS.learningProgress);
  if (legacyPresent && profilesParsed.valid && profilesParsed.present) {
    cleanupKeys.add(STORAGE_KEYS.learningProgress);
    issues.push(issue(
      'warning',
      'legacy-progress-obsolete',
      'Existe un progreso pedagógico antiguo que ya fue absorbido por los perfiles actuales.',
      { key: STORAGE_KEYS.learningProgress, cleanable: true }
    ));
  } else if (legacyPresent && !profilesParsed.present) {
    issues.push(issue('warning', 'legacy-progress-pending', 'Hay progreso antiguo pendiente de migración al perfil activo.'));
  }

  const recoveryRaw = Object.hasOwn(safeEntries, STORAGE_KEYS.learningRecovery)
    ? safeEntries[STORAGE_KEYS.learningRecovery]
    : null;
  const recoveryParsed = parseJson(recoveryRaw);
  if (recoveryParsed.present) {
    let recoveryValid = false;
    if (recoveryParsed.valid && profilesParsed.valid) {
      try {
        recoveryValid = Boolean(inspectLearningRecoveryPoint(recoveryParsed.value, collection, { now }));
      } catch (error) {
        recoveryValid = false;
      }
    }
    if (!recoveryValid) {
      cleanupKeys.add(STORAGE_KEYS.learningRecovery);
      issues.push(issue(
        'warning',
        'recovery-obsolete',
        'Existe un punto de recuperación vencido, alterado o incompatible con el estado actual.',
        { key: STORAGE_KEYS.learningRecovery, cleanable: true }
      ));
    }
  }

  const rankingKeys = Object.keys(safeEntries).filter((key) => key.startsWith(STORAGE_KEYS.rankingPrefix));
  for (const key of rankingKeys) cleanupKeys.add(key);
  if (rankingKeys.length) {
    issues.push(issue(
      'warning',
      'ranking-cache-obsolete',
      rankingKeys.length + (rankingKeys.length === 1
        ? ' caché local de clasificación puede eliminarse y volverá a cargarse desde la Liga.'
        : ' cachés locales de clasificación pueden eliminarse y volverán a cargarse desde la Liga.'),
      { cleanable: true }
    ));
  }

  if (totalBytes >= STORAGE_RECOMMENDED_LIMIT_BYTES) {
    issues.push(issue(
      'warning',
      'recommended-limit',
      'El almacenamiento local supera el umbral preventivo de ' + formatStorageBytes(STORAGE_RECOMMENDED_LIMIT_BYTES) + '.'
    ));
  }

  const status = summarizeStatus(issues);
  return {
    status,
    readable: Boolean(readable),
    writable: Boolean(writable),
    canBackup: status !== 'critical',
    canRestore: status !== 'critical',
    totalBytes,
    appBytes,
    learningBytes,
    totalText: formatStorageBytes(totalBytes),
    appText: formatStorageBytes(appBytes),
    learningText: formatStorageBytes(learningBytes),
    recommendedLimitBytes: STORAGE_RECOMMENDED_LIMIT_BYTES,
    usagePercent: Math.min(999, Math.round((totalBytes / STORAGE_RECOMMENDED_LIMIT_BYTES) * 100)),
    profileCount,
    damagedProfiles,
    cleanupKeys: Array.from(cleanupKeys).sort(),
    cleanupCount: cleanupKeys.size,
    issues
  };
}

export function assertStorageDiagnosticReady(diagnostic, action = 'continuar') {
  if (!diagnostic || diagnostic.status === 'critical') {
    const detail = diagnostic?.issues?.find((entry) => entry.level === 'critical')?.message || 'El diagnóstico local no está disponible.';
    throw new Error('No es seguro ' + action + ': ' + detail);
  }
  return diagnostic;
}
