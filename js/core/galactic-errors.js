export const GALACTIC_ERROR_MESSAGES = Object.freeze({
  invalid_nickname: 'Usa un apodo de 2 a 18 caracteres.',
  invalid_pin_length: 'La contraseña debe tener entre 4 y 8 caracteres.',
  nickname_taken: 'Ese apodo ya pertenece a otro piloto. Elige uno diferente.',
  pin_required: 'La Liga Galáctica requiere una contraseña de 4 a 8 caracteres para proteger y recuperar tu apodo.',
  pin_invalid: 'La contraseña no coincide con ese apodo.',
  invalid_session: 'La sesión del piloto venció. Registra o desbloquea el apodo otra vez.',
  invalid_season: 'La versión de esta expedición no es válida. Recarga el juego e inténtalo de nuevo.',
  invalid_score: 'El resultado del vuelo no pudo validarse.',
  rate_limited: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
  timeout: 'La Liga Galáctica tardó demasiado en responder. Revisa tu conexión.',
  network_error: 'No hay conexión con la Liga Galáctica. Puedes jugar y volver a intentar después.'
});

const DEFAULT_MESSAGE = 'No fue posible conectar con la Liga Galáctica.';

export function createGalacticError(code = 'network_error', options = {}) {
  const error = new Error(GALACTIC_ERROR_MESSAGES[code] || DEFAULT_MESSAGE);
  error.name = 'GalacticLeagueError';
  error.code = code;
  if (Number.isInteger(options.status)) error.status = options.status;
  if (options.cause) error.cause = options.cause;
  return error;
}
