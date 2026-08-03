import { createGalacticError } from '../core/galactic-errors.js';
import {
  buildGalacticScorePayload,
  mapGalacticLeaderboard
} from '../core/galactic-score.js';
import { normalizeSeasonCode } from '../core/galactic-season.js';
import { callSupabaseRpc } from './supabase-rpc.js';

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 8;

function normalizePin(pin) {
  return String(pin || '');
}

export async function claimGalacticPilot(nickname, pin = '') {
  const cleanPin = normalizePin(pin);
  if (cleanPin.length < MIN_PIN_LENGTH || cleanPin.length > MAX_PIN_LENGTH) {
    throw createGalacticError('pin_required');
  }

  return callSupabaseRpc('claim_galactic_pilot', {
    p_nickname: nickname,
    p_pin: cleanPin
  });
}

export async function getGalacticLeaderboard(season, limit = 10) {
  const rows = await callSupabaseRpc('get_galactic_leaderboard', {
    p_season: normalizeSeasonCode(season),
    p_limit: limit
  });

  return mapGalacticLeaderboard(rows);
}

export async function submitGalacticScore(input) {
  return callSupabaseRpc('submit_galactic_score', buildGalacticScorePayload(input));
}
