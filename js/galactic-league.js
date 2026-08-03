const SUPABASE_URL = 'https://zvrznmlliucnyvaffgst.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3RFUw1oyiSZGKdH7aEc3ng_uyNMwW93';

const ERROR_MESSAGES = {
  invalid_nickname: 'Usa un apodo de 2 a 18 caracteres.',
  invalid_pin_length: 'La contraseña debe tener entre 4 y 8 caracteres.',
  nickname_taken: 'Ese apodo ya pertenece a otro piloto. Elige uno diferente.',
  pin_required: 'La Liga Galáctica requiere una contraseña de 4 a 8 caracteres para proteger y recuperar tu apodo.',
  pin_invalid: 'La contraseña no coincide con ese apodo.',
  invalid_session: 'La sesión del piloto venció. Registra o desbloquea el apodo otra vez.',
  invalid_season: 'La versión de esta expedición no es válida. Recarga el juego e inténtalo de nuevo.',
  invalid_score: 'El resultado del vuelo no pudo validarse.',
  rate_limited: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.'
};

function leagueError(code) {
  const error = new Error(ERROR_MESSAGES[code] || 'No fue posible conectar con la Liga Galáctica.');
  error.code = code;
  return error;
}

export function normalizeSeasonCode(value) {
  const cleanValue = String(value || 'local').trim().replace(/^v+(?=[0-9])/i, '');
  const safeValue = cleanValue.replace(/[^0-9A-Za-z._-]/g, '').slice(0, 31) || 'local';
  return `v${safeValue}`;
}

async function callRpc(name, body, { timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const code = payload?.message || payload?.code || 'network_error';
      const error = leagueError(code);
      error.status = response.status;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('La Liga Galáctica tardó demasiado en responder. Revisa tu conexión.');
      timeoutError.code = 'timeout';
      throw timeoutError;
    }
    if (error.code) throw error;
    const networkError = new Error('No hay conexión con la Liga Galáctica. Puedes jugar y volver a intentar después.');
    networkError.code = 'network_error';
    throw networkError;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function claimGalacticPilot(nickname, pin = '') {
  const cleanPin = String(pin || '');
  if (cleanPin.length < 4 || cleanPin.length > 8) throw leagueError('pin_required');
  return callRpc('claim_galactic_pilot', {
    p_nickname: nickname,
    p_pin: cleanPin
  });
}

export async function getGalacticLeaderboard(season, limit = 10) {
  const rows = await callRpc('get_galactic_leaderboard', {
    p_season: normalizeSeasonCode(season),
    p_limit: limit
  });
  return Array.isArray(rows) ? rows.map((row) => ({
    position: Number(row.rank_position),
    name: row.nickname,
    distance: Number(row.distance),
    checkpoints: Number(row.checkpoints),
    correct: Number(row.correct_answers),
    destroyed: Number(row.destroyed),
    skin: row.skin,
    trail: row.trail,
    date: row.achieved_at
  })) : [];
}

export async function submitGalacticScore({ token, season, seasonName, result, skin, trail }) {
  return callRpc('submit_galactic_score', {
    p_token: token,
    p_season: normalizeSeasonCode(season),
    p_season_name: seasonName,
    p_distance: Math.max(0, Math.round(Number(result.distance) || 0)),
    p_checkpoints: Math.max(0, Math.round(Number(result.checkpoints) || 0)),
    p_correct: Math.max(0, Math.round(Number(result.correct) || 0)),
    p_destroyed: Math.max(0, Math.round(Number(result.destroyed) || 0)),
    p_skin: skin || 'nebula',
    p_trail: trail || 'pulse'
  });
}
