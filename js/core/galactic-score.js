import { normalizeSeasonCode } from './galactic-season.js';

function toNonNegativeInteger(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

export function buildGalacticScorePayload({
  token,
  season,
  seasonName,
  result = {},
  skin,
  trail
}) {
  return {
    p_token: String(token || ''),
    p_season: normalizeSeasonCode(season),
    p_season_name: String(seasonName || ''),
    p_distance: toNonNegativeInteger(result.distance),
    p_checkpoints: toNonNegativeInteger(result.checkpoints),
    p_correct: toNonNegativeInteger(result.correct),
    p_destroyed: toNonNegativeInteger(result.destroyed),
    p_skin: skin || 'nebula',
    p_trail: trail || 'pulse'
  };
}

export function mapGalacticLeaderboardRow(row = {}) {
  return {
    position: Number(row.rank_position),
    name: row.nickname,
    distance: Number(row.distance),
    checkpoints: Number(row.checkpoints),
    correct: Number(row.correct_answers),
    destroyed: Number(row.destroyed),
    skin: row.skin,
    trail: row.trail,
    date: row.achieved_at
  };
}

export function mapGalacticLeaderboard(rows) {
  return Array.isArray(rows) ? rows.map(mapGalacticLeaderboardRow) : [];
}
