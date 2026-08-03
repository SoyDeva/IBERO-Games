import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar reglas de estación',
  "import { createRouteState } from './core/routes.js?v=23';",
  "import { createRouteState } from './core/routes.js?v=23';\nimport { createStationSession, STATION_OFFERS } from './core/station.js?v=23';"
);
replaceOnce(
  'importar panel de pausa',
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';",
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';\nimport { applyPausePanelState } from './ui/pause-panel.js?v=23';"
);
replaceOnce(
  'importar panel de estación',
  "import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';",
  "import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';\nimport { closeStationPanel, openStationPanel, renderStationOffers, setStationResult, updateStationButtons } from './ui/station-panel.js?v=23';"
);

replaceOnce('retirar estado global de compra', 'let stationPurchased = false;\n', '');
replaceOnce(
  'retirar catálogo duplicado',
  /const STATION_OFFERS = \{[\s\S]*?\n\};\n\nconst economyStore/,
  'const economyStore'
);
replaceOnce(
  'crear sesión de estación',
  `const questionSession = createQuestionSession({
  resolveLevel: levelForPortal,
  createDeck: shuffledQuestions,
  shuffleOptions: shuffledQuestionOptions
});`,
  `const questionSession = createQuestionSession({
  resolveLevel: levelForPortal,
  createDeck: shuffledQuestions,
  shuffleOptions: shuffledQuestionOptions
});
const stationSession = createStationSession();`
);
replaceOnce(
  'delegar renderizado de ofertas',
  "const stationOffers = Object.entries(STATION_OFFERS).map(([id, offer]) => '<button class=\"station-offer\" type=\"button\" data-station-buy=\"' + id + '\" data-price=\"' + offer.price + '\"><span>' + offer.icon + '</span><strong>' + offer.name + '</strong><small>' + offer.description + '</small><b>💎 ' + offer.price + '</b></button>').join('');",
  'const stationOffers = renderStationOffers(STATION_OFFERS);'
);

replaceOnce(
  'reiniciar paneles al comenzar misión',
  /function startFlightSession\(\) \{[\s\S]*?\n\}\n\nfunction refreshStationButtons\(\) \{/,
  `function startFlightSession() {
  window.clearTimeout(quizTimer);
  const overlay = document.getElementById('flight-overlay');
  const quizPanel = document.getElementById('quiz-panel');
  if (overlay) overlay.hidden = true;
  applyPausePanelState({ documentRef: document, paused: false });
  closeStationPanel({ documentRef: document });
  if (quizPanel) {
    quizPanel.hidden = true;
    quizPanel.dataset.answered = 'false';
  }
  const achievementPop = document.getElementById('achievement-pop');
  if (achievementPop) achievementPop.hidden = true;
  runAchievements = [];
  runCrystals = 0;
  stationSession.reset();
  lastLearnedFact = '';
  const economy = loadEconomy();
  flight.start({ practice: flightMode === 'practice', tutorial: flightMode === 'tutorial', skin: economy.activeSkin, trail: economy.activeTrail });
  startMusic(1);
  playTone('complete');
  const message = flightMode === 'practice' ? '🧪 PRÁCTICA ACTIVA · AQUÍ APRENDEMOS' : flightMode === 'tutorial' ? '🎮 SIGUE A NOVA, TU GUÍA' : '🎵 MÚSICA ESPACIAL ACTIVADA';
  showToast(getSettings().sound ? message : '🔇 Música apagada · toca MÚSICA para activarla', getSettings().sound ? 'success' : 'normal');
  document.getElementById('flight-canvas')?.focus();
}

function refreshStationButtons() {`
);

replaceOnce(
  'extraer estación y pausa',
  /function refreshStationButtons\(\) \{[\s\S]*?\n\}\n\nfunction showQuiz\(meta\) \{/,
  `function refreshStationButtons() {
  updateStationButtons({
    documentRef: document,
    credits: loadEconomy().credits,
    purchased: stationSession.hasPurchased()
  });
}

function showStation(progress) {
  if (!document.getElementById('station-panel')) return;
  stationSession.reset();
  flight.enterStation();
  updateCrystalDisplays();
  refreshStationButtons();
  openStationPanel({ documentRef: document, progress });
  playTone('achievement');
  announce('Llegaste a la Estación Nova. Puedes elegir una mejora o continuar la misión.');
}

function buyStationItem(id) {
  if (flight?.mode !== 'station') return;
  const decision = stationSession.inspect(id, loadEconomy().credits);
  if (decision.status === 'invalid' || decision.status === 'completed') return;
  if (decision.status === 'insufficient') {
    setStationResult('Necesitas más cristales para comprar esa mejora.', { documentRef: document });
    playTone('empty');
    refreshStationButtons();
    return;
  }
  if (!spendCrystals(decision.offer.price)) {
    setStationResult('Necesitas más cristales para comprar esa mejora.', { documentRef: document });
    playTone('empty');
    refreshStationButtons();
    return;
  }
  if (!flight.applyStationPurchase(id)) return;
  stationSession.confirm(id);
  refreshStationButtons();
  setStationResult('✅ ' + decision.offer.name + ' instalada. ¡La Asteria está lista!', { documentRef: document });
  playTone('core');
}

function leaveStation() {
  if (!document.getElementById('station-panel') || flight?.mode !== 'station') return;
  closeStationPanel({ documentRef: document });
  flight.leaveStation();
  showToast(stationSession.hasPurchased() ? '🛰️ MEJORA INSTALADA · ¡SIGUE LA MISIÓN!' : '💎 CRISTALES GUARDADOS · ¡SIGUE LA MISIÓN!', 'success');
  document.getElementById('flight-canvas')?.focus();
}

function togglePause(forceResume = false) {
  if (!flight || ['idle', 'gameover', 'quiz'].includes(flight.mode)) return;
  if (!document.getElementById('station-panel')?.hidden) return;
  const panel = document.getElementById('pause-panel');
  const shouldResume = forceResume || !panel?.hidden;
  if (shouldResume) {
    applyPausePanelState({ documentRef: document, paused: false });
    flight.resume();
    startMusic(flight.checkpoints + 1);
  } else {
    flight.pause();
    stopMusic();
    applyPausePanelState({ documentRef: document, paused: true });
  }
}

function showQuiz(meta) {`
);

for (const forbidden of [
  'let stationPurchased = false',
  'const STATION_OFFERS = {',
  'Object.entries(STATION_OFFERS).map',
  "document.querySelectorAll('[data-station-buy]').forEach",
  "button.innerHTML = '<span>▶</span><strong>Continuar</strong>'"
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió lógica duplicada de estación o pausa: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js delega Estación Nova y panel de pausa.');
