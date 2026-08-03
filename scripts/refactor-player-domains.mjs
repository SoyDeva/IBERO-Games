import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar dominios del jugador',
  "import { claimGalacticPilot, getGalacticLeaderboard, submitGalacticScore } from './galactic-league.js?v=23';",
  "import { claimGalacticPilot, getGalacticLeaderboard, submitGalacticScore } from './galactic-league.js?v=23';\nimport { ACHIEVEMENTS } from './core/achievements.js?v=23';\nimport { createAchievementStore } from './services/achievement-store.js?v=23';\nimport { createEconomyStore } from './services/economy-store.js?v=23';\nimport { cleanPilotName, getPilotName, getPilotSession, loadRememberedPilot, savePilot } from './services/pilot-profile-store.js?v=23';"
);

replaceOnce('retirar sesión local duplicada', "let activePilotSession = null;\n", '');
replaceOnce('retirar clave de economía duplicada', "const ECONOMY_KEY = 'nebula-economy-v1';\n", '');
replaceOnce('retirar clave de perfil duplicada', "const PROFILE_KEY = 'nebula-pilot-profile';\n", '');

replaceOnce(
  'extraer economía y catálogo de logros',
  /const ACHIEVEMENTS = \{[\s\S]*?function updateCrystalDisplays\(\) \{/,
  "const economyStore = createEconomyStore({ skins: SHIP_SKINS, trails: SHIP_TRAILS });\nconst achievementStore = createAchievementStore();\nconst loadEconomy = () => economyStore.load();\nconst saveEconomy = (economy) => economyStore.save(economy);\nconst loadAchievements = () => achievementStore.load();\n\nfunction updateCrystalDisplays() {"
);

replaceOnce(
  'usar almacén de logros',
  "  const unlocked = loadAchievements();\n  if (unlocked.includes(id)) return;\n  unlocked.push(id);\n  localStorage.setItem('nebula-achievements', JSON.stringify(unlocked));",
  "  if (!achievementStore.unlock(id)) return;"
);

replaceOnce(
  'extraer perfil del piloto',
  /function cleanPilotName\(value = ''\) \{[\s\S]*?function openPilotDialog\(action = null\) \{/,
  'function openPilotDialog(action = null) {'
);

for (const forbidden of ['ECONOMY_KEY', 'PROFILE_KEY', 'activePilotSession', "localStorage.setItem('nebula-achievements'"]) {
  if (source.includes(forbidden)) throw new Error(`Persistió código duplicado: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js usa ahora los dominios modulares de piloto, economía y logros.');
