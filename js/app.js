import { SpaceFlight } from './space-game.js';
import { shuffledQuestions, levelForPortal, shuffledQuestionOptions } from './questions.js';
import { bindSettings, applySettings, getSettings, announce, playTone, startMusic, setMusicIntensity, stopMusic } from './accessibility.js?v=12';

const app = document.getElementById('app');
const settingsDialog = document.getElementById('settings-dialog');
let route = 'home';
let flight = null;
const questionDecks = new Map();
let currentQuestion = null;
let toastTimer = 0;
let quizTimer = 0;
let resumeMusicOnVisible = false;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function setRoute(next) {
  window.clearTimeout(quizTimer);
  window.clearTimeout(toastTimer);
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
  return '<section class="screen flight-home" aria-labelledby="home-title"><div class="flight-home-copy"><p class="eyebrow">🚀 Aventura educativa 2.5D</p><h1 id="home-title">Pilota la <span>Asteria</span></h1><p class="lead">Esquiva oleadas. Supera 100 preguntas. Siente cómo aumenta la velocidad.</p><div class="mission-formula"><span><b>🕹️</b><small>Esquiva</small></span><i>→</i><span><b>🌀</b><small>Llega</small></span><i>→</i><span><b>🧠</b><small>Responde</small></span><i>→</i><span><b>⚡</b><small>Más rápido</small></span></div><div class="button-row"><button class="button primary launch-button" data-nav="flight">🚀 Despegar</button><button class="button ghost" data-nav="instructions">Cómo jugar</button></div>' + (best ? '<p class="best-flight">🏆 Récord: <strong>' + best + ' km</strong></p>' : '') + '</div><div class="home-orbit" aria-hidden="true"><div class="orbit-planet"></div><div class="orbit-ship">▲<i></i></div><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span></div></section>';
}

function renderFlight() {
  return `<section class="flight-page" aria-labelledby="flight-title">
    <h1 id="flight-title" class="sr-only">Vuelo de la nave Asteria</h1>
    <div class="flight-hud">
      <div class="hud-block fuel-hud"><span>⛽ Combustible</span><div class="fuel-track"><i id="fuel-fill"></i></div><strong id="fuel-value">62%</strong></div>
      <div class="hud-block hull-hud"><span>🛡️ Escudos</span><strong id="hull-value" aria-label="Tres escudos">♥ ♥ ♥</strong></div>
      <div class="hud-block"><span>📍 Distancia</span><strong><b id="distance-value">0</b> km</strong></div>
      <div class="hud-block checkpoint-hud"><span>🌀 Portal <b id="checkpoint-number">1</b></span><strong>A <b id="remaining-value">280</b> km</strong></div>
      <div class="hud-block difficulty-hud"><span>⚡ Dificultad</span><strong>Nivel <b id="level-value">1</b></strong></div>
    </div>
    <div class="flight-stage">
      <canvas id="flight-canvas" tabindex="0" aria-label="Ruta espacial. Usa flecha izquierda y derecha o los botones para mover la nave entre tres carriles."></canvas>
      <div class="flight-stage-actions">
        <button class="music-flight" id="music-flight" data-music-label type="button" aria-label="Silenciar música y sonidos" aria-pressed="true"><span>🎵</span><strong>Música</strong></button>
        <button class="fullscreen-flight" id="fullscreen-flight" type="button" aria-label="Activar pantalla completa" aria-pressed="false"><span>⛶</span><strong>Pantalla completa</strong></button>
      </div>
      <div id="flight-toast" class="flight-toast" hidden></div>
      <div id="flight-overlay" class="flight-overlay"><div class="overlay-card"><p class="eyebrow">Controles de vuelo</p><h2>Muévete entre 3 caminos</h2><div class="control-demo"><span>⬅️<small>Izquierda</small></span><b>🚀</b><span>➡️<small>Derecha</small></span></div><p>Esquiva todo y entra al portal brillante.</p><button class="button primary launch-button" id="start-flight">¡Despegar!</button></div></div>
      <section id="quiz-panel" class="quiz-panel" hidden aria-labelledby="quiz-question"><div class="quiz-card"><p class="quiz-category" id="quiz-category"></p><div class="fuel-question-icon" aria-hidden="true">⛽</div><h2 id="quiz-question"></h2><div id="quiz-options" class="quiz-options"></div><p id="quiz-result" class="quiz-result" aria-live="assertive"></p></div></section>
    </div>
    <div class="touch-controls" aria-label="Controles táctiles"><button id="steer-left" type="button" aria-label="Mover nave a la izquierda">⬅️<span>IZQUIERDA</span></button><button id="steer-right" type="button" aria-label="Mover nave a la derecha"><span>DERECHA</span>➡️</button></div>
    <p class="flight-tip">También puedes tocar el lado izquierdo o derecho del espacio.</p>
  </section>`;
}

function renderInstructions() {
  return '<article class="screen screen-narrow flight-info" aria-labelledby="instructions-title"><p class="eyebrow">Cómo jugar</p><h1 id="instructions-title">Una misión. Cuatro reglas.</h1><div class="instruction-grid"><article><b>1</b><span>🕹️</span><h2>Pilota</h2><p>Muévete a izquierda o derecha.</p></article><article><b>2</b><span>☄️</span><h2>Esquiva</h2><p>Busca el carril que queda libre.</p></article><article><b>3</b><span>🌀</span><h2>Llega</h2><p>Entra al portal de recarga.</p></article><article><b>4</b><span>⚡</span><h2>Resiste</h2><p>Cada acierto acelera la galaxia.</p></article></div><div class="rule-banner"><span>⚠️</span><p><strong>Si fallas una pregunta, la nave queda varada.</strong><br>Las preguntas suben por cinco niveles y las oleadas siguen acelerando.</p></div><div class="button-row"><button class="button primary launch-button" data-nav="flight">🚀 Jugar ahora</button><button class="button ghost" data-nav="home">Volver</button></div></article>';
}

function renderTeacher() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="teacher-title"><p class="eyebrow">Guía docente</p><h1 id="teacher-title">Pilotaje y conocimiento general</h1><p class="lead">Experiencia para estudiantes de 10 a 12 años que combina coordinación visomotora, atención sostenida y recuperación de conocimientos.</p><section class="card"><h2>Progresión</h2><ul><li>El banco contiene 100 preguntas repartidas en cinco niveles.</li><li>Cada dos portales aumenta el nivel cognitivo de las preguntas.</li><li>Cada respuesta correcta acelera los obstáculos y aumenta la posibilidad de oleadas dobles.</li><li>Las oleadas bloquean como máximo dos carriles, por lo que siempre existe una ruta posible.</li><li>La música espacial aumenta su pulso con la dificultad.</li></ul></section><section><h2>Áreas</h2><div class="knowledge-chips"><span>🪐 Espacio</span><span>🌱 Ciencias</span><span>🌎 Geografía</span><span>✖️ Matemáticas</span><span>📚 Lenguaje</span><span>🤝 Convivencia</span></div></section><section class="callout"><h2>Uso sugerido</h2><p>Realice intentos de 5 a 10 minutos. Después de una respuesta incorrecta, converse brevemente sobre el dato mostrado. El récord funciona como motivación personal, no como calificación.</p></section><div class="button-row"><a class="button secondary" href="informe-actividad-1.html">Documento académico</a><button class="button primary" data-nav="home">Volver</button></div></article>';
}

function renderCredits() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="credits-title"><p class="eyebrow">Créditos</p><h1 id="credits-title">Misión Nébula</h1><div class="card"><p class="lead"><strong>Diseñado y desarrollado por Danilo Olarte González.</strong></p><p>Maestría en Educación · Corporación Universitaria Iberoamericana.</p><p>Electiva Creatividad e Innovación Educativa · Actividad 1, “Jugando enseño a crear”.</p></div><section class="callout"><h2>Privacidad</h2><p>No utiliza cuentas, publicidad ni analítica. Solo guarda el récord de distancia en este dispositivo.</p></section><div class="button-row"><button class="button primary" data-nav="home">Volver</button></div></article>';
}

function render() {
  const screens = { home: renderHome, flight: renderFlight, instructions: renderInstructions, teacher: renderTeacher, credits: renderCredits };
  app.innerHTML = (screens[route] || renderHome)();
  app.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => setRoute(button.dataset.nav)));
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
  document.querySelector('.flight-page')?.style.setProperty('--danger-level', Math.min(1, (state.level - 1) / 8));
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
  const panel = document.getElementById('quiz-panel');
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
  if (selectedIndex === currentQuestion.answer) {
    document.getElementById('quiz-result').textContent = '✅ ¡Correcto! Combustible recargado.';
    playTone('core');
    quizTimer = window.setTimeout(() => {
      panel.hidden = true;
      panel.dataset.answered = 'false';
      flight.answerCorrect();
      showToast('⛽ +38% · NIVEL ' + (flight.checkpoints + 1) + ' · MÁS RÁPIDO', 'success');
      document.getElementById('flight-canvas')?.focus();
    }, 1050);
  } else {
    buttons[selectedIndex].classList.add('wrong');
    document.getElementById('quiz-result').textContent = '❌ ' + currentQuestion.fact;
    playTone('alert');
    quizTimer = window.setTimeout(() => {
      panel.hidden = true;
      panel.dataset.answered = 'false';
      flight.strand('La respuesta no fue correcta. ' + currentQuestion.fact);
    }, 1500);
  }
}

function showGameOver(result) {
  stopMusic();
  const best = Math.max(result.distance, Number(localStorage.getItem('nebula-flight-best') || 0));
  localStorage.setItem('nebula-flight-best', String(best));
  const overlay = document.getElementById('flight-overlay');
  overlay.innerHTML = '<div class="overlay-card stranded-card"><div class="stranded-icon" aria-hidden="true">🛰️</div><p class="eyebrow">Nave varada</p><h2>Perdidos en el espacio</h2><p>' + escapeHtml(result.reason) + '</p><div class="flight-summary"><span><b>' + result.distance + '</b> km</span><span><b>' + result.checkpoints + '</b> recargas</span><span><b>' + best + '</b> récord</span></div><button class="button primary launch-button" id="restart-flight">🚀 Volver a despegar</button><button class="button text-button" data-nav="home">Salir</button></div>';
  overlay.hidden = false;
  overlay.querySelector('#restart-flight').addEventListener('click', () => {
    overlay.hidden = true;
    flight.start();
    startMusic(1);
    playTone('complete');
    document.getElementById('flight-canvas')?.focus();
  });
  overlay.querySelector('[data-nav]').addEventListener('click', () => setRoute('home'));
  announce('La nave quedó varada. Puedes volver a despegar.');
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
    onSteer: () => playTone('select')
  });
  const overlay = document.getElementById('flight-overlay');
  document.getElementById('start-flight').addEventListener('click', () => {
    overlay.hidden = true;
    flight.start();
    startMusic(1);
    playTone('complete');
    showToast(getSettings().sound ? '🎵 MÚSICA ESPACIAL ACTIVADA' : '🔇 Música apagada · toca MÚSICA para activarla', getSettings().sound ? 'success' : 'normal');
    canvas.focus();
  });
  document.getElementById('steer-left').addEventListener('click', () => flight.moveLane(-1));
  document.getElementById('steer-right').addEventListener('click', () => flight.moveLane(1));
  document.getElementById('music-flight').addEventListener('click', () => {
    const enabled = !getSettings().sound;
    applySettings({ sound: enabled });
    if (enabled) playTone('complete');
    showToast(enabled ? '🎵 MÚSICA ACTIVADA' : '🔇 MÚSICA SILENCIADA', enabled ? 'success' : 'normal');
  });
  document.getElementById('fullscreen-flight').addEventListener('click', toggleFullscreen);
  applySettings();
}

document.querySelectorAll('.site-header [data-nav]').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  setRoute(button.dataset.nav);
}));
document.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', () => {
  settingsDialog.dataset.resumeMusic = flight && !['idle', 'gameover'].includes(flight.mode) ? 'true' : 'false';
  flight?.pause();
  stopMusic();
  settingsDialog.showModal();
}));
settingsDialog.addEventListener('close', () => {
  if (settingsDialog.dataset.resumeMusic === 'true' && flight && flight.mode !== 'gameover') startMusic(flight.checkpoints + 1);
  flight?.resume();
});
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('keydown', (event) => {
  const page = document.querySelector('.flight-page.pseudo-fullscreen');
  if (event.key === 'Escape' && page) {
    page.classList.remove('pseudo-fullscreen');
    document.body.classList.remove('flight-screen-locked');
    updateFullscreenButton();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resumeMusicOnVisible = Boolean(flight && !['idle', 'gameover'].includes(flight.mode));
    flight?.pause();
    stopMusic();
  } else {
    if (resumeMusicOnVisible && flight && flight.mode !== 'gameover') startMusic(flight.checkpoints + 1);
    resumeMusicOnVisible = false;
    flight?.resume();
  }
});
bindSettings(document);
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('El modo sin conexión no pudo activarse.', error));
}
render();
