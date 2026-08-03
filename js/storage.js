// Fachada pública estable para almacenamiento local.
export { defaultSettings } from './core/settings.js';
export {
  clearGame,
  hasSavedGame,
  loadGame,
  loadSettings,
  saveGame,
  saveSettings
} from './services/game-storage.js';
