import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar escape HTML',
  "import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';",
  "import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';\nimport { escapeHtml } from './core/html.js?v=23';"
);
replaceOnce(
  'importar pantallas dinámicas',
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';",
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';\nimport { renderHangarScreen } from './ui/hangar-screen.js?v=23';\nimport { renderHomeScreen } from './ui/home-screen.js?v=23';\nimport { renderRankingScreen } from './ui/ranking-screen.js?v=23';"
);

replaceOnce(
  'retirar escape HTML duplicado',
  /function escapeHtml\(value = ''\) \{[\s\S]*?\n\}\n\nfunction openPilotDialog/,
  'function openPilotDialog'
);

replaceOnce(
  'delegar pantalla de inicio',
  /function renderHome\(\) \{[\s\S]*?\n\}\n\nfunction skinPreviewMarkup/,
  `function renderHome() {
  const economy = loadEconomy();
  return renderHomeScreen({
    best: Number(localStorage.getItem('nebula-flight-best') || 0),
    unlocked: loadAchievements(),
    economy,
    activeSkin: SHIP_SKINS[economy.activeSkin],
    pilotName: getPilotName(),
    learned: localStorage.getItem('nebula-tutorial-complete') === 'true',
    achievements: ACHIEVEMENTS
  });
}

function skinPreviewMarkup`
);

replaceOnce(
  'delegar pantalla del Hangar',
  /function skinPreviewMarkup[\s\S]*?\n\}\n\nfunction renderRanking\(\) \{/,
  `function renderShop() {
  return renderHangarScreen({
    economy: loadEconomy(),
    skins: SHIP_SKINS,
    trails: SHIP_TRAILS,
    message: shopMessage
  });
}

function renderRanking() {`
);

replaceOnce(
  'delegar pantalla de la Liga',
  /function renderRanking\(\) \{[\s\S]*?\n\}\n\nfunction renderFlight\(\) \{/,
  `function renderRanking() {
  return renderRankingScreen({
    snapshot: rankingController.getSnapshot(),
    pilotName: getPilotName(),
    seasonName: SEASON_NAME,
    skins: SHIP_SKINS,
    trails: SHIP_TRAILS
  });
}

function renderFlight() {`
);

for (const forbidden of [
  "function escapeHtml(value = '')",
  'function skinPreviewMarkup',
  'function trailPreviewMarkup',
  'function catalogAction',
  "const achievementShelf = Object.entries(ACHIEVEMENTS)",
  "const medals = ['🥇', '🥈', '🥉']"
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió renderizado duplicado: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js delega Inicio, Hangar y Liga a renderizadores dinámicos.');
