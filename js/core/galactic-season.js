const DEFAULT_SEASON = 'local';
const MAX_SEASON_LENGTH = 31;

/**
 * Normaliza el identificador público de una temporada al formato aceptado por PostgreSQL.
 * La función es pura para poder validarla sin navegador ni conexión de red.
 */
export function normalizeSeasonCode(value) {
  const cleanValue = String(value || DEFAULT_SEASON)
    .trim()
    .replace(/^v+(?=[0-9])/i, '');
  const safeValue = cleanValue
    .replace(/[^0-9A-Za-z._-]/g, '')
    .slice(0, MAX_SEASON_LENGTH) || DEFAULT_SEASON;

  return `v${safeValue}`;
}
