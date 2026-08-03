import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar hangar y ranking',
  "import { ACHIEVEMENTS } from './core/achievements.js?v=23';",
  "import { ACHIEVEMENTS } from './core/achievements.js?v=23';\nimport { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';"
);
replaceOnce(
  'importar controlador de ranking',
  "import { createEconomyStore } from './services/economy-store.js?v=23';",
  "import { createEconomyStore } from './services/economy-store.js?v=23';\nimport { createRankingController } from './services/ranking-controller.js?v=23';"
);

replaceOnce(
  'retirar estado global de ranking',
  "let globalRanking = [];\nlet rankingStatus = 'idle';\nlet rankingError = '';\nlet rankingUpdatedAt = 0;\n",
  ''
);

replaceOnce(
  'crear controladores de hangar y ranking',
  "const achievementStore = createAchievementStore();\n",
  "const achievementStore = createAchievementStore();\nconst hangarCatalogs = { skins: SHIP_SKINS, trails: SHIP_TRAILS };\nconst rankingController = createRankingController({ loadLeaderboard: getGalacticLeaderboard, submitScore: submitGalacticScore });\n"
);

replaceOnce(
  'extraer estado remoto de ranking',
  /function loadRanking\(\) \{[\s\S]*?\n\}\n\nfunction setRoute\(next\) \{/,
  `async function refreshGlobalRanking(force = false) {
  const request = rankingController.refresh({ season: GAME_RELEASE, limit: 10, force });
  if (route === 'ranking') render();
  const { ranking } = await request;
  if (route === 'ranking') render();
  return ranking;
}

async function recordRanking(result) {
  if (flightMode !== 'mission' || result.practice) return { position: null };
  const session = getPilotSession();
  if (!session?.token) return { position: null, error: 'Registra tu apodo para entrar en la Liga Galáctica.' };
  const economy = loadEconomy();
  try {
    const response = await rankingController.submit({
      token: session.token,
      season: GAME_RELEASE,
      seasonName: SEASON_NAME,
      result,
      skin: economy.activeSkin,
      trail: economy.activeTrail
    });
    refreshGlobalRanking(true);
    return { position: Number(response?.position) || null, updated: Boolean(response?.updated) };
  } catch (error) {
    return { position: null, error: error.message, code: error.code };
  }
}

function setRoute(next) {`
);

replaceOnce(
  'leer snapshot de ranking en la pantalla',
  "function renderRanking() {\n  const ranking = loadRanking();",
  "function renderRanking() {\n  const { ranking, status: rankingStatus, error: rankingError } = rankingController.getSnapshot();"
);

replaceOnce(
  'extraer acciones del hangar',
  /function bindShop\(\) \{[\s\S]*?\n\}\n\nfunction render\(\) \{/,
  `function bindShop() {
  document.querySelectorAll('[data-buy-item]').forEach((button) => button.addEventListener('click', () => {
    const result = purchaseHangarItem(loadEconomy(), { kind: button.dataset.kind, id: button.dataset.item }, hangarCatalogs);
    if (result.status === 'invalid' || result.status === 'owned') return;
    if (result.status === 'insufficient') {
      shopMessage = 'Te faltan ' + result.missing + ' cristales para desbloquear ' + result.item.name + '.';
      playTone('empty');
      render();
      return;
    }
    saveEconomy(result.economy);
    shopMessage = result.item.icon + ' ¡' + result.item.name + ' desbloqueada y activada!';
    playTone('achievement');
    render();
  }));
  document.querySelectorAll('[data-equip-item]').forEach((button) => button.addEventListener('click', () => {
    const result = equipHangarItem(loadEconomy(), { kind: button.dataset.kind, id: button.dataset.item }, hangarCatalogs);
    if (result.status !== 'equipped') return;
    saveEconomy(result.economy);
    shopMessage = result.item.icon + ' ' + result.item.name + ' está en uso.';
    playTone('complete');
    render();
  }));
}

function render() {`
);

replaceOnce(
  'consultar estado del ranking al renderizar',
  "if (route === 'ranking' && rankingStatus === 'idle') window.setTimeout(() => refreshGlobalRanking(), 0);",
  "if (route === 'ranking' && rankingController.getSnapshot().status === 'idle') window.setTimeout(() => refreshGlobalRanking(), 0);"
);

replaceOnce(
  'invalidar ranking al cambiar de piloto',
  "    rankingStatus = 'idle';",
  "    rankingController.invalidate();"
);

for (const forbidden of ['let globalRanking', 'let rankingStatus', 'let rankingError', 'let rankingUpdatedAt', 'function loadRanking()']) {
  if (source.includes(forbidden)) throw new Error(`Persistió estado duplicado: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js delega Hangar Estelar y ranking a módulos independientes.');
