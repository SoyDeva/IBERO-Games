import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningProgressStore } from '../js/services/learning-progress-store.js';
import { renderTeacherLearningReport } from '../js/ui/teacher-learning-report.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test('resume perfiles locales y protege el perfil activo frente a eliminación', () => {
  const storage = createMemoryStorage();
  let pilotName = 'Luna';
  const store = createLearningProgressStore({ storage, resolvePilotName: () => pilotName });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });

  pilotName = 'Nova';
  store.record({ question: { category: 'Lenguaje' }, correct: false, mode: 'practice' });
  const summary = store.summary();
  const active = summary.availableProfiles.find((profile) => profile.active);
  const inactive = summary.availableProfiles.find((profile) => !profile.active);

  assert.equal(active.pilotName, 'Nova');
  assert.equal(active.accuracy, 0);
  assert.equal(inactive.pilotName, 'Luna');
  assert.equal(inactive.accuracy, 100);
  assert.throws(() => store.removeProfile(active.id), /perfil pedagógico activo/);

  const removed = store.removeProfile(inactive.id);
  assert.equal(removed.removed.pilotName, 'Luna');
  assert.equal(store.summary().profileCount, 1);
});

test('crea un respaldo consolidado desde el almacén', () => {
  const storage = createMemoryStorage();
  let pilotName = 'Luna';
  const store = createLearningProgressStore({ storage, resolvePilotName: () => pilotName });
  store.record({ question: { category: 'Ciencias' }, correct: true, mode: 'practice' });
  pilotName = 'Nova';
  store.record({ question: { category: 'Lenguaje' }, correct: true, mode: 'practice' });

  const file = store.createDeviceBackup({ exportedAt: '2026-08-03T22:00:00.000Z' });
  assert.equal(file.backup.profileCount, 2);
  assert.match(file.filename, /respaldo-dispositivo/);
});

test('representa comparación descriptiva y elimina solo perfiles inactivos', () => {
  const html = renderTeacherLearningReport({
    pilotName: 'Nova',
    learning: {
      profileId: 'pilot-nova',
      profileName: 'Nova',
      profileCount: 2,
      attempts: 3,
      accuracy: 67,
      bestStreak: 2,
      sessionCount: 1,
      categories: [],
      recentSessions: [],
      focus: [],
      availableProfiles: [
        { id: 'pilot-nova', pilotName: 'Nova', active: true, attempts: 3, accuracy: 67, sessions: 1, goalRate: 100, focusCategory: 'Lenguaje' },
        { id: 'pilot-luna', pilotName: 'Luna', active: false, attempts: 5, accuracy: 80, sessions: 2, goalRate: 50, focusCategory: 'Ciencias' }
      ]
    }
  });

  assert.match(html, /Perfiles pedagógicos locales/);
  assert.match(html, /no ordena estudiantes/);
  assert.match(html, /data-backup-learning-device/);
  assert.match(html, /data-delete-learning-profile="pilot-luna"/);
  assert.doesNotMatch(html, /data-delete-learning-profile="pilot-nova"/);
  assert.match(html, /Perfil activo/);
});
