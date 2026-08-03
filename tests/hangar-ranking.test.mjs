import assert from 'node:assert/strict';
import test from 'node:test';

import { equipHangarItem, purchaseHangarItem } from '../js/core/hangar.js';
import { createRankingController } from '../js/services/ranking-controller.js';

const catalogs = {
  skins: {
    nebula: { name: 'Nebulosa', icon: '🛸', price: 0 },
    solar: { name: 'Solar', icon: '☀️', price: 20 }
  },
  trails: {
    pulse: { name: 'Pulso', icon: '✨', price: 0 },
    comet: { name: 'Cometa', icon: '☄️', price: 15 }
  }
};

function economy(credits = 30) {
  return {
    credits,
    ownedSkins: ['nebula'],
    activeSkin: 'nebula',
    ownedTrails: ['pulse'],
    activeTrail: 'pulse'
  };
}

test('compra y activa un elemento del hangar sin mutar el estado anterior', () => {
  const current = economy();
  const result = purchaseHangarItem(current, { kind: 'skin', id: 'solar' }, catalogs);
  assert.equal(result.status, 'purchased');
  assert.equal(result.economy.credits, 10);
  assert.deepEqual(result.economy.ownedSkins, ['nebula', 'solar']);
  assert.equal(result.economy.activeSkin, 'solar');
  assert.deepEqual(current, economy());
});

test('informa cristales faltantes y evita compras inválidas', () => {
  const insufficient = purchaseHangarItem(economy(7), { kind: 'trail', id: 'comet' }, catalogs);
  assert.equal(insufficient.status, 'insufficient');
  assert.equal(insufficient.missing, 8);
  assert.equal(purchaseHangarItem(economy(), { kind: 'skin', id: 'fantasma' }, catalogs).status, 'invalid');
});

test('equipa únicamente elementos desbloqueados', () => {
  const locked = equipHangarItem(economy(), { kind: 'trail', id: 'comet' }, catalogs);
  assert.equal(locked.status, 'locked');

  const owned = { ...economy(), ownedTrails: ['pulse', 'comet'] };
  const equipped = equipHangarItem(owned, { kind: 'trail', id: 'comet' }, catalogs);
  assert.equal(equipped.status, 'equipped');
  assert.equal(equipped.economy.activeTrail, 'comet');
});

test('el controlador de ranking usa caché e invalida después de enviar', async () => {
  let clock = 1000;
  let loads = 0;
  let submissions = 0;
  const controller = createRankingController({
    now: () => clock,
    ttl: 100,
    loadLeaderboard: async () => {
      loads += 1;
      return [{ name: 'Nova', distance: 900 }];
    },
    submitScore: async () => {
      submissions += 1;
      return { position: 1, updated: true };
    }
  });

  await controller.refresh({ season: '23' });
  await controller.refresh({ season: '23' });
  assert.equal(loads, 1);
  assert.equal(controller.getSnapshot().status, 'ready');

  clock += 101;
  await controller.refresh({ season: '23' });
  assert.equal(loads, 2);

  const result = await controller.submit({ token: 'x' });
  assert.equal(result.position, 1);
  assert.equal(submissions, 1);
  assert.equal(controller.getSnapshot().status, 'idle');
});

test('el controlador conserva un error legible sin borrar el ranking anterior', async () => {
  let fail = false;
  const controller = createRankingController({
    loadLeaderboard: async () => {
      if (fail) throw new Error('Sin señal');
      return [{ name: 'Aster', distance: 500 }];
    },
    submitScore: async () => ({})
  });

  await controller.refresh({ season: '23' });
  fail = true;
  await controller.refresh({ season: '23', force: true });
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.status, 'error');
  assert.equal(snapshot.error, 'Sin señal');
  assert.equal(snapshot.ranking[0].name, 'Aster');
});
