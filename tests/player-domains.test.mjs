import assert from 'node:assert/strict';
import test from 'node:test';

import { ACHIEVEMENTS, normalizeAchievements } from '../js/core/achievements.js';
import { normalizeEconomy } from '../js/core/economy.js';
import { cleanPilotName, normalizePilotProfile } from '../js/core/pilot-profile.js';
import { createAchievementStore } from '../js/services/achievement-store.js';
import { createEconomyStore } from '../js/services/economy-store.js';
import { createPilotProfileStore } from '../js/services/pilot-profile-store.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const catalogs = {
  skins: { nebula: {}, solar: {} },
  trails: { pulse: {}, comet: {} }
};

test('limpia y normaliza el perfil del piloto', () => {
  assert.equal(cleanPilotName('  Ana 🚀   Cósmica<>  '), 'Ana Cósmica');
  assert.deepEqual(normalizePilotProfile({ nickname: ' Nova ', token: 123, protected: 1 }, true), {
    name: 'Nova', token: '123', protected: true, remember: true
  });
});

test('conserva la sesión activa y solo recuerda cuando se solicita', () => {
  const storage = createMemoryStorage();
  const store = createPilotProfileStore({ storage });
  store.save({ nickname: 'Aster', token: 'abc', protected: true }, true);
  assert.equal(store.getName(), 'Aster');
  assert.equal(createPilotProfileStore({ storage }).loadRemembered()?.token, 'abc');

  store.save({ nickname: 'Nova', token: 'xyz', protected: true }, false);
  assert.equal(store.getName(), 'Nova');
  assert.equal(createPilotProfileStore({ storage }).loadRemembered(), null);
});

test('normaliza economía y descarta elementos inexistentes', () => {
  assert.deepEqual(normalizeEconomy({
    credits: '19.9',
    ownedSkins: ['solar', 'fantasma'],
    activeSkin: 'fantasma',
    ownedTrails: ['comet', 'inexistente'],
    activeTrail: 'comet'
  }, catalogs), {
    credits: 19,
    ownedSkins: ['nebula', 'solar'],
    activeSkin: 'nebula',
    ownedTrails: ['pulse', 'comet'],
    activeTrail: 'comet'
  });
});

test('el almacén de economía persiste una versión normalizada', () => {
  const storage = createMemoryStorage();
  const store = createEconomyStore({ ...catalogs, storage });
  store.save({ credits: -10, ownedSkins: ['solar'], activeSkin: 'solar', ownedTrails: [], activeTrail: 'x' });
  assert.deepEqual(store.load(), {
    credits: 0,
    ownedSkins: ['nebula', 'solar'],
    activeSkin: 'solar',
    ownedTrails: ['pulse'],
    activeTrail: 'pulse'
  });
});

test('los logros válidos se deduplican y se desbloquean una sola vez', () => {
  assert.deepEqual(normalizeAchievements(['first_portal', 'first_portal', 'otro']), ['first_portal']);
  assert.equal(Boolean(ACHIEVEMENTS.explorer), true);

  const storage = createMemoryStorage();
  const store = createAchievementStore({ storage });
  assert.equal(store.unlock('first_portal'), true);
  assert.equal(store.unlock('first_portal'), false);
  assert.equal(store.unlock('desconocido'), false);
  assert.deepEqual(store.load(), ['first_portal']);
});
