import { SpaceFlight } from './space-game.js?v=17';
import { shuffledQuestions, levelForPortal, shuffledQuestionOptions } from './questions.js';
import { bindSettings, applySettings, getSettings, announce, playTone, startMusic, setMusicIntensity, stopMusic } from './accessibility.js?v=17';

const app = document.getElementById('app');
const settingsDialog = document.getElementById('settings-dialog');
let route = 'home';
let flight = null;
const questionDecks = new Map();
let currentQuestion = null;
let toastTimer = 0;
let quizTimer = 0;
let resumeMusicOnVisible = false;
let resumeFlightOnVisible = false;
let flightMode = 'mission';
let achievementTimer = 0;
let lastLearnedFact = '';
let runAchievements = [];
let currentCheckpointClean = false;

const ACHIEVEMENTS = {
  first_portal: { icon: '🌀', title: 'Primer portal', text: 'Superaste tu primera recarga.' },
  clean_pilot: { icon: '🛡️', title: 'Vuelo impecable', text: 'Llegaste a un portal sin chocar.' },
  streak_three: { icon: '🧠', title: 'Mente estelar', text: 'Lograste tres respuestas seguidas.' },
  sharpshooter: { icon: '⚡', title: 'Puntería galáctica', text: 'Usaste las tres cargas con éxito.' },
  explorer: { icon: '🏆', title: 'Explorador cósmico', text: 'Recorriste 1.000 kilómetros.' }
};

function loadAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem('nebula-achievements') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function unlockAchievement(id) {
  if (flightMode !== 'mission' || !ACHIEVEMENTS[id]) return;
  const unlocked = loadAchievements();
  if (unlocked.includes(id)) return;
  unlocked.push(id);
  localStorage.setItem('nebula-achievements', JSON.stringify(unlocked));
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function setRoute(next) {
  window.clearTimeout(quizTimer);
  window.clearTimeout(toastTimer);
  window.clearTimeout(achievementTimer);
  stopMusic();
  document.body.classList.remove('flight-screen-locked');
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    const exitResult = exit?.call(document);
    exitResult?.catch?.(() => {});
  }
  flight?.destroy();
  flight = null;
  route = next;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.setTimeout(() => app.focus(), 30);
}

function renderHome() {
  const best = Number(localStorage.getItem('nebula-flight-best') || 0);
  const unlocked = loadAchievements();
  const achievementShelf = Object.entries(ACHIEVEMENTS).map(([id, achievement]) => '<span class="' + (unlocked.includes(id) ? 'unlocked' : 'locked') + '" title="' + escapeHtml(achievement.title) + '"><b>' + (unlocked.includes(id) ? achievement.icon : '✦') + '</b><small>' + escapeHtml(achievement.title) + '</small></span>').join('');
  const learned = localStorage.getItem('nebula-tutorial-complete') === 'true';
  return '<section class="screen flight-home" aria-labelledby="home-title"><div class="flight-home-copy"><p class="eyebrow">🚀 Aventura educativa 2.5D</p><h1 id="home-title">Pilota la <span>Asteria</span></h1><p class="lead">Esquiva, dispara y supera desafíos de conocimiento en cinco sectores galácticos.</p><div class="mission-formula"><span><b>🕹️</b><small>Esquiva</small></span><i>→</i><span><b>🌀</b><small>Llega</small></span><i>→</i><span><b>🧠</b><small>Responde</small></span><i>→</i><span><b>✨</b><small>Celebra</small></span></div><div class="home-actions"><button class="button primary launch-button" data-nav="flight" data-mode="mission">🚀 Jugar misión</button><button class="button tutorial-button" data-nav="flight" data-mode="tutorial">🎮 ' + (learned ? 'Repetir tutorial' : 'Tutorial de 30 s') + '</button><button class="button ghost" data-nav="flight" data-mode="practice">🧪 Modo práctica</button><button class="button text-button" data-nav="instructions">Ver reglas</button></div><div class="home-records">' + (best ? '<span>🏆 <strong>' + best + '</strong> km</span>' : '<span>🏆 Sin récord aún</span>') + '<span>🏅 <strong>' + unlocked.length + '</strong>/5 logros</span></div><div class="achievement-shelf" aria-label="Logros de la misión">' + achievementShelf + '</div></div><div class="home-orbit" aria-hidden="true"><div class="orbit-planet"></div><div class="orbit-ship">▲<i></i></div><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span></div></section>';
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
  return `<section class="flight-page" aria-labelledby="flight-title">
    <h1 id="flight-title" class="sr-only">Vuelo de la nave Asteria</h1>
    <div class="flight-hud">
      <div class="hud-block fuel-hud"><span>⛽ Combustible</span><div class="fuel-track"><i id="fuel-fill"></i></div><strong id="fuel-value">62%</strong></div>
      <div class="hud-block hull-hud"><span>🛡️ Escudos</span><strong id="hull-value" aria-label="Tres escudos">♥ ♥ ♥</strong></div>
      <div class="hud-block distance-hud"><span>📍 Distancia</span><strong><b id="distance-value">0</b> km</strong></div>
      <div class="hud-block checkpoint-hud"><span>🌀 Portal <b id="checkpoint-number">1</b></span><strong>A <b id="remaining-value">280</b> km</strong></div>
      <div class="hud-block difficulty-hud"><span>⚡ Dificultad</span><strong>Nivel <b id="level-value">1</b></strong></div>
      <div class="hud-block ammo-hud"><span>💥 Plasma</span><strong><b id="ammo-value">3</b> disparos</strong></div>
    </div>
    <div class="flight-stage">
      <canvas id="flight-canvas" tabindex="0" aria-label="Ruta espacial. Usa flecha izquierda y derecha para cambiar de carril, y la barra espaciadora para disparar una de las tres cargas de plasma."></canvas>
      <div class="flight-stage-actions">
        <button class="music-flight" id="music-flight" data-music-label type="button" aria-label="Silenciar música y sonidos" aria-pressed="true"><span>🎵</span><strong>Música</strong></button>
        <button class="fullscreen-flight" id="fullscreen-flight" type="button" aria-label="Activar pantalla completa" aria-pressed="false"><span>⛶</span><strong>Pantalla completa</strong></button>
        <button class="pause-flight" id="pause-flight" type="button" aria-label="Pausar vuelo"><span>⏸</span><strong>Pausa</strong></button>
        <button class="exit-flight" type="button" data-nav="home" aria-label="Salir del vuelo"><span>✕</span><strong>Salir</strong></button>
      </div>
      <div class="sector-badge" id="sector-badge"><span>${modeBadge}</span><strong>🌌 Nebulosa Violeta</strong></div>
      <div id="flight-toast" class="flight-toast" hidden></div>
      <div id="flight-overlay" class="flight-overlay ${isPractice ? 'practice-overlay' : ''}"><div class="overlay-card rules-card"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><div class="quick-rules" role="list"><div role="listitem"><b>1</b><span>↔️</span><strong>MUÉVETE</strong><small>Flechas o botones</small></div><div role="listitem"><b>2</b><span>⚡</span><strong>DISPARA</strong><small>ESPACIO · 3 cargas</small></div><div role="listitem"><b>3</b><span>🌀</span><strong>LLEGA</strong><small>Entra al portal</small></div><div role="listitem"><b>4</b><span>🧠</span><strong>RESPONDE</strong><small>Acierta y recarga</small></div></div><p class="quick-warning"><span>${isPractice ? '💚' : isTutorial ? '✨' : '⚠️'}</span><strong>${warning}</strong></p><button class="button primary launch-button" id="start-flight">${launch}</button></div></div>
      <div id="tutorial-coach" class="tutorial-coach" hidden aria-live="assertive"></div>
      <div id="achievement-pop" class="achievement-pop" hidden aria-live="polite"></div>
      <section id="pause-panel" class="pause-panel" hidden aria-labelledby="pause-title"><div><span class="pause-icon">⏸</span><p class="eyebrow">Tiempo para respirar</p><h2 id="pause-title">Vuelo en pausa</h2><p>La nave y los obstáculos están congelados.</p><button class="button primary" id="resume-flight">▶ Continuar</button><button class="button ghost" id="restart-from-pause">↻ Reiniciar</button></div></section>
      <section id="quiz-panel" class="quiz-panel" hidden aria-labelledby="quiz-question"><div class="quiz-card"><p class="quiz-category" id="quiz-category"></p><div class="fuel-question-icon" aria-hidden="true">⛽</div><h2 id="quiz-question"></h2><div id="quiz-options" class="quiz-options"></div><p id="quiz-result" class="quiz-result" aria-live="assertive"></p></div></section>
      <div class="mobile-flight-controls" aria-label="Controles móviles"><button id="mobile-steer-left" type="button" aria-label="Mover nave a la izquierda"><span>⬅️</span><strong>IZQUIERDA</strong></button><button class="mobile-fire-control" id="mobile-fire-plasma" data-fire-plasma type="button" aria-label="Disparar plasma. Quedan tres disparos"><span>⚡</span><strong>DISPARAR</strong><small><b id="mobile-ammo-value">3</b> CARGAS</small></button><button id="mobile-steer-right" type="button" aria-label="Mover nave a la derecha"><span>➡️</span><strong>DERECHA</strong></button></div>
    </div>
    <div class="touch-controls" aria-label="Controles táctiles"><button id="steer-left" type="button" aria-label="Mover nave a la izquierda">⬅️<span>IZQUIERDA</span></button><button class="fire-control" id="fire-plasma" data-fire-plasma type="button" aria-label="Disparar plasma. Quedan tres disparos">⚡<span>DISPARAR</span><small>ESPACIO</small></button><button id="steer-right" type="button" aria-label="Mover nave a la derecha"><span>DERECHA</span>➡️</button></div>
    <p class="flight-tip">Toca los lados para moverte · Pulsa ESPACIO para disparar.</p>
  </section>`;
}

function renderInstructions() {
  return '<article class="screen screen-narrow flight-info" aria-labelledby="instructions-title"><p class="eyebrow">Cómo jugar</p><h1 id="instructions-title">Llega tan lejos como puedas</h1><p class="lead">Entra al portal, acierta la pregunta y continúa volando.</p><div class="instruction-grid"><article><b>1</b><span>↔️</span><h2>Muévete</h2><p>Usa flechas, A/D o los botones para cambiar entre 3 carriles.</p></article><article><b>2</b><span>⚡</span><h2>Dispara</h2><p>Usa ESPACIO. Tienes solo 3 cargas durante todo el intento.</p></article><article><b>3</b><span>🌀</span><h2>Portal</h2><p>Al entrar, el vuelo se detiene y aparece una pregunta.</p></article><article><b>4</b><span>🧠</span><h2>Responde</h2><p>Un acierto recarga combustible. Una respuesta incorrecta termina la misión.</p></article></div><div class="rule-banner"><span>⚠️</span><p><strong>Cuida la nave:</strong> cada choque quita 1 escudo y combustible. Tres choques o combustible vacío también terminan el intento.</p></div><div class="button-row"><button class="button primary launch-button" data-nav="flight" data-mode="mission">🚀 Jugar ahora</button><button class="button tutorial-button" data-nav="flight" data-mode="tutorial">🎮 Aprender a pilotar</button><button class="button ghost" data-nav="home">Volver</button></div></article>';
}

function renderTeacher() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="teacher-title"><p class="eyebrow">Guía docente</p><h1 id="teacher-title">Pilotaje y conocimiento general</h1><p class="lead">Experiencia para estudiantes de 10 a 12 años que combina coordinación visomotora, atención sostenida y recuperación de conocimientos.</p><section class="card"><h2>Progresión</h2><ul><li>El banco contiene 100 preguntas repartidas en cinco niveles.</li><li>Cada dos portales cambia el sector y aumenta el nivel cognitivo.</li><li>La dificultad se adapta: una buena racha acelera el reto y los choques activan ayuda temporal.</li><li>Las oleadas bloquean como máximo dos carriles, por lo que siempre existe una ruta posible.</li><li>El tutorial y el modo práctica permiten aprender sin castigo.</li></ul></section><section><h2>Áreas</h2><div class="knowledge-chips"><span>🪐 Espacio</span><span>🌱 Ciencias</span><span>🌎 Geografía</span><span>✖️ Matemáticas</span><span>📚 Lenguaje</span><span>🤝 Convivencia</span></div></section><section class="callout"><h2>Uso sugerido</h2><p>Realice intentos de 5 a 10 minutos. Use primero el tutorial, luego práctica y finalmente misión. La bitácora final ayuda a conversar sobre lo aprendido; el récord es motivación personal, no una calificación.</p></section><div class="button-row"><a class="button secondary" href="informe-actividad-1.html">Documento académico</a><button class="button primary" data-nav="home">Volver</button></div></article>';
}

function renderCredits() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="credits-title"><p class="eyebrow">Créditos</p><h1 id="credits-title">Misión Nébula</h1><div class="card"><p class="lead"><strong>Diseñado y desarrollado por Danilo Olarte González.</strong></p><p>Maestría en Educación · Corporación Universitaria Iberoamericana.</p><p>Electiva Creatividad e Innovación Educativa · Actividad 1, “Jugando enseño a crear”.</p></div><section class="callout"><h2>Privacidad</h2><p>No utiliza cuentas, publicidad ni analítica. Solo guarda en este dispositivo el récord, los logros, el tutorial completado y los ajustes elegidos.</p></section><div class="button-row"><button class="button primary" data-nav="home">Volver</button></div></article>';
}

function render() {
  const screens = { home: renderHome, flight: renderFlight, instructions: renderInstructions, teacher: renderTeacher, credits: renderCredits };
  document.body.classList.toggle('flight-route', route === 'flight');
  app.innerHTML = (screens[route] || renderHome)();
  app.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.mode) flightMode = button.dataset.mode;
    setRoute(button.dataset.nav);
  }));
  if (route === 'flight') bindFlight();
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
    fireButton.setAttribute('aria-label', state.ammo > 0 ? 'Disparar plasma. Quedan ' + state.ammo + ' disparos' : 'Sin cargas de plasma');
  });
  const mobileAmmo = document.getElementById('mobile-ammo-value');
  if (mobileAmmo) mobileAmmo.textContent = state.ammo;
  document.querySelector('.ammo-hud')?.classList.toggle('empty', state.ammo <= 0);
  document.querySelector('.flight-page')?.style.setProperty('--danger-level', Math.min(1, (state.level - 1) / 8));
  const sectorBadge = document.getElementById('sector-badge');
  if (sectorBadge) {
    const modeLabel = state.practice ? '🧪 PRÁCTICA' : flightMode === 'tutorial' ? '🎮 TUTORIAL' : '🚀 MISIÓN';
    sectorBadge.innerHTML = '<span>' + modeLabel + '</span><strong>' + state.sector.icon + ' ' + state.sector.name + '</strong>';
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
  document.querySelector('.flight-page')?.classList.remove('is-paused');
  if (overlay) overlay.hidden = true;
  if (pausePanel) pausePanel.hidden = true;
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
  lastLearnedFact = '';
  flight.start({ practice: flightMode === 'practice', tutorial: flightMode === 'tutorial' });
  startMusic(1);
  playTone('complete');
  const message = flightMode === 'practice' ? '🧪 PRÁCTICA ACTIVA · AQUÍ APRENDEMOS' : flightMode === 'tutorial' ? '🎮 SIGUE A NOVA, TU GUÍA' : '🎵 MÚSICA ESPACIAL ACTIVADA';
  showToast(getSettings().sound ? message : '🔇 Música apagada · toca MÚSICA para activarla', getSettings().sound ? 'success' : 'normal');
  document.getElementById('flight-canvas')?.focus();
}

function togglePause(forceResume = false) {
  if (!flight || ['idle', 'gameover', 'quiz'].includes(flight.mode)) return;
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
      flight.answerCorrect();
      if (flight.totalCorrect >= 1) unlockAchievement('first_portal');
      if (currentCheckpointClean) unlockAchievement('clean_pilot');
      if (flight.bestStreak >= 3) unlockAchievement('streak_three');
      showToast('⛽ +38% · NIVEL ' + (flight.checkpoints + 1) + ' · MÁS RÁPIDO', 'success');
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
        flight.answerPracticeMistake();
        showToast('🧪 SEGUIMOS PRACTICANDO · +24% COMBUSTIBLE', 'success');
        document.getElementById('flight-canvas')?.focus();
      } else {
        flight.strand('La respuesta no fue correcta. ' + currentQuestion.fact);
      }
    }, flightMode === 'practice' ? 2100 : 1700);
  }
}

function showGameOver(result) {
  stopMusic();
  const best = Math.max(result.distance, Number(localStorage.getItem('nebula-flight-best') || 0));
  localStorage.setItem('nebula-flight-best', String(best));
  const overlay = document.getElementById('flight-overlay');
  const fact = lastLearnedFact ? '<div class="learned-fact"><span>💡</span><p><small>HOY APRENDISTE</small><strong>' + escapeHtml(lastLearnedFact) + '</strong></p></div>' : '';
  const achievementNote = runAchievements.length ? '<p class="run-achievements">🏅 Desbloqueaste ' + runAchievements.length + (runAchievements.length === 1 ? ' logro nuevo' : ' logros nuevos') + '</p>' : '';
  overlay.innerHTML = '<div class="overlay-card stranded-card"><div class="stranded-icon" aria-hidden="true">🛰️</div><p class="eyebrow">Bitácora de vuelo</p><h2>¡Gran intento, piloto!</h2><p>' + escapeHtml(result.reason) + '</p><div class="flight-summary"><span><b>' + result.distance + '</b> km<small>Distancia</small></span><span><b>' + result.correct + '</b><small>Respuestas</small></span><span><b>' + result.bestStreak + '</b><small>Mejor racha</small></span><span><b>' + result.destroyed + '</b><small>Destruidos</small></span><span><b>' + result.checkpoints + '</b><small>Portales</small></span><span><b>' + best + '</b> km<small>Récord</small></span></div>' + fact + achievementNote + '<div class="summary-actions"><button class="button primary launch-button" id="restart-flight">🚀 Intentar otra vez</button><button class="button ghost" id="practice-after-game">🧪 Practicar</button><button class="button text-button" data-nav="home">Salir</button></div></div>';
  overlay.hidden = false;
  overlay.querySelector('#restart-flight').addEventListener('click', () => {
    flightMode = 'mission';
    startFlightSession();
  });
  overlay.querySelector('#practice-after-game').addEventListener('click', () => {
    flightMode = 'practice';
    startFlightSession();
  });
  overlay.querySelector('[data-nav]').addEventListener('click', () => setRoute('home'));
  announce('Misión terminada. Revisa tu bitácora y vuelve a intentarlo cuando quieras.');
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
  try {
    if (activeElement && exit) {
      await exit.call(document);
    } else if (page.classList.contains('pseudo-fullscreen')) {
      page.classList.remove('pseudo-fullscreen');
      document.body.classList.remove('flight-screen-locked');
    } else if (request) {
      await request.call(page);
    } else {
      page.classList.add('pseudo-fullscreen');
      document.body.classList.add('flight-screen-locked');
    }
  } catch (error) {
    page.classList.toggle('pseudo-fullscreen');
    document.body.classList.toggle('flight-screen-locked', page.classList.contains('pseudo-fullscreen'));
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
      showToast('💥 ' + name + ' DESTRUIDO', 'destroy');
      if (flight.destroyed >= 3) unlockAchievement('sharpshooter');
    },
    onEmptyFire: () => {
      playTone('empty');
      showToast('⚠️ SIN PLASMA · ¡ESQUIVA!', 'danger');
    },
    onSectorChange: (sector) => {
      playTone('achievement');
      showToast(sector.icon + ' NUEVO SECTOR · ' + sector.name.toUpperCase(), 'success');
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
  applySettings();
}

document.querySelectorAll('.site-header [data-nav]').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  setRoute(button.dataset.nav);
}));
document.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', () => {
  settingsDialog.dataset.resumeMusic = ['running', 'quiz'].includes(flight?.mode) ? 'true' : 'false';
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
document.addEventListener('keydown', (event) => {
  const page = document.querySelector('.flight-page.pseudo-fullscreen');
  if (event.key === 'Escape' && page) {
    page.classList.remove('pseudo-fullscreen');
    document.body.classList.remove('flight-screen-locked');
    updateFullscreenButton();
  } else if ((event.key === 'p' || event.key === 'P') && flight && route === 'flight') {
    event.preventDefault();
    togglePause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resumeMusicOnVisible = ['running', 'quiz'].includes(flight?.mode);
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
render();
