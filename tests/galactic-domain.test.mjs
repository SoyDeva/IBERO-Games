import assert from 'node:assert/strict';
import test from 'node:test';

import { createGalacticError } from '../js/core/galactic-errors.js';
import {
  buildGalacticScorePayload,
  mapGalacticLeaderboard,
  mapGalacticLeaderboardRow
} from '../js/core/galactic-score.js';
import { claimGalacticPilot } from '../js/services/galactic-league-service.js';

test('construye un resultado RPC normalizado sin alterar las reglas públicas', () => {
  assert.deepEqual(buildGalacticScorePayload({
    token: 'abc',
    season: '24',
    seasonName: 'Expedición Horizonte 24',
    result: {
      distance: 420.6,
      checkpoints: 1.2,
      correct: 1,
      destroyed: -4
    }
  }), {
    p_token: 'abc',
    p_season: 'v24',
    p_season_name: 'Expedición Horizonte 24',
    p_distance: 421,
    p_checkpoints: 1,
    p_correct: 1,
    p_destroyed: 0,
    p_skin: 'nebula',
    p_trail: 'pulse'
  });
});

test('transforma las filas de Supabase al modelo utilizado por la interfaz', () => {
  const source = {
    rank_position: '2',
    nickname: 'Asteria',
    distance: '850',
    checkpoints: '2',
    correct_answers: '2',
    destroyed: '4',
    skin: 'solar',
    trail: 'comet',
    achieved_at: '2026-08-03T18:00:00Z'
  };

  assert.deepEqual(mapGalacticLeaderboardRow(source), {
    position: 2,
    name: 'Asteria',
    distance: 850,
    checkpoints: 2,
    correct: 2,
    destroyed: 4,
    skin: 'solar',
    trail: 'comet',
    date: '2026-08-03T18:00:00Z'
  });
  assert.deepEqual(mapGalacticLeaderboard(null), []);
});

test('conserva códigos y mensajes de error comprensibles', () => {
  const error = createGalacticError('invalid_season', { status: 400 });
  assert.equal(error.name, 'GalacticLeagueError');
  assert.equal(error.code, 'invalid_season');
  assert.equal(error.status, 400);
  assert.match(error.message, /versión/i);
});

test('acepta una contraseña de 12 caracteres y la envía completa', async () => {
  const previousFetch = globalThis.fetch;
  let payload = null;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ nickname: 'Piloto', token: 't'.repeat(64), protected: true })
    };
  };

  try {
    const profile = await claimGalacticPilot('Piloto', '123456789012');
    assert.equal(profile.nickname, 'Piloto');
    assert.equal(payload.p_pin, '123456789012');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('rechaza contraseñas menores de 4 o mayores de 12 antes de conectar', async () => {
  await assert.rejects(
    claimGalacticPilot('Piloto', '123'),
    (error) => error.code === 'pin_required'
  );
  await assert.rejects(
    claimGalacticPilot('Piloto', '1234567890123'),
    (error) => error.code === 'pin_required'
  );
});
