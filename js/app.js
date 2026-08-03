import { SpaceFlight, SHIP_SKINS, SHIP_TRAILS } from './space-game.js?v=23';
import { shuffledQuestions, levelForPortal, shuffledQuestionOptions } from './questions.js';
import { bindSettings, applySettings, getSettings, announce, playTone, startMusic, setMusicIntensity, stopMusic } from './accessibility.js?v=23';
import { claimGalacticPilot, getGalacticLeaderboard, submitGalacticScore } from './galactic-league.js?v=23';
import { ACHIEVEMENTS } from './core/achievements.js?v=23';
import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';
import { escapeHtml } from './core/html.js?v=23';
import { createRouteState } from './core/routes.js?v=23';
import { createAchievementStore } from './services/achievement-store.js?v=23';
import { createEconomyStore } from './services/economy-store.js?v=23';
import { createRankingController } from './services/ranking-controller.js?v=23';
import { cleanPilotName, getPilotName, getPilotSession, loadRememberedPilot, savePilot } from './services/pilot-profile-store.js?v=23';
import { bindNavigation } from './ui/navigation-bindings.js?v=23';
import { renderHangarScreen } from './ui/hangar-screen.js?v=23';
import { renderHomeScreen } from './ui/home-screen.js?v=23';
import { renderRankingScreen } from './ui/ranking-screen.js?v=23';
import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';

const app = document.getElementById('app');
const settingsDialog = document.getElementById('settings-dialog');
const pilotDialog = document.getElementById('pilot-dialog');
const navigation = createRouteState('home');
let flight = null;
const questionDecks = new Map();
let currentQuestion = null;
let toastTimer = 0;
let quizTimer = 0;
let resumeMusicOnVisible = false;
let resumeFlightOnVisible = false;
let flightMode = 'mission';
let achievementTimer = 0;
let ammoRechargeTimer = 0;
let lastLearnedFact = '';
let runAchievements = [];
let currentCheckpointClean = false;
let shopMessage = '';
let stationPurchased = false;
let runCrystals = 0;
let viewportResizeFrame = 0;
let pendingPilotAction = null;

const GAME_RELEASE = new URL(import.meta.url).searchParams.get('v') || 'local';
const RANKING_PREFIX = 'nebula-ranking-';
const SEASON_NAME = 'Expedición Horizonte ' + GAME_RELEASE;
const STATION_OFFERS = {
  repair: { icon: '🛡️', name: 'Reparación total', description: 'Restaura los escudos y suma 20% de combustible.', price: 20 },
  plasma: { icon: '⚡', name: 'Superplasma', description: 'Carga 5 disparos para el siguiente tramo.', price: 25 },
  stabilizer: { icon: '🧭', name: 'Estabilizador', description: 'Hace más lento y tranquilo el próximo tramo.', price: 30 }
};

const economyStore = createEconomyStore({ skins: SHIP_SKINS, trails: SHIP_TRAILS });
const achievementStore = createAchievementStore();
const hangarCatalogs = { skins: SHIP_SKINS, trails: SHIP_TRAILS };
const rankingController = createRankingController({ loadLeaderboard: getGalacticLeaderboard, submitScore: submitGalacticScore });
const loadEconomy = () => economyStore.load();
const saveEconomy = (economy) => economyStore.save(economy);
const loadAchievements = () => achievementStore.load();

function updateCrystalDisplays() {
  const credits = loadEconomy().credits;
  document.querySelectorAll('[data-crystal-balance]').forEach((element) => { element.textContent = String(credits); });
}

function awardCrystals(amount) {
  if (flightMode !== 'mission' || amount <= 0) return 0;
  const economy = loadEconomy();
  economy.credits += amount;
  runCrystals += amount;
  saveEconomy(economy);
  updateCrystalDisplays();
  return amount;
}

function spendCrystals(amount) {
  const economy = loadEconomy();
  if (economy.credits < amount) return false;
  economy.credits -= amount;
  saveEconomy(economy);
  updateCrystalDisplays();
  return true;
}

function unlockAchievement(id) {
  if (flightMode !== 'mission' || !ACHIEVEMENTS[id]) return;
  if (!achievementStore.unlock(id)) return;
  runAchievements.push(id);
  const achievement = ACHIEVEMENTS[id];
  const pop = document.getElementById('achievement-pop');
  if (!pop) return;
  window.clearTimeout(achievementTimer);
  pop.innerHTML = '<span>' + achievement.icon + '</span><div><small>LOGRO DESBLOQUEADO</small><strong>' + achievement.title + '</strong><p>' + achievement.text + '</p></div>';
  pop.hidden = false;
  playTone('achievement');
  achievementTimer = window.setTimeout(() => { pop.hidden = true; }, 3200);
}

function openPilotDialog(action = null) {
  if (!pilotDialog) return;
  pendingPilotAction = action;
  const remembered = loadRememberedPilot();
  const input = document.getElementById('pilot-name');
  input.value = getPilotName();
  document.getElementById('pilot-pin').value = '';
  document.getElementById('remember-pilot').checked = Boolean(remembered);
  document.getElementById('pilot-error').textContent = '';
  if (!pilotDialog.open) pilotDialog.showModal();
  window.setTimeout(() => input.focus(), 30);
}

function requirePilot(action) {
  if (getPilotSession()?.token) action();
  else openPilotDialog(action);
}

function purgePreviousRankings() {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith(RANKING_PREFIX)).forEach((key) => localStorage.removeItem(key));
  } catch (error) { /* El juego continúa aunque el navegador limite el almacenamiento. */ }
}

async function refreshGlobalRanking(force = false) {
  const request = rankingController.refresh({ season: GAME_RELEASE, limit: 10, force });
  if (navigation.get() === 'ranking') render();
  const { ranking } = await request;
  if (navigation.get() === 'ranking') render();
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

function setRoute(next) {
  const transition = navigation.set(next);
  window.clearTimeout(quizTimer);
  window.clearTimeout(toastTimer);
  window.clearTimeout(achievementTimer);
  window.clearTimeout(ammoRechargeTimer);
  stopMusic();
  document.body.classList.remove('flight-screen-locked');
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    const exitResult = exit?.call(document);
    exitResult?.catch?.(() => {});
  }
  flight?.destroy();
  flight = null;
  if (transition.current === 'shop' && transition.previous !== 'shop') shopMessage = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.setTimeout(() => app.focus(), 30);
}

function renderHome() {
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

function renderShop() {
  return renderHangarScreen({
    economy: loadEconomy(),
    skins: SHIP_SKINS,
    trails: SHIP_TRAILS,
    message: shopMessage
  });
}

function renderRanking() {
  return renderRankingScreen({
    snapshot: rankingController.getSnapshot(),
    pilotName: getPilotName(),
    seasonName: SEASON_NAME,
    skins: SHIP_SKINS,
    trails: SHIP_TRAILS
  });
}

function renderFlight() {
  const isTutorial = flightMode === 'tutorial';
  const isPractice = flightMode === 'practice';
  const eyebrow = isTutorial ? 'Entrenamiento guiado' : isPractice ? 'Laboratorio de vuelo' : 'Tu misión';
  const title = isTutorial ? 'Aprende jugando en 30 segundos' : isPractice ? 'Practica sin quedar varado' : 'Esquiva, dispara y responde';
  const warning = isTutorial
    ? 'Te acompañaremos paso a paso. No puedes perder durante el entrenamiento.'
    : isPractice
      ? 'Si te equivocas, verás la respuesta y podrás seguir aprendiendo.'
      : '3 choques, combustible vacío o una respuesta incorrecta terminan la misión.';
  const launch = isTutorial ? '🎮 Iniciar entrenamiento' : isPractice ? '🧪 Empezar práctica' : '🚀 ¡Despegar!';
  const modeBadge = isTutorial ? '🎮 TUTORIAL' : isPractice ? '🧪 PRÁCTICA' : '🚀 MISIÓN';
  const economy = loadEconomy();
  const pilotName = getPilotName() || 'Piloto';
  const stationOffers = Object.entries(STATION_OFFERS).map(([id, offer]) => '<button class="station-offer" type="button" data-station-buy="' + id + '" data-price="' + offer.price + '"><span>' + offer.icon + '</span><strong>' + offer.name + '</strong><small>' + offer.description + '</small><b>💎 ' + offer.price + '</b></button>').join('');
  return `<section class="flight-page" aria-labelledby="flight-title">
    <h1 id="flight-title" class="sr-only">Vuelo de la nave Asteria</h1>
    <div class="flight-hud">
      <div class="hud-block fuel-hud"><span>⛽ Combustible</span><div class="fuel-track"><i id="fuel-fill"></i></div><strong id="fuel-value">62%</strong></div>
      <div class="hud-block hull-hud"><span>🛡️ Escudos</span><strong id="hull-value" aria-label="Tres escudos">♥ ♥ ♥</strong></div>
      <div class="hud-block distance-hud"><span>📍 Distancia</span><strong><b id="distance-value">0</b> km</strong></div>
      <div class="hud-block checkpoint-hud"><span>🌀 Portal <b id="checkpoint-number">1</b></span><strong>A <b id="remaining-value">280</b> km</strong></div>
      <div class="hud-block difficulty-hud"><span>⚡ Dificultad</span><strong>Nivel <b id="level-value">1</b></strong><small id="streak-value" hidden></small></div>
      <div class="hud-block ammo-hud"><span>💥 Plasma</span><strong><b id="ammo-value">3</b> disparos</strong><small id="ammo-recharge-value">Recarga en 5 niveles</small></div>
    </div>
    <div class="flight-stage">
      <canvas id="flight-canvas" tabindex="0" aria-label="Ruta espacial. Usa flecha izquierda y derecha para cambiar de carril, y la barra espaciadora para disparar una de las tres cargas de plasma."></canvas>
      <div class="flight-stage-actions">
        <button class="music-flight" id="music-flight" data-music-label type="button" aria-label="Silenciar música y sonidos" aria-pressed="true"><span>🎵</span><strong>Música</strong></button>
        <button class="fullscreen-flight" id="fullscreen-flight" type="button" aria-label="Activar pantalla completa" aria-pressed="false"><span>⛶</span><strong>Pantalla completa</strong></button>
        <button class="pause-flight" id="pause-flight" type="button" aria-label="Pausar vuelo"><span>⏸</span><strong>Pausa</strong></button>
        <button class="exit-flight" type="button" data-nav="home" aria-label="Salir del vuelo"><span>✕</span><strong>Salir</strong></button>
      </div>
      <div class="sector-badge" id="sector-badge"><span id="sector-mode">${modeBadge}</span><strong id="sector-name">🌌 Nebulosa Violeta</strong><small>👨‍🚀 ${escapeHtml(pilotName)} · 💎 <b data-crystal-balance>${economy.credits}</b></small></div>
      <div id="flight-toast" class="flight-toast" hidden></div>
      <div id="flight-overlay" class="flight-overlay ${isPractice ? 'practice-overlay' : ''}"><div class="overlay-card rules-card"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><div class="quick-rules" role="list"><div role="listitem"><b>1</b><span>↔️</span><strong>MUÉVETE</strong><small>Flechas o botones</small></div><div role="listitem"><b>2</b><span>⚡</span><strong>DISPARA</strong><small>3 cargas · recarga N5</small></div><div role="listitem"><b>3</b><span>🌀</span><strong>LLEGA</strong><small>Entra al portal</small></div><div role="listitem"><b>4</b><span>🧠</span><strong>RESPONDE</strong><small>Acierta y recarga</small></div></div><p class="quick-warning"><span>${isPractice ? '💚' : isTutorial ? '✨' : '⚠️'}</span><strong>${warning}</strong></p><button class="button primary launch-button" id="start-flight">${launch}</button></div></div>
      <div id="tutorial-coach" class="tutorial-coach" hidden aria-live="assertive"></div>
      <div id="achievement-pop" class="achievement-pop" hidden aria-live="polite"></div>
      <section id="pause-panel" class="pause-panel" hidden aria-labelledby="pause-title"><div><span class="pause-icon">⏸</span><p class="eyebrow">Tiempo para respirar</p><h2 id="pause-title">Vuelo en pausa</h2><p>La nave y los obstáculos están congelados.</p><button class="button primary" id="resume-flight">▶ Continuar</button><button class="button ghost" id="restart-from-pause">↻ Reiniciar</button></div></section>
      <section id="station-panel" class="station-panel" hidden aria-labelledby="station-title"><div class="station-card"><div class="station-beacon" aria-hidden="true">🛰️</div><div class="station-heading"><div><p class="eyebrow" id="station-level">Estación cada 10 niveles</p><h2 id="station-title">Estación Nova-10</h2><p>Elige una mejora para continuar tu viaje.</p></div><div class="station-wallet">💎 <strong data-crystal-balance>${economy.credits}</strong></div></div><div class="station-grid">${stationOffers}</div><p id="station-result" class="station-result" role="status">Puedes comprar una ayuda o guardar tus cristales.</p><button class="button primary" id="leave-station">🚀 Continuar misión</button></div></section>
      <section id="quiz-panel" class="quiz-panel" hidden aria-labelledby="quiz-question"><div class="quiz-card"><p class="quiz-category" id="quiz-category"></p><div class="fuel-question-icon" aria-hidden="true">⛽</div><h2 id="quiz-question"></h2><div id="quiz-options" class="quiz-options"></div><p id="quiz-result" class="quiz-result" aria-live="assertive"></p></div></section>
      <div class="mobile-flight-controls" aria-label="Controles móviles"><button id="mobile-steer-left" type="button" aria-label="Mover nave a la izquierda"><span>⬅️</span><strong>IZQUIERDA</strong></button><button class="mobile-fire-control" id="mobile-fire-plasma" data-fire-plasma type="button" aria-label="Disparar plasma. Quedan tres disparos"><span>⚡</span><strong>DISPARAR</strong><small><b id="mobile-ammo-value">3</b> CARGAS</small></button><button id="mobile-steer-right" type="button" aria-label="Mover nave a la derecha"><span>➡️</span><strong>DERECHA</strong></button></div>
    </div>
    <div class="touch-controls" aria-label="Controles táctiles"><button id="steer-left" type="button" aria-label="Mover nave a la izquierda">⬅️<span>IZQUIERDA</span></button><button class="fire-control" id="fire-plasma" data-fire-plasma type="button" aria-label="Disparar plasma. Quedan tres disparos">⚡<span>DISPARAR</span><small>ESPACIO</small></button><button id="steer-right" type="button" aria-label="Mover nave a la derecha"><span>DERECHA</span>➡️</button></div>
    <p class="flight-tip">Toca directamente un carril para moverte · El aro verde marca la salida en oleadas dobles.</p>
  </section>`;
}

function bindShop() {
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

function render() {
  const route = navigation.get();
  const screens = { home: renderHome, flight: renderFlight, shop: renderShop, ranking: renderRanking, instructions: renderInstructions, teacher: renderTeacher, credits: renderCredits };
  document.body.classList.toggle('flight-route', route === 'flight');
  app.innerHTML = (screens[route] || renderHome)();
  bindNavigation(app, {
    navigate: setRoute,
    setMode: (mode) => { flightMode = mode; },
    guardFlight: true,
    requireFlightAccess: requirePilot
  });
  app.querySelectorAll('[data-change-pilot]').forEach((button) => button.addEventListener('click', () => openPilotDialog(() => render())));
  app.querySelectorAll('[data-refresh-ranking]').forEach((button) => button.addEventListener('click', () => refreshGlobalRanking(true)));
  if (route === 'flight') bindFlight();
  if (route === 'shop') bindShop();
  if (route === 'ranking' && rankingController.getSnapshot().status === 'idle') window.setTimeout(() => refreshGlobalRanking(), 0);
  applySettings();
}

function showToast(message, tone = 'normal') {
  const toast = document.getElementById('flight-toast');
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = 'flight-toast ' + tone;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1500);
}

function updateHud(state) {
  const fuelFill = document.getElementById('fuel-fill');
  if (!fuelFill) return;
  fuelFill.style.width = state.fuel + '%';
  fuelFill.classList.toggle('low', state.fuel < 25);
  document.querySelector('.fuel-hud')?.classList.toggle('critical', state.fuel < 25);
  document.getElementById('fuel-value').textContent = state.fuel + '%';
  document.getElementById('hull-value').textContent = Array.from({ length: 3 }, (_, index) => index < state.hull ? '♥' : '♡').join(' ');
  document.getElementById('hull-value').setAttribute('aria-label', state.hull + ' escudos disponibles');
  document.getElementById('distance-value').textContent = state.distance;
  document.getElementById('checkpoint-number').textContent = state.checkpoint;
  document.getElementById('remaining-value').textContent = state.remaining;
  document.getElementById('level-value').textContent = state.level;
  const ammoValue = document.getElementById('ammo-value');
  if (ammoValue) ammoValue.textContent = state.ammo;
  document.querySelectorAll('[data-fire-plasma]').forEach((fireButton) => {
    fireButton.classList.toggle('empty', state.ammo <= 0);
    fireButton.setAttribute('aria-label', state.ammo > 0 ? 'Disparar plasma. Quedan ' + state.ammo + ' disparos' : 'Sin cargas de plasma. Recarga en ' + state.levelsUntilAmmo + (state.levelsUntilAmmo === 1 ? ' nivel' : ' niveles'));
  });
  const mobileAmmo = document.getElementById('mobile-ammo-value');
  if (mobileAmmo) mobileAmmo.textContent = state.ammo;
  const reloadValue = document.getElementById('ammo-recharge-value');
  if (reloadValue) reloadValue.textContent = 'Recarga en ' + state.levelsUntilAmmo + (state.levelsUntilAmmo === 1 ? ' nivel' : ' niveles');
  const streakValue = document.getElementById('streak-value');
  if (streakValue) {
    streakValue.hidden = state.streak < 2;
    streakValue.textContent = state.streak >= 2 ? '🔥 Racha ×' + state.streak : '';
  }
  document.querySelector('.ammo-hud')?.classList.toggle('empty', state.ammo <= 0);
  document.querySelector('.flight-page')?.style.setProperty('--danger-level', Math.min(1, (state.level - 1) / 8));
  const sectorBadge = document.getElementById('sector-badge');
  if (sectorBadge) {
    const modeLabel = state.practice ? '🧪 PRÁCTICA' : flightMode === 'tutorial' ? '🎮 TUTORIAL' : '🚀 MISIÓN';
    document.getElementById('sector-mode').textContent = modeLabel;
    document.getElementById('sector-name').textContent = state.sector.icon + ' ' + state.sector.name;
  }
  if (state.distance >= 1000) unlockAchievement('explorer');
}

function clearTutorialTargets() {
  document.querySelectorAll('.tutorial-target').forEach((element) => element.classList.remove('tutorial-target'));
}

function showTutorialCoach(icon, title, detail) {
  const coach = document.getElementById('tutorial-coach');
  if (!coach) return;
  coach.innerHTML = '<span>' + icon + '</span><div><strong>' + title + '</strong><small>' + detail + '</small></div>';
  coach.hidden = false;
}

function handleTutorialStep({ step }) {
  clearTutorialTargets();
  if (step === 'left') {
    showTutorialCoach('👈', 'Muévete a la izquierda', 'Pulsa el botón IZQUIERDA o la flecha ←');
    document.querySelectorAll('#steer-left, #mobile-steer-left').forEach((element) => element.classList.add('tutorial-target'));
  } else if (step === 'right') {
    showTutorialCoach('👉', '¡Muy bien! Ahora a la derecha', 'Pulsa DERECHA o la flecha →');
    document.querySelectorAll('#steer-right, #mobile-steer-right').forEach((element) => element.classList.add('tutorial-target'));
  } else if (step === 'fire') {
    showTutorialCoach('⚡', 'Destruye el meteorito', 'Pulsa ESPACIO o el botón DISPARAR');
    document.querySelectorAll('[data-fire-plasma]').forEach((element) => element.classList.add('tutorial-target'));
  } else if (step === 'question') {
    showTutorialCoach('🧠', 'Último paso: responde', 'Elige el planeta donde vivimos');
    quizTimer = window.setTimeout(showTutorialQuestion, 650);
  }
}

function showTutorialQuestion() {
  currentQuestion = {
    icon: '🌎', category: 'Nuestro planeta', level: 1,
    text: '¿En qué planeta vivimos?',
    options: ['Marte', 'La Tierra', 'Júpiter'], answer: 1,
    fact: 'Vivimos en la Tierra, el tercer planeta del sistema solar.'
  };
  const panel = document.getElementById('quiz-panel');
  if (!panel) return;
  const coach = document.getElementById('tutorial-coach');
  if (coach) coach.hidden = true;
  panel.dataset.answered = 'false';
  document.getElementById('quiz-category').textContent = '🌎 PREGUNTA DE ENTRENAMIENTO';
  document.getElementById('quiz-question').textContent = currentQuestion.text;
  document.getElementById('quiz-result').textContent = '';
  const options = document.getElementById('quiz-options');
  options.innerHTML = currentQuestion.options.map((option, index) => '<button type="button" data-answer="' + index + '"><span>' + String.fromCharCode(65 + index) + '</span>' + option + '</button>').join('');
  options.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => answerTutorialQuestion(Number(button.dataset.answer))));
  panel.hidden = false;
  options.querySelector('button')?.focus();
  playTone('complete');
}

function answerTutorialQuestion(selectedIndex) {
  const panel = document.getElementById('quiz-panel');
  if (!panel || panel.dataset.answered === 'true') return;
  const buttons = [...panel.querySelectorAll('[data-answer]')];
  if (selectedIndex !== currentQuestion.answer) {
    buttons[selectedIndex].classList.add('wrong');
    document.getElementById('quiz-result').textContent = '💡 Casi. Mira las opciones y prueba otra vez.';
    playTone('alert');
    buttons[selectedIndex].disabled = true;
    return;
  }
  panel.dataset.answered = 'true';
  buttons.forEach((button) => { button.disabled = true; });
  buttons[currentQuestion.answer].classList.add('correct');
  document.getElementById('quiz-result').textContent = '🌟 ¡Exacto! La Tierra es nuestro hogar.';
  lastLearnedFact = currentQuestion.fact;
  localStorage.setItem('nebula-tutorial-complete', 'true');
  playTone('achievement');
  quizTimer = window.setTimeout(() => {
    panel.hidden = true;
    flight.finishTutorial();
  }, 900);
}

function completeTutorial() {
  clearTutorialTargets();
  showTutorialCoach('🏅', '¡Entrenamiento completado!', 'Ya sabes pilotar. Comienza tu primera misión.');
  playTone('achievement');
  quizTimer = window.setTimeout(() => {
    flightMode = 'mission';
    document.getElementById('tutorial-coach').hidden = true;
    startFlightSession();
    showToast('🚀 MISIÓN REAL · ¡TÚ PUEDES!', 'success');
  }, 1700);
}

function startFlightSession() {
  window.clearTimeout(quizTimer);
  const overlay = document.getElementById('flight-overlay');
  const pausePanel = document.getElementById('pause-panel');
  const quizPanel = document.getElementById('quiz-panel');
  const stationPanel = document.getElementById('station-panel');
  document.querySelector('.flight-page')?.classList.remove('is-paused');
  if (overlay) overlay.hidden = true;
  if (pausePanel) pausePanel.hidden = true;
  if (stationPanel) stationPanel.hidden = true;
  if (quizPanel) {
    quizPanel.hidden = true;
    quizPanel.dataset.answered = 'false';
  }
  const achievementPop = document.getElementById('achievement-pop');
  if (achievementPop) achievementPop.hidden = true;
  const pauseButton = document.getElementById('pause-flight');
  if (pauseButton) {
    pauseButton.innerHTML = '<span>⏸</span><strong>Pausa</strong>';
    pauseButton.setAttribute('aria-label', 'Pausar vuelo');
  }
  runAchievements = [];
  runCrystals = 0;
  stationPurchased = false;
  lastLearnedFact = '';
  const economy = loadEconomy();
  flight.start({ practice: flightMode === 'practice', tutorial: flightMode === 'tutorial', skin: economy.activeSkin, trail: economy.activeTrail });
  startMusic(1);
  playTone('complete');
  const message = flightMode === 'practice' ? '🧪 PRÁCTICA ACTIVA · AQUÍ APRENDEMOS' : flightMode === 'tutorial' ? '🎮 SIGUE A NOVA, TU GUÍA' : '🎵 MÚSICA ESPACIAL ACTIVADA';
  showToast(getSettings().sound ? message : '🔇 Música apagada · toca MÚSICA para activarla', getSettings().sound ? 'success' : 'normal');
  document.getElementById('flight-canvas')?.focus();
}

function refreshStationButtons() {
  const credits = loadEconomy().credits;
  document.querySelectorAll('[data-station-buy]').forEach((button) => {
    const price = Number(button.dataset.price);
    button.disabled = stationPurchased || credits < price;
    button.classList.toggle('unaffordable', !stationPurchased && credits < price);
  });
}

function showStation(progress) {
  const panel = document.getElementById('station-panel');
  if (!panel) return;
  stationPurchased = false;
  flight.enterStation();
  document.getElementById('station-level').textContent = '✨ NIVEL ' + progress.completedLevel + ' SUPERADO';
  document.getElementById('station-title').textContent = 'Estación Nova-' + progress.completedLevel;
  document.getElementById('station-result').textContent = 'Ganaste acceso a la estación. Elige una ayuda o guarda tus cristales.';
  updateCrystalDisplays();
  refreshStationButtons();
  panel.hidden = false;
  playTone('achievement');
  announce('Llegaste a la Estación Nova. Puedes elegir una mejora o continuar la misión.');
  panel.querySelector('button:not([disabled])')?.focus();
}

function buyStationItem(id) {
  if (stationPurchased || !STATION_OFFERS[id] || flight?.mode !== 'station') return;
  const offer = STATION_OFFERS[id];
  if (!spendCrystals(offer.price)) {
    document.getElementById('station-result').textContent = 'Necesitas más cristales para comprar esa mejora.';
    playTone('empty');
    refreshStationButtons();
    return;
  }
  if (!flight.applyStationPurchase(id)) return;
  stationPurchased = true;
  refreshStationButtons();
  document.getElementById('station-result').textContent = '✅ ' + offer.name + ' instalada. ¡La Asteria está lista!';
  playTone('core');
}

function leaveStation() {
  const panel = document.getElementById('station-panel');
  if (!panel || flight?.mode !== 'station') return;
  panel.hidden = true;
  flight.leaveStation();
  showToast(stationPurchased ? '🛰️ MEJORA INSTALADA · ¡SIGUE LA MISIÓN!' : '💎 CRISTALES GUARDADOS · ¡SIGUE LA MISIÓN!', 'success');
  document.getElementById('flight-canvas')?.focus();
}

function togglePause(forceResume = false) {
  if (!flight || ['idle', 'gameover', 'quiz'].includes(flight.mode)) return;
  if (!document.getElementById('station-panel')?.hidden) return;
  const panel = document.getElementById('pause-panel');
  const button = document.getElementById('pause-flight');
  const shouldResume = forceResume || !panel?.hidden;
  if (shouldResume) {
    document.querySelector('.flight-page')?.classList.remove('is-paused');
    panel.hidden = true;
    flight.resume();
    startMusic(flight.checkpoints + 1);
    button.innerHTML = '<span>⏸</span><strong>Pausa</strong>';
    button.setAttribute('aria-label', 'Pausar vuelo');
  } else {
    document.querySelector('.flight-page')?.classList.add('is-paused');
    flight.pause();
    stopMusic();
    panel.hidden = false;
    button.innerHTML = '<span>▶</span><strong>Continuar</strong>';
    button.setAttribute('aria-label', 'Continuar vuelo');
    document.getElementById('resume-flight')?.focus();
  }
}

function nextQuestion(portalNumber) {
  const level = levelForPortal(portalNumber);
  let deck = questionDecks.get(level);
  if (!deck?.length) {
    deck = shuffledQuestions(level);
    questionDecks.set(level, deck);
  }
  currentQuestion = shuffledQuestionOptions(deck.pop());
  return currentQuestion;
}

function showQuiz(meta) {
  const question = nextQuestion(meta.number);
  currentCheckpointClean = Boolean(meta.clean && meta.number > 1);
  const panel = document.getElementById('quiz-panel');
  panel.dataset.answered = 'false';
  document.getElementById('quiz-category').textContent = question.icon + ' ' + question.category + ' · Pregunta nivel ' + question.level;
  document.getElementById('quiz-question').textContent = question.text;
  document.getElementById('quiz-result').textContent = '';
  const options = document.getElementById('quiz-options');
  options.innerHTML = question.options.map((option, index) => '<button type="button" data-answer="' + index + '"><span>' + String.fromCharCode(65 + index) + '</span>' + escapeHtml(option) + '</button>').join('');
  options.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => answerQuestion(Number(button.dataset.answer))));
  panel.hidden = false;
  options.querySelector('button')?.focus();
  playTone('complete');
  announce('Puesto de recarga. Responde la pregunta para continuar.');
}

function answerQuestion(selectedIndex) {
  const panel = document.getElementById('quiz-panel');
  if (!panel || panel.dataset.answered === 'true') return;
  panel.dataset.answered = 'true';
  const buttons = [...panel.querySelectorAll('[data-answer]')];
  buttons.forEach((button) => { button.disabled = true; });
  buttons[currentQuestion.answer].classList.add('correct');
  lastLearnedFact = currentQuestion.fact;
  if (selectedIndex === currentQuestion.answer) {
    document.getElementById('quiz-result').textContent = '✅ ¡Correcto! Combustible recargado.';
    playTone('core');
    quizTimer = window.setTimeout(() => {
      panel.hidden = true;
      panel.dataset.answered = 'false';
      const progress = flight.answerCorrect();
      const earnedCrystals = awardCrystals(12);
      if (flight.totalCorrect >= 1) unlockAchievement('first_portal');
      if (currentCheckpointClean) unlockAchievement('clean_pilot');
      if (flight.bestStreak >= 3) unlockAchievement('streak_three');
      if (progress?.stationReached) {
        showStation(progress);
        return;
      } else if (progress?.ammoRecharged) {
        showToast('⚡ NIVEL ' + progress.completedLevel + ' · PLASMA RECARGADO · +' + earnedCrystals + ' 💎', 'plasma');
      } else if (progress?.sectorChanged) {
        showToast(progress.sector.icon + ' NUEVO SECTOR · ' + progress.sector.name.toUpperCase() + ' · +' + earnedCrystals + ' 💎', 'success');
      } else {
        showToast('⛽ +38% · NIVEL ' + (flight.checkpoints + 1) + ' · +' + earnedCrystals + ' 💎', 'success');
      }
      document.getElementById('flight-canvas')?.focus();
    }, 1050);
  } else {
    buttons[selectedIndex].classList.add('wrong');
    document.getElementById('quiz-result').textContent = (flightMode === 'practice' ? '💡 Aprendimos: ' : '❌ ') + currentQuestion.fact;
    playTone('alert');
    quizTimer = window.setTimeout(() => {
      panel.hidden = true;
      panel.dataset.answered = 'false';
      if (flightMode === 'practice') {
        const progress = flight.answerPracticeMistake();
        if (progress?.ammoRecharged) {
          showToast('⚡ PRÁCTICA NIVEL ' + progress.completedLevel + ' · PLASMA RECARGADO', 'plasma');
        } else if (progress?.sectorChanged) {
          showToast(progress.sector.icon + ' PRÁCTICA EN ' + progress.sector.name.toUpperCase(), 'success');
        } else {
          showToast('🧪 SEGUIMOS PRACTICANDO · +24% COMBUSTIBLE', 'success');
        }
        document.getElementById('flight-canvas')?.focus();
      } else {
        flight.strand('La respuesta no fue correcta. ' + currentQuestion.fact);
      }
    }, flightMode === 'practice' ? 2100 : 1700);
  }
}

function showGameOver(result) {
  stopMusic();
  const rankingPromise = recordRanking(result);
  const pilotName = getPilotName() || 'Piloto';
  const best = Math.max(result.distance, Number(localStorage.getItem('nebula-flight-best') || 0));
  localStorage.setItem('nebula-flight-best', String(best));
  const overlay = document.getElementById('flight-overlay');
  const fact = lastLearnedFact ? '<div class="learned-fact"><span>💡</span><p><small>HOY APRENDISTE</small><strong>' + escapeHtml(lastLearnedFact) + '</strong></p></div>' : '';
  const achievementNote = runAchievements.length ? '<p class="run-achievements">🏅 Desbloqueaste ' + runAchievements.length + (runAchievements.length === 1 ? ' logro nuevo' : ' logros nuevos') + '</p>' : '';
  const rankingNote = flightMode === 'mission' ? '<p class="ranking-result syncing" id="ranking-result">🛰️ Enviando tu mejor vuelo a la Liga Galáctica…</p>' : '';
  overlay.innerHTML = '<div class="overlay-card stranded-card"><div class="stranded-icon" aria-hidden="true">🛰️</div><p class="eyebrow">Bitácora de ' + escapeHtml(pilotName) + '</p><h2>¡Gran intento, piloto!</h2><p>' + escapeHtml(result.reason) + '</p><div class="flight-summary"><span><b>' + result.distance + '</b> km<small>Distancia</small></span><span><b>' + result.correct + '</b><small>Respuestas</small></span><span><b>' + result.bestStreak + '</b><small>Mejor racha</small></span><span><b>' + result.destroyed + '</b><small>Destruidos</small></span><span><b>' + result.checkpoints + '</b><small>Portales</small></span><span><b>' + best + '</b> km<small>Récord</small></span><span><b>+' + runCrystals + ' 💎</b><small>Cristales ganados</small></span></div>' + rankingNote + fact + achievementNote + '<div class="summary-actions"><button class="button primary launch-button" id="restart-flight">🚀 Intentar otra vez</button><button class="button ranking-button" id="ranking-after-game">🏆 Clasificación</button><button class="button ghost" id="shop-after-game">🛸 Hangar</button><button class="button ghost" id="practice-after-game">🧪 Practicar</button><button class="button text-button" data-nav="home">Salir</button></div></div>';
  overlay.hidden = false;
  overlay.querySelector('#restart-flight').addEventListener('click', () => {
    flightMode = 'mission';
    startFlightSession();
  });
  overlay.querySelector('#practice-after-game').addEventListener('click', () => {
    flightMode = 'practice';
    startFlightSession();
  });
  overlay.querySelector('#shop-after-game').addEventListener('click', () => setRoute('shop'));
  overlay.querySelector('#ranking-after-game').addEventListener('click', () => setRoute('ranking'));
  overlay.querySelector('[data-nav]').addEventListener('click', () => setRoute('home'));
  rankingPromise.then(({ position, error, updated }) => {
    const note = document.getElementById('ranking-result');
    if (!note) return;
    note.classList.remove('syncing');
    if (error) {
      note.classList.add('sync-error');
      note.textContent = '📡 Tu vuelo quedó en la nave, pero no pudo enviarse: ' + error;
    } else if (position) {
      note.innerHTML = (updated ? '🏆 ' : '✨ ') + escapeHtml(pilotName) + ', tu mejor marca ocupa el puesto <strong>#' + position + '</strong> de la Liga Galáctica mundial.';
    } else {
      note.textContent = '✨ Vuelo sincronizado con la Liga Galáctica.';
    }
  });
  announce('Misión terminada. Revisa tu bitácora y vuelve a intentarlo cuando quieras.');
}

function syncFlightViewport() {
  window.cancelAnimationFrame(viewportResizeFrame);
  viewportResizeFrame = window.requestAnimationFrame(() => {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight);
    const width = Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--flight-viewport-height', height + 'px');
    document.documentElement.style.setProperty('--flight-viewport-width', width + 'px');
    if (navigation.get() === 'flight') flight?.resize();
  });
}

function setImmersiveLayout(enabled) {
  const page = document.querySelector('.flight-page');
  if (!page) return;
  page.classList.toggle('pseudo-fullscreen', enabled);
  document.body.classList.toggle('flight-screen-locked', enabled);
  if (enabled) window.scrollTo(0, 0);
  syncFlightViewport();
}

function updateFullscreenButton() {
  const page = document.querySelector('.flight-page');
  const button = document.getElementById('fullscreen-flight');
  if (!page || !button) return;
  const expanded = Boolean(document.fullscreenElement || document.webkitFullscreenElement || page.classList.contains('pseudo-fullscreen'));
  button.setAttribute('aria-pressed', String(expanded));
  button.setAttribute('aria-label', expanded ? 'Salir de pantalla completa' : 'Activar pantalla completa');
  button.innerHTML = expanded ? '<span>⤢</span><strong>Salir de pantalla completa</strong>' : '<span>⛶</span><strong>Pantalla completa</strong>';
  window.setTimeout(() => flight?.resize(), 80);
}

async function toggleFullscreen() {
  const page = document.querySelector('.flight-page');
  if (!page) return;
  const activeElement = document.fullscreenElement || document.webkitFullscreenElement;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  const request = page.requestFullscreen || page.webkitRequestFullscreen;
  const expanded = Boolean(activeElement || page.classList.contains('pseudo-fullscreen'));
  if (expanded) {
    setImmersiveLayout(false);
    if (activeElement && exit) {
      try { await exit.call(document); } catch (error) { /* El modo CSS ya se cerró. */ }
    }
  } else {
    // El respaldo CSS se activa primero: así funciona incluso cuando iOS o el
    // navegador integrado no permiten fullscreen sobre elementos HTML.
    setImmersiveLayout(true);
    if (request) {
      try { await request.call(page, { navigationUI: 'hide' }); } catch (error) { /* Se conserva el modo inmersivo CSS. */ }
    }
  }
  updateFullscreenButton();
}

function bindFlight() {
  const canvas = document.getElementById('flight-canvas');
  flight = new SpaceFlight(canvas, {
    onHud: updateHud,
    onCheckpoint: showQuiz,
    onCollision: ({ name, hull }) => {
      showToast('💥 Chocaste con ' + name + ' · quedan ' + hull + ' escudos', 'danger');
      playTone('alert');
    },
    onGameOver: showGameOver,
    onLevelUp: ({ level }) => setMusicIntensity(level),
    onSteer: () => playTone('select'),
    onFire: ({ ammo }) => {
      playTone('laser');
      showToast('⚡ DISPARO DE PLASMA · QUEDAN ' + ammo, 'plasma');
    },
    onDestroy: ({ name }) => {
      playTone('blast');
      const earnedCrystals = awardCrystals(3);
      showToast('💥 ' + name + ' DESTRUIDO' + (earnedCrystals ? ' · +' + earnedCrystals + ' 💎' : ''), 'destroy');
      if (flight.destroyed >= 3) unlockAchievement('sharpshooter');
    },
    onEmptyFire: () => {
      playTone('empty');
      const remaining = 5 - (flight.checkpoints % 5);
      showToast('⚠️ SIN PLASMA · RECARGA EN ' + remaining + (remaining === 1 ? ' NIVEL' : ' NIVELES') + ' · ¡ESQUIVA!', 'danger');
    },
    onSectorChange: (sector) => {
      playTone('achievement');
      const badge = document.getElementById('sector-badge');
      badge?.classList.add('sector-arrival');
      window.setTimeout(() => badge?.classList.remove('sector-arrival'), 1800);
    },
    onAmmoRecharge: () => {
      playTone('achievement');
      const ammoHud = document.querySelector('.ammo-hud');
      window.clearTimeout(ammoRechargeTimer);
      ammoHud?.classList.add('recharged');
      ammoRechargeTimer = window.setTimeout(() => ammoHud?.classList.remove('recharged'), 2200);
    },
    onPracticeRescue: ({ reason }) => {
      playTone('complete');
      showToast(reason === 'fuel' ? '🧪 RECARGA DE PRÁCTICA · SIGUE VOLANDO' : '🧪 NAVE REPARADA · SIGUE INTENTANDO', 'success');
    },
    onTutorialStep: handleTutorialStep,
    onTutorialComplete: completeTutorial
  });
  document.getElementById('start-flight').addEventListener('click', startFlightSession);
  document.getElementById('steer-left').addEventListener('click', () => flight.moveLane(-1));
  document.getElementById('steer-right').addEventListener('click', () => flight.moveLane(1));
  document.getElementById('mobile-steer-left').addEventListener('click', () => flight.moveLane(-1));
  document.getElementById('mobile-steer-right').addEventListener('click', () => flight.moveLane(1));
  document.querySelectorAll('[data-fire-plasma]').forEach((button) => button.addEventListener('click', () => flight.fire()));
  document.getElementById('music-flight').addEventListener('click', () => {
    const enabled = !getSettings().sound;
    applySettings({ sound: enabled });
    if (enabled) playTone('complete');
    showToast(enabled ? '🎵 MÚSICA ACTIVADA' : '🔇 MÚSICA SILENCIADA', enabled ? 'success' : 'normal');
  });
  document.getElementById('fullscreen-flight').addEventListener('click', toggleFullscreen);
  document.getElementById('pause-flight').addEventListener('click', () => togglePause());
  document.getElementById('resume-flight').addEventListener('click', () => togglePause(true));
  document.getElementById('restart-from-pause').addEventListener('click', startFlightSession);
  document.querySelectorAll('[data-station-buy]').forEach((button) => button.addEventListener('click', () => buyStationItem(button.dataset.stationBuy)));
  document.getElementById('leave-station').addEventListener('click', leaveStation);
  applySettings();
  syncFlightViewport();
}

bindNavigation(document.querySelector('.site-header'), { navigate: setRoute, preventDefault: true });
document.getElementById('pilot-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('pilot-name');
  const pinInput = document.getElementById('pilot-pin');
  const submitButton = event.currentTarget.querySelector('[type="submit"]');
  const errorElement = document.getElementById('pilot-error');
  const name = cleanPilotName(input.value);
  if (name.length < 2) {
    errorElement.textContent = 'Escribe un apodo de al menos 2 caracteres.';
    input.focus();
    return;
  }
  const pin = pinInput.value;
  if (pin && (pin.length < 4 || pin.length > 8)) {
    errorElement.textContent = 'La contraseña debe tener entre 4 y 8 caracteres.';
    pinInput.focus();
    return;
  }
  errorElement.textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = '🛰️ Conectando…';
  try {
    const current = getPilotSession();
    const samePilot = current?.token && current.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es');
    const profile = samePilot ? { ...current, nickname: current.name } : await claimGalacticPilot(name, pin);
    savePilot(profile, document.getElementById('remember-pilot').checked);
    pilotDialog.close();
    playTone('achievement');
    const action = pendingPilotAction;
    pendingPilotAction = null;
    rankingController.invalidate();
    if (action) action();
    else render();
  } catch (error) {
    errorElement.textContent = error.message;
    if (error.code === 'pin_required' || error.code === 'pin_invalid') pinInput.focus();
    else input.focus();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = '🚀 Entrar a la nave';
  }
});
pilotDialog?.addEventListener('cancel', (event) => {
  if (!getPilotSession()?.token) event.preventDefault();
  else pendingPilotAction = null;
});
document.getElementById('toggle-pilot-pin')?.addEventListener('click', (event) => {
  const input = document.getElementById('pilot-pin');
  const visible = input.type === 'text';
  input.type = visible ? 'password' : 'text';
  event.currentTarget.textContent = visible ? '👁️' : '🙈';
  event.currentTarget.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
  input.focus();
});
document.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', () => {
  settingsDialog.dataset.resumeMusic = ['running', 'quiz', 'station'].includes(flight?.mode) ? 'true' : 'false';
  settingsDialog.dataset.resumeFlight = flight?.mode === 'running' ? 'true' : 'false';
  flight?.pause();
  stopMusic();
  settingsDialog.showModal();
}));
settingsDialog.addEventListener('close', () => {
  if (settingsDialog.dataset.resumeMusic === 'true' && flight && flight.mode !== 'gameover') startMusic(flight.checkpoints + 1);
  if (settingsDialog.dataset.resumeFlight === 'true') flight?.resume();
});
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
window.addEventListener('resize', syncFlightViewport, { passive: true });
window.addEventListener('orientationchange', () => window.setTimeout(syncFlightViewport, 120), { passive: true });
window.visualViewport?.addEventListener('resize', syncFlightViewport, { passive: true });
window.visualViewport?.addEventListener('scroll', syncFlightViewport, { passive: true });
document.addEventListener('keydown', (event) => {
  const page = document.querySelector('.flight-page.pseudo-fullscreen');
  if (event.key === 'Escape' && page) {
    page.classList.remove('pseudo-fullscreen');
    document.body.classList.remove('flight-screen-locked');
    updateFullscreenButton();
  } else if ((event.key === 'p' || event.key === 'P') && flight && navigation.get() === 'flight') {
    event.preventDefault();
    togglePause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resumeMusicOnVisible = ['running', 'quiz', 'station'].includes(flight?.mode);
    resumeFlightOnVisible = flight?.mode === 'running';
    flight?.pause();
    stopMusic();
  } else {
    if (resumeMusicOnVisible && flight && flight.mode !== 'gameover') startMusic(flight.checkpoints + 1);
    if (resumeFlightOnVisible) flight?.resume();
    resumeMusicOnVisible = false;
    resumeFlightOnVisible = false;
  }
});
bindSettings(document);
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('El modo sin conexión no pudo activarse.', error));
}
purgePreviousRankings();
render();
if (!getPilotSession()?.token) window.setTimeout(() => { if (!getPilotSession()?.token && !pilotDialog?.open) openPilotDialog(); }, 180);
