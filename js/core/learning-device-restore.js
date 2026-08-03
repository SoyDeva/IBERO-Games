import { verifyLearningDeviceBackup } from './learning-device-backup.js';
import {
  MAX_LEARNING_PROFILES,
  createLearningProfileId,
  normalizeLearningProfileCollection
} from './learning-profiles.js';
import { summarizeLearningProgress } from './learning-progress.js';

const RESTORE_ACTIONS = new Set(['add', 'replace', 'keep', 'skip']);

function metricView(entry) {
  if (!entry) return null;
  const summary = summarizeLearningProgress(entry.progress);
  return {
    updatedAt: entry.updatedAt,
    attempts: summary.attempts,
    accuracy: summary.accuracy,
    sessions: summary.sessionCount,
    bestStreak: summary.bestStreak,
    focusCategory: summary.focus[0]?.name || ''
  };
}

function analyzeRestore(currentCollection, source, { activePilotName = '' } = {}) {
  const verified = verifyLearningDeviceBackup(source);
  const current = normalizeLearningProfileCollection(currentCollection);
  const activeProfileId = createLearningProfileId(activePilotName);
  const profiles = Object.entries(verified.collection.profiles).map(([id, incoming]) => {
    const local = current.profiles[id] || null;
    return {
      id,
      pilotName: incoming.pilotName,
      active: id === activeProfileId,
      conflict: Boolean(local),
      defaultAction: local ? 'keep' : 'add',
      incoming: metricView(incoming),
      local: metricView(local)
    };
  });

  return {
    verified,
    current,
    preview: {
      schema: verified.schema,
      exportedAt: verified.exportedAt,
      checksum: verified.checksum,
      backupProfileCount: verified.profileCount,
      currentProfileCount: Object.keys(current.profiles).length,
      newProfileCount: profiles.filter((profile) => !profile.conflict).length,
      conflictCount: profiles.filter((profile) => profile.conflict).length,
      activeConflictCount: profiles.filter((profile) => profile.active && profile.conflict).length,
      profiles
    }
  };
}

function normalizeDecisions(preview, decisions) {
  if (!Array.isArray(decisions)) throw new Error('La selección de perfiles no tiene un formato válido.');
  const available = new Map(preview.profiles.map((profile) => [profile.id, profile]));
  const normalized = new Map();

  for (const decision of decisions) {
    const profileId = String(decision?.profileId || '').trim();
    const action = String(decision?.action || '').trim();
    const profile = available.get(profileId);
    if (!profile) throw new Error('La selección contiene un perfil que no pertenece al respaldo verificado.');
    if (!RESTORE_ACTIONS.has(action)) throw new Error('La selección contiene una acción de restauración no permitida.');
    if (normalized.has(profileId)) throw new Error('La selección repite un perfil del respaldo.');
    if (profile.conflict && action === 'add') throw new Error('Un perfil coincidente no puede añadirse como perfil nuevo.');
    if (!profile.conflict && (action === 'replace' || action === 'keep')) {
      throw new Error('Un perfil nuevo solo puede añadirse o excluirse.');
    }
    normalized.set(profileId, action);
  }

  return normalized;
}

export function createLearningDeviceRestorePreview(currentCollection, source, options = {}) {
  return analyzeRestore(currentCollection, source, options).preview;
}

export function restoreLearningDeviceProfiles(currentCollection, source, decisions, options = {}) {
  const analysis = analyzeRestore(currentCollection, source, options);
  const selected = normalizeDecisions(analysis.preview, decisions);
  const profiles = { ...analysis.current.profiles };
  const result = {
    added: 0,
    replaced: 0,
    kept: 0,
    skipped: 0,
    activeProfileReplaced: false
  };

  for (const profile of analysis.preview.profiles) {
    const action = selected.get(profile.id) || 'skip';
    if (action === 'skip') {
      result.skipped += 1;
      continue;
    }
    if (action === 'keep') {
      result.kept += 1;
      continue;
    }

    profiles[profile.id] = analysis.verified.collection.profiles[profile.id];
    if (action === 'add') result.added += 1;
    if (action === 'replace') {
      result.replaced += 1;
      if (profile.active) result.activeProfileReplaced = true;
    }
  }

  if (Object.keys(profiles).length > MAX_LEARNING_PROFILES) {
    throw new Error('La selección supera el límite de ' + MAX_LEARNING_PROFILES + ' perfiles pedagógicos en este dispositivo.');
  }

  const collection = normalizeLearningProfileCollection({
    version: analysis.current.version,
    profiles
  });
  return {
    collection,
    ...result,
    applied: result.added + result.replaced,
    selected: Array.from(selected.values()).filter((action) => action !== 'skip').length,
    checksum: analysis.verified.checksum,
    exportedAt: analysis.verified.exportedAt
  };
}
