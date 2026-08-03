// Fachada pública estable para la aplicación.
// La implementación se divide en dominio puro, transporte y servicios.
export { normalizeSeasonCode } from './core/galactic-season.js';
export {
  claimGalacticPilot,
  getGalacticLeaderboard,
  submitGalacticScore
} from './services/galactic-league-service.js';
