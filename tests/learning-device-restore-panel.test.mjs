import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readLearningDeviceRestoreDecisions,
  renderLearningDeviceRestorePreview
} from '../js/ui/learning-device-restore-panel.js';

test('representa perfiles nuevos y coincidencias sin inyectar contenido', () => {
  const html = renderLearningDeviceRestorePreview({
    exportedAt: '2026-08-03T12:00:00.000Z',
    newProfileCount: 1,
    conflictCount: 1,
    profiles: [
      {
        id: 'pilot-luna',
        pilotName: '<Luna>',
        active: true,
        conflict: true,
        incoming: { attempts: 8, accuracy: 75, sessions: 2, updatedAt: '2026-08-02T10:00:00.000Z' },
        local: { attempts: 5, accuracy: 80, sessions: 1, updatedAt: '2026-08-01T10:00:00.000Z' }
      },
      {
        id: 'pilot-nova',
        pilotName: 'Nova',
        active: false,
        conflict: false,
        incoming: { attempts: 3, accuracy: 67, sessions: 1, updatedAt: '2026-08-02T11:00:00.000Z' },
        local: null
      }
    ]
  });

  assert.match(html, /Vista previa verificada/);
  assert.match(html, /Conservar datos locales/);
  assert.match(html, /Reemplazar con el respaldo/);
  assert.match(html, /Se añadirá como perfil nuevo/);
  assert.match(html, /data-apply-learning-device-restore/);
  assert.match(html, /&lt;Luna&gt;/);
  assert.doesNotMatch(html, /<Luna>/);
});

test('lee decisiones explícitas y excluye perfiles desmarcados', () => {
  const checkboxes = [
    { value: 'pilot-luna', checked: true },
    { value: 'pilot-nova', checked: false },
    { value: 'pilot-cometa', checked: true }
  ];
  const root = {
    querySelectorAll(selector) {
      return selector === '[data-restore-learning-profile]' ? checkboxes : [];
    },
    querySelector(selector) {
      if (selector === '[data-restore-learning-action="pilot-luna"]') return { value: 'replace' };
      return null;
    }
  };

  assert.deepEqual(readLearningDeviceRestoreDecisions(root), [
    { profileId: 'pilot-luna', action: 'replace' },
    { profileId: 'pilot-nova', action: 'skip' },
    { profileId: 'pilot-cometa', action: 'add' }
  ]);
});
