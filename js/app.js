import { ZONES, ROLES, RUBRIC, TUTORIAL_STEPS } from './data.js';
import { createGame, generateMission, completeMission, missionProgress, elapsedMinutes } from './game.js';
import { loadGame, saveGame, clearGame, hasSavedGame } from './storage.js';
import { calculateEvaluation, chooseBadge, recommendationFor, aggregateScores } from './evaluation.js';
import { SketchCanvas } from './canvas.js';
import { bindSettings, applySettings, announce, playTone } from './accessibility.js';
import { escapeHtml, downloadReport, openPrintableReport } from './report.js';

const app = document.getElementById('app');
const settingsDialog = document.getElementById('settings-dialog');
const confirmDialog = document.getElementById('confirm-dialog');
let game = loadGame();
let route = 'home';
let sketch = null;

const modeLabels = { individual: 'Individual', collaborative: 'Colaborativa', teams: 'Por equipos' };
const fieldHelp = {
  name: ['Nombre del invento', 'Un nombre corto que represente la idea.', 80],
  description: ['Descripción general', '¿Qué es y cómo se ve?', 500],
  solvedProblem: ['¿Cómo resuelve el problema?', 'Relaciona la idea directamente con la necesidad de la misión.', 500],
  steps: ['Pasos de construcción o aplicación', 'Ordénalos con números o frases breves.', 800],
  reasoning: ['¿Por qué consideran que funcionará?', 'Explica las razones, no solo repitas la idea.', 500],
  environment: ['¿Cómo protege el entorno?', 'Piensa en seres vivos, materiales, residuos y uso futuro.', 400]
};

function setRoute(next) {
  route = next;
  if (sketch) { sketch.destroy(); sketch = null; }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.setTimeout(() => app.focus(), 50);
}

function render() {
  const screens = {
    home: renderHome, story: renderStory, config: renderConfig, tutorial: renderTutorial,
    map: renderMap, mission: renderMission, builder: renderBuilder, twist: renderTwist,
    rubric: renderRubric, missionResult: renderMissionResult, final: renderFinal,
    instructions: renderInstructions, teacher: renderTeacher, credits: renderCredits
  };
  app.innerHTML = (screens[route] || renderHome)();
  bindGlobalActions();
  const binder = {
    config: bindConfig, tutorial: bindTutorial, map: bindMap, mission: bindMission,
    builder: bindBuilder, twist: bindTwist, rubric: bindRubric, missionResult: bindMissionResult,
    final: bindFinal
  }[route];
  binder?.();
  applySettings();
}

function bindGlobalActions() {
  app.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    const destination = button.dataset.nav;
    if (destination === 'new') { game = null; setRoute('story'); return; }
    if (destination === 'continue') { game = loadGame(); setRoute(game?.completed ? 'final' : 'map'); return; }
    setRoute(destination);
  }));
  app.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', () => settingsDialog.showModal()));
}

function renderHome() {
  const continueButton = hasSavedGame() ? '<button class="button secondary" data-nav="continue">Continuar partida</button>' : '';
  return '<section class="screen hero" aria-labelledby="home-title"><div class="hero-copy"><p class="eyebrow">✦ Expedición creativa</p><h1 id="home-title">Misión Nébula <span>Rescate en el planeta desconocido</span></h1><p class="lead">La nave Asteria necesita ideas que nadie haya probado. Combina, dibuja, explica y transforma tus soluciones para recuperar los Núcleos de Ingenio.</p><div class="button-row"><button class="button primary" data-nav="new">Iniciar nueva expedición</button>' + continueButton + '<button class="button ghost" data-nav="instructions">Conocer el juego</button></div><div class="stat-strip" aria-label="Características"><span class="stat-chip">👥 1 a 4 participantes</span><span class="stat-chip">🧠 Creatividad indispensable</span><span class="stat-chip">🔒 Datos solo en este dispositivo</span></div></div><div class="planet-scene" aria-label="Ilustración del planeta Nébula-X y la nave Asteria"><div class="planet"></div><div class="ship"></div></div></section>';
}

function renderStory() {
  return '<section class="screen screen-narrow" aria-labelledby="story-title"><p class="eyebrow">Bitácora de emergencia 01</p><h1 id="story-title">Aterrizaje en Nébula-X</h1><div class="story-panel"><div class="story-visual card"><div class="asteria" role="img" aria-label="Nave Asteria averiada"></div></div><div class="card"><p class="lead">La nave de exploración <strong>Asteria</strong> aterrizó de emergencia. Cinco sistemas quedaron dañados y cada uno necesita un Núcleo de Ingenio.</p><ul class="system-list"><li>Comunicación</li><li>Energía</li><li>Navegación</li><li>Soporte vital</li><li>Propulsión</li></ul><p>Nébula-X es un planeta vivo. Toda solución debe cuidarlo y respetar a sus criaturas. Aquí no existe una única respuesta correcta: importan las ideas, sus razones y cómo pueden mejorar.</p><div class="button-row"><button class="button ghost" data-nav="home">Volver</button><button class="button primary" data-nav="config">Formar tripulación</button></div></div></div></section>';
}

function renderConfig() {
  return '<section class="screen screen-narrow" aria-labelledby="config-title"><ol class="stepper" aria-label="Progreso de preparación"><li class="active"><span class="step-number">1</span><span>Tripulación</span></li><li><span class="step-number">2</span><span>Tutorial</span></li><li><span class="step-number">3</span><span>Mapa</span></li></ol><p class="eyebrow">Prepara la expedición</p><h1 id="config-title">¿Quiénes viajan en la Asteria?</h1><form id="config-form" class="card" novalidate><div id="config-errors" aria-live="assertive"></div><div class="field"><label for="crew-name">Nombre de la tripulación</label><input id="crew-name" name="crewName" maxlength="40" required placeholder="Ejemplo: Exploradores del Cometa" autocomplete="off"><small>Evita apellidos u otros datos personales.</small></div><fieldset class="field"><legend>Modalidad</legend><div class="choice-grid"><label class="choice-card"><input type="radio" name="mode" value="individual" checked><span><strong>🧑 Individual</strong><small>Una persona asume todos los roles.</small></span></label><label class="choice-card"><input type="radio" name="mode" value="collaborative"><span><strong>👥 Colaborativa</strong><small>De 2 a 4 participantes.</small></span></label><label class="choice-card"><input type="radio" name="mode" value="teams"><span><strong>🚀 Por equipos</strong><small>De 2 a 4 equipos o parejas.</small></span></label></div></fieldset><fieldset class="field"><legend>Duración</legend><div class="choice-grid"><label class="choice-card"><input type="radio" name="length" value="full" checked><span><strong>Expedición completa</strong><small>5 misiones · 60–90 min.</small></span></label><label class="choice-card"><input type="radio" name="length" value="quick"><span><strong>Partida rápida</strong><small>3 misiones · 35–50 min.</small></span></label></div></fieldset><div class="field"><label id="players-label">Participantes</label><div id="player-fields" class="player-fields" aria-labelledby="players-label"></div><small>Los nombres se guardan únicamente en este navegador.</small></div><div class="button-row"><button type="button" class="button ghost" data-nav="story">Volver</button><button class="button primary" type="submit">Guardar y practicar</button></div></form></section>';
}

function bindConfig() {
  const form = document.getElementById('config-form');
  const fields = document.getElementById('player-fields');
  const updatePlayers = () => {
    const mode = new FormData(form).get('mode');
    const count = mode === 'individual' ? 1 : 4;
    const label = mode === 'teams' ? 'Equipo' : 'Participante';
    fields.innerHTML = Array.from({ length: count }, (_, index) => '<label class="field"><span>' + label + ' ' + (index + 1) + (index > (mode === 'individual' ? 0 : 1) ? ' (opcional)' : '') + '</span><input name="player" maxlength="28" ' + (index <= (mode === 'individual' ? 0 : 1) ? 'required' : '') + ' placeholder="' + (mode === 'teams' ? 'Nombre del equipo' : 'Nombre o apodo') + '" autocomplete="off"></label>').join('');
  };
  form.querySelectorAll('[name="mode"]').forEach((input) => input.addEventListener('change', updatePlayers));
  updatePlayers();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const players = data.getAll('player').map((name) => name.trim()).filter(Boolean);
    const mode = data.get('mode');
    const errors = [];
    if (!data.get('crewName')?.trim()) errors.push('Escribe un nombre para la tripulación.');
    if (mode !== 'individual' && players.length < 2) errors.push('Agrega al menos dos participantes o equipos.');
    if (players.length > 4) errors.push('La expedición admite hasta cuatro participantes o equipos.');
    const errorBox = document.getElementById('config-errors');
    if (errors.length) { errorBox.className = 'error-box'; errorBox.textContent = errors.join(' '); errorBox.focus?.(); return; }
    const config = { crewName: data.get('crewName').trim(), mode, modeLabel: modeLabels[mode], length: data.get('length'), players };
    game = createGame(config);
    saveGame(game);
    playTone('select');
    setRoute('tutorial');
  });
}

function renderTutorial() {
  return '<section class="screen screen-narrow" aria-labelledby="tutorial-title"><ol class="stepper" aria-label="Progreso de preparación"><li><span class="step-number">✓</span><span>Tripulación</span></li><li class="active"><span class="step-number">2</span><span>Práctica</span></li><li><span class="step-number">3</span><span>Mapa</span></li></ol><p class="eyebrow">Práctica de 2 minutos</p><h1 id="tutorial-title">Así se juega una misión</h1><p class="lead">No debes adivinar una respuesta. Tu equipo inventa una solución y después la mejora.</p><article class="practice-mission card"><div><span class="practice-label">Problema</span><strong>Una semilla debe cruzar un arroyo sin mojarse.</strong></div><div><span class="practice-label">Objetos</span><strong>Caja · cuerda · tela</strong></div><div><span class="practice-label">Regla especial</span><strong>No puedes tocar el agua.</strong></div></article><div class="tutorial-layout"><div class="tutorial-nav" role="tablist" aria-label="Pasos de una misión">' + TUTORIAL_STEPS.map((step, index) => '<button role="tab" aria-selected="' + (index === 0) + '" class="' + (index === 0 ? 'active' : '') + '" data-tutorial-step="' + index + '">' + step[0] + '</button>').join('') + '</div><div id="tutorial-demo" class="tutorial-demo card" role="tabpanel"><div><div class="tutorial-symbol" aria-hidden="true">👀</div><p class="step-command">Ahora haz esto</p><h2>' + TUTORIAL_STEPS[0][0] + '</h2><p class="lead">' + TUTORIAL_STEPS[0][1] + '</p><p class="example-line"><strong>Ejemplo:</strong> necesitamos mantener la semilla seca y cruzar sin pisar el agua.</p></div></div></div><article class="kid-tip"><span aria-hidden="true">💡</span><p><strong>Lo más importante:</strong> primero imagina varias ideas. No importa si alguna parece extraña: puede ayudarte a crear una mejor.</p></article><div class="button-row"><button class="button ghost" data-nav="config">Volver</button><button class="button primary" id="tutorial-finish">¡Entendido! Ir al mapa</button></div></section>';
}

function bindTutorial() {
  const demo = document.getElementById('tutorial-demo');
  const symbols = ['👀', '💭', '🛠️', '🔄', '⭐'];
  const examples = [
    'Necesitamos mantener la semilla seca y cruzar sin pisar el agua.',
    'Idea 1: una canasta colgante. Idea 2: una pequeña balsa. Idea 3: un puente de cuerda y tela.',
    'Elegimos el puente: la cuerda lo sostiene, la tela forma el camino y la caja protege la semilla.',
    'Si la cuerda se acorta, convertimos la caja en una balsa y usamos la tela como vela.',
    'Revisamos si funciona, si se entiende y si cuida el arroyo.'
  ];
  document.querySelectorAll('[data-tutorial-step]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.tutorialStep);
    document.querySelectorAll('[data-tutorial-step]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-selected', item === button); });
    demo.innerHTML = '<div><div class="tutorial-symbol" aria-hidden="true">' + symbols[index] + '</div><p class="step-command">Ahora haz esto</p><h2>' + TUTORIAL_STEPS[index][0] + '</h2><p class="lead">' + TUTORIAL_STEPS[index][1] + '</p><p class="example-line"><strong>Ejemplo:</strong> ' + examples[index] + '</p></div>';
    playTone('select');
  }));
  document.getElementById('tutorial-finish').addEventListener('click', () => setRoute('map'));
}

function renderHud() {
  return '<div class="hud"><div class="progress-wrap"><div class="progress-label"><span>Progreso de la expedición</span><strong>' + game.currentMission + ' de ' + game.missionCount + ' núcleos</strong></div><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + missionProgress(game) + '"><span style="--progress:' + missionProgress(game) + '%"></span></div></div><div class="energy-chip">⚡ ' + game.totalEnergy + ' energía</div></div>';
}

function renderMissionRoadmap(activeStep) {
  const steps = [['1', 'Entiende'], ['2', 'Imagina'], ['3', 'Cambia'], ['4', 'Evalúa'], ['5', 'Núcleo']];
  return '<ol class="mission-roadmap" aria-label="Pasos de la misión">' + steps.map((step, index) => {
    const number = index + 1;
    const state = number < activeStep ? 'done' : number === activeStep ? 'active' : '';
    return '<li class="' + state + '" ' + (number === activeStep ? 'aria-current="step"' : '') + '><span>' + (number < activeStep ? '✓' : step[0]) + '</span><strong>' + step[1] + '</strong></li>';
  }).join('') + '</ol>';
}

function renderMap() {
  if (!game) return renderHome();
  const nodes = ZONES.map((zone, index) => {
    const missionIndex = game.config.length === 'quick' ? [0, 2, 4].indexOf(index) : index;
    const used = missionIndex >= 0;
    const complete = used && missionIndex < game.currentMission;
    const current = used && missionIndex === game.currentMission && !game.completed;
    const locked = !used || missionIndex > game.currentMission;
    const status = complete ? 'Completada' : current ? 'Disponible' : used ? 'Bloqueada' : 'Fuera de la ruta rápida';
    return '<button class="zone-node ' + (complete ? 'complete ' : '') + (current ? 'current ' : '') + (locked ? 'locked' : '') + '" style="--zone-color:' + zone.color + '" data-zone="' + index + '" ' + (!current ? 'disabled' : '') + ' aria-label="' + zone.name + ': ' + status + '"><span class="zone-orb" aria-hidden="true">' + (locked ? '⌁' : zone.icon) + '</span><span><strong>' + zone.name + '</strong><small>' + status + '</small></span></button>';
  }).join('');
  const currentMission = game.completed ? null : generateMission(game);
  const roles = currentMission ? currentMission.roles.map((role) => '<div class="role-card"><strong>' + role.name + '</strong><span>' + escapeHtml(role.player) + '</span><small>' + role.description + '</small></div>').join('') : '';
  return '<section class="screen" aria-labelledby="map-title">' + renderHud() + '<p class="eyebrow">Mapa de Nébula-X</p><h1 id="map-title">Elige la zona que brilla</h1><div class="next-action"><span aria-hidden="true">☝️</span><p><strong>¿Qué hago ahora?</strong> Pulsa el planeta que tiene un aro blanco y dice “Disponible”. Los demás se abrirán después.</p></div><div class="planet-map">' + nodes + '</div>' + (currentMission ? '<div class="card soft"><h2>Cada quien tiene una tarea</h2><p>Busca tu nombre y lee qué debes hacer. Los roles cambiarán en la siguiente misión.</p><div class="roles-grid">' + roles + '</div></div>' : '') + '<div class="button-row"><button class="button ghost" data-reset-game>Reiniciar progreso</button>' + (game.completed ? '<button class="button primary" data-nav="final">Ver resultados finales</button>' : '') + '</div></section>';
}

function bindMap() {
  document.querySelector('.zone-node.current')?.addEventListener('click', () => {
    const mission = generateMission(game);
    game.missions[game.currentMission] = mission;
    saveGame(game);
    playTone('select');
    setRoute('mission');
  });
  document.querySelector('[data-reset-game]')?.addEventListener('click', async () => {
    confirmDialog.showModal();
    const result = await new Promise((resolve) => confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue), { once: true }));
    if (result === 'confirm') { clearGame(); game = null; announce('El progreso se eliminó de este navegador.'); setRoute('home'); }
  });
}

function currentMission() {
  return game?.missions[game.currentMission] || (game ? generateMission(game) : null);
}

function renderMission() {
  const mission = currentMission();
  if (!mission) return renderHome();
  return '<section class="screen" aria-labelledby="mission-title">' + renderHud() + renderMissionRoadmap(1) + '<div class="mission-header"><div><span class="zone-tag" style="--zone-color:' + mission.zone.color + '">' + mission.zone.icon + ' ' + mission.zone.name + '</span><p class="eyebrow">Misión ' + (mission.index + 1) + ' · Reparar ' + mission.zone.system.toLowerCase() + '</p><h1 id="mission-title">Paso 1: entiende el reto</h1></div><div class="energy-chip">Meta: usar ' + mission.minimumResources + ' objetos</div></div><div class="next-action"><span aria-hidden="true">👀</span><p><strong>Haz solo estas 3 cosas:</strong> lee el problema, mira tus objetos y recuerda la regla especial.</p></div><div class="challenge-grid"><article class="card problem-card"><span class="card-number">1</span><p class="eyebrow">¿Qué debemos resolver?</p><h2>' + mission.problem + '</h2></article><article class="card constraint-card"><span class="card-number">2</span><p class="eyebrow">Regla especial</p><h3>' + mission.restriction + '</h3></article></div><article class="card soft"><span class="card-number">3</span><h2>Estos son tus objetos</h2><ul class="resource-list">' + mission.resources.map((resource) => '<li class="resource-chip">' + resource + '</li>').join('') + '</ul><p class="subtle">Puedes darles usos sorprendentes, pero no añadir otros objetos.</p></article><div class="kid-tip"><span aria-hidden="true">💡</span><p><strong>Pista:</strong> ' + mission.zone.prompt + '</p></div><div class="mission-actions"><button class="button ghost" data-nav="map">Volver al mapa</button><button class="button primary" id="start-building">Ya lo entendí: imaginar ideas →</button></div></section>';
}

function bindMission() {
  document.getElementById('start-building')?.addEventListener('click', () => setRoute('builder'));
}

function textField(name, value = '') {
  const [label, help, max] = fieldHelp[name];
  const tag = name === 'name' ? 'input' : 'textarea';
  const attrs = ' id="' + name + '" name="' + name + '" maxlength="' + max + '" required aria-describedby="' + name + '-help ' + name + '-count"';
  const control = tag === 'input' ? '<input type="text"' + attrs + ' value="' + escapeHtml(value) + '">' : '<textarea' + attrs + '>' + escapeHtml(value) + '</textarea>';
  return '<div class="field"><label for="' + name + '">' + label + '</label>' + control + '<small id="' + name + '-help">' + help + '</small><span class="counter" id="' + name + '-count">' + String(value).length + '/' + max + '</span></div>';
}

function renderBuilder() {
  const mission = currentMission();
  if (!mission) return renderHome();
  const solution = mission.solution;
  const ideas = String(solution.alternatives || '').split(/\r?\n/);
  const resources = mission.resources.map((resource) => '<label class="resource-check"><input type="checkbox" name="resource" value="' + resource + '" ' + (solution.selectedResources.includes(resource) ? 'checked' : '') + '><span>' + resource + '</span></label>').join('');
  const ideaFields = [0, 1, 2].map((index) => '<label class="idea-field"><span><b>Idea ' + (index + 1) + '</b> <small>' + ['la más sencilla', 'una muy diferente', 'la más atrevida'][index] + '</small></span><input id="idea-' + (index + 1) + '" name="idea" maxlength="150" required value="' + escapeHtml(ideas[index] || '') + '" placeholder="Escribe una idea breve"></label>').join('');
  return '<section class="screen" aria-labelledby="builder-title">' + renderMissionRoadmap(2) + '<p class="eyebrow">Misión ' + (mission.index + 1) + ' · Laboratorio</p><h1 id="builder-title">Paso 2: imagina y construye</h1><div class="next-action"><span aria-hidden="true">💭</span><p><strong>Una cosa a la vez.</strong> Completa las cuatro tarjetas. Usa “Siguiente” cuando termines cada una.</p></div><div class="builder-layout"><form id="solution-form" novalidate><div id="solution-errors" aria-live="assertive"></div><ol class="builder-step-tabs" aria-label="Partes del laboratorio"><li class="active" data-builder-tab="0"><span>1</span>Ideas</li><li data-builder-tab="1"><span>2</span>Objetos</li><li data-builder-tab="2"><span>3</span>Plan</li><li data-builder-tab="3"><span>4</span>Dibujo</li></ol><section class="builder-panel card" data-builder-panel="0" aria-labelledby="ideas-title"><p class="step-command">Tarjeta 1 de 4</p><h2 id="ideas-title">Primero: piensa 3 ideas</h2><p>No elijas enseguida. Escribe tres posibilidades, aunque alguna parezca extraña.</p><div class="idea-list">' + ideaFields + '</div><hr><h3>Ahora elige o combina las mejores</h3>' + textField('name', solution.name) + textField('description', solution.description) + textField('solvedProblem', solution.solvedProblem) + '<div class="mission-actions"><button type="button" class="button ghost" data-nav="mission">Ver el reto</button><button type="button" class="button primary" data-builder-next="1">Siguiente: elegir objetos →</button></div></section><section class="builder-panel card" data-builder-panel="1" aria-labelledby="resources-title" hidden><p class="step-command">Tarjeta 2 de 4</p><h2 id="resources-title">Elige tus objetos</h2><p>Marca mínimo <strong>' + mission.minimumResources + '</strong>. Luego cuenta qué trabajo hará cada uno.</p><div class="resource-checks">' + resources + '</div><div id="resource-functions" class="resource-functions"></div><div class="mission-actions"><button type="button" class="button ghost" data-builder-back="0">← Volver a ideas</button><button type="button" class="button primary" data-builder-next="2">Siguiente: hacer el plan →</button></div></section><section class="builder-panel card" data-builder-panel="2" aria-labelledby="plan-title" hidden><p class="step-command">Tarjeta 3 de 4</p><h2 id="plan-title">Explica tu plan</h2><p>Imagina que otro equipo construirá el invento siguiendo tus palabras.</p>' + textField('steps', solution.steps) + textField('reasoning', solution.reasoning) + textField('environment', solution.environment) + '<div class="mission-actions"><button type="button" class="button ghost" data-builder-back="1">← Volver a objetos</button><button type="button" class="button primary" data-builder-next="3">Siguiente: dibujar →</button></div></section><section class="builder-panel card" data-builder-panel="3" aria-labelledby="drawing-title" hidden><p class="step-command">Tarjeta 4 de 4</p><h2 id="drawing-title">Dibuja cómo funciona</h2><p>Haz un boceto sencillo. Puedes añadir flechas, partes y movimientos.</p><div class="canvas-wrap"><canvas id="sketch-canvas" aria-label="Lienzo para dibujar el invento">Tu navegador no permite usar el lienzo de dibujo.</canvas></div><div class="canvas-tools"><label>Grosor <select id="brush-width"><option value="2">Fino</option><option value="4" selected>Medio</option><option value="8">Grueso</option></select></label><button class="button ghost small" type="button" id="undo-sketch">↶ Deshacer</button><button class="button ghost small" type="button" id="clear-sketch">Limpiar</button><button class="button ghost small" type="button" id="download-sketch">Descargar PNG</button></div><div class="mission-actions"><button type="button" class="button ghost" data-builder-back="2">← Volver al plan</button><button class="button primary" type="submit">¡Idea lista! Descubrir el giro →</button></div></section></form><aside class="card soft mission-aside"><p class="step-command">Tu misión en una frase</p><h2>Resuelve esto</h2><p>' + mission.problem + '</p><dl><dt>Regla que no puedes olvidar</dt><dd>' + mission.restriction + '</dd><dt>Para avanzar necesitas</dt><dd>3 ideas + ' + mission.minimumResources + ' objetos + un plan + un dibujo.</dd></dl><div class="kid-tip compact"><span aria-hidden="true">🤝</span><p>Pidan una idea a cada persona antes de elegir.</p></div></aside></div></section>';
}

function bindBuilder() {
  const mission = currentMission();
  const form = document.getElementById('solution-form');
  sketch = new SketchCanvas(document.getElementById('sketch-canvas'));
  if (mission.solution.drawing) sketch.load(mission.solution.drawing);
  document.getElementById('brush-width').addEventListener('change', (event) => sketch.setWidth(event.target.value));
  document.getElementById('undo-sketch').addEventListener('click', () => sketch.undo());
  document.getElementById('clear-sketch').addEventListener('click', () => sketch.clear());
  document.getElementById('download-sketch').addEventListener('click', () => sketch.download());
  form.querySelectorAll('input[maxlength], textarea[maxlength]').forEach((control) => control.addEventListener('input', () => {
    const counter = document.getElementById(control.id + '-count');
    if (counter) counter.textContent = control.value.length + '/' + control.maxLength;
  }));
  const updateFunctions = () => {
    const selected = [...form.querySelectorAll('[name="resource"]:checked')].map((input) => input.value);
    const container = document.getElementById('resource-functions');
    container.innerHTML = selected.map((resource) => '<label class="resource-function"><strong>' + resource + '</strong><input name="function-' + encodeURIComponent(resource) + '" maxlength="160" required placeholder="¿Qué función cumple?" value="' + escapeHtml(mission.solution.resourceFunctions[resource] || '') + '"></label>').join('');
  };
  form.querySelectorAll('[name="resource"]').forEach((input) => input.addEventListener('change', updateFunctions));
  updateFunctions();
  const showPanel = (index) => {
    form.querySelectorAll('[data-builder-panel]').forEach((panel) => { panel.hidden = Number(panel.dataset.builderPanel) !== index; });
    form.querySelectorAll('[data-builder-tab]').forEach((tab) => {
      const tabIndex = Number(tab.dataset.builderTab);
      tab.classList.toggle('active', tabIndex === index);
      tab.classList.toggle('done', tabIndex < index);
    });
    form.querySelector('[data-builder-panel="' + index + '"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    announce('Tarjeta ' + (index + 1) + ' de 4 del laboratorio.');
  };
  const stepErrors = (step) => {
    const data = new FormData(form);
    const errors = [];
    if (step === 0) {
      const ideas = data.getAll('idea').map((idea) => String(idea).trim()).filter(Boolean);
      if (ideas.length < 3) errors.push('Escribe las tres ideas antes de elegir.');
      ['name', 'description', 'solvedProblem'].forEach((name) => { if (!String(data.get(name) || '').trim()) errors.push('Completa “' + fieldHelp[name][0] + '”.'); });
    }
    if (step === 1) {
      const selected = data.getAll('resource');
      if (selected.length < mission.minimumResources) errors.push('Marca al menos ' + mission.minimumResources + ' objetos.');
      selected.forEach((resource) => { if (!String(data.get('function-' + encodeURIComponent(resource)) || '').trim()) errors.push('Cuenta qué hará ' + resource + '.'); });
    }
    if (step === 2) ['steps', 'reasoning', 'environment'].forEach((name) => { if (!String(data.get(name) || '').trim()) errors.push('Completa “' + fieldHelp[name][0] + '”.'); });
    return errors;
  };
  const showErrors = (errors) => {
    const box = document.getElementById('solution-errors');
    box.className = 'error-box';
    box.innerHTML = '<strong>Antes de seguir:</strong><ul>' + errors.map((error) => '<li>' + error + '</li>').join('') + '</ul>';
    box.scrollIntoView({ behavior: 'smooth' });
    announce('Hay datos por completar en esta tarjeta.');
  };
  form.querySelectorAll('[data-builder-next]').forEach((button) => button.addEventListener('click', () => {
    const current = Number(button.closest('[data-builder-panel]').dataset.builderPanel);
    const errors = stepErrors(current);
    if (errors.length) { showErrors(errors); return; }
    document.getElementById('solution-errors').className = '';
    document.getElementById('solution-errors').textContent = '';
    showPanel(Number(button.dataset.builderNext));
  }));
  form.querySelectorAll('[data-builder-back]').forEach((button) => button.addEventListener('click', () => showPanel(Number(button.dataset.builderBack))));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const selectedResources = data.getAll('resource');
    const errorsByStep = [stepErrors(0), stepErrors(1), stepErrors(2)];
    const firstInvalidStep = errorsByStep.findIndex((errors) => errors.length);
    if (firstInvalidStep >= 0) { showPanel(firstInvalidStep); showErrors(errorsByStep[firstInvalidStep]); return; }
    const resourceFunctions = {};
    selectedResources.forEach((resource) => {
      const value = String(data.get('function-' + encodeURIComponent(resource)) || '').trim();
      resourceFunctions[resource] = value;
    });
    ['name', 'description', 'solvedProblem', 'steps', 'reasoning', 'environment'].forEach((name) => { mission.solution[name] = String(data.get(name)).trim(); });
    mission.solution.alternatives = data.getAll('idea').map((idea) => String(idea).trim()).join('\n');
    mission.solution.selectedResources = selectedResources;
    mission.solution.resourceFunctions = resourceFunctions;
    mission.solution.drawing = sketch.toDataURL() || mission.solution.drawing;
    game.missions[mission.index] = mission;
    saveGame(game);
    playTone('alert');
    setRoute('twist');
  });
}

function renderTwist() {
  const mission = currentMission();
  if (!mission?.solution.name) return renderMission();
  return '<section class="screen screen-narrow" aria-labelledby="twist-title">' + renderMissionRoadmap(3) + '<article class="card twist-card"><div class="alert-symbol" aria-hidden="true">!</div><p class="eyebrow">Paso 3 · Giro inesperado</p><h1 id="twist-title">¡Algo cambió!</h1><div class="twist-message"><span aria-hidden="true">⚡</span><p>' + mission.twist + '</p></div><p>No borres toda tu idea. Busca qué parte debes cambiar para que vuelva a funcionar.</p></article><div class="before-after"><article class="card soft"><p class="step-command">Antes</p><h2>' + escapeHtml(mission.solution.name) + '</h2><p>' + escapeHtml(mission.solution.description) + '</p></article><article class="card soft"><p class="step-command">Ahora</p><h2>Haz dos cosas</h2><ol><li>Cuenta qué vas a cambiar.</li><li>Explica por qué ese cambio ayuda.</li></ol></article></div><form id="twist-form" class="card"><div id="twist-errors" aria-live="assertive"></div><div class="field"><label for="changes">1. ¿Qué cambiarán?</label><textarea id="changes" name="changes" maxlength="600" required aria-describedby="changes-help changes-count">' + escapeHtml(mission.solution.changes) + '</textarea><small id="changes-help">Puedes agregar, quitar, reemplazar o mover una parte.</small><span class="counter" id="changes-count">' + mission.solution.changes.length + '/600</span></div><div class="field"><label for="changeReason">2. ¿Por qué ahora sí funcionará?</label><textarea id="changeReason" name="changeReason" maxlength="500" required aria-describedby="changeReason-help changeReason-count">' + escapeHtml(mission.solution.changeReason) + '</textarea><small id="changeReason-help">Une tu explicación con el giro que apareció.</small><span class="counter" id="changeReason-count">' + mission.solution.changeReason.length + '/500</span></div><div class="mission-actions"><button type="button" class="button ghost" data-nav="builder">← Revisar el invento</button><button class="button primary" type="submit">Idea mejorada: vamos a evaluar →</button></div></form></section>';
}

function bindTwist() {
  const form = document.getElementById('twist-form');
  form.querySelectorAll('textarea').forEach((control) => control.addEventListener('input', () => { document.getElementById(control.name + '-count').textContent = control.value.length + '/' + control.maxLength; }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const changes = String(data.get('changes') || '').trim();
    const changeReason = String(data.get('changeReason') || '').trim();
    if (!changes || !changeReason) { const box = document.getElementById('twist-errors'); box.className = 'error-box'; box.textContent = 'Explica los cambios y por qué responden al giro antes de avanzar.'; return; }
    const mission = currentMission();
    mission.solution.changes = changes;
    mission.solution.changeReason = changeReason;
    game.missions[mission.index] = mission;
    saveGame(game);
    setRoute('rubric');
  });
}

function renderRubric() {
  const mission = currentMission();
  if (!mission?.solution.changes) return renderTwist();
  const rows = RUBRIC.filter((item) => !item.groupOnly || game.config.mode !== 'individual').map((item) => '<fieldset class="rubric-row"><legend class="sr-only">' + item.label + '</legend><div class="rubric-heading"><strong aria-hidden="true">' + item.label + '</strong><span class="subtle">1 a 5</span></div><div class="rating">' + item.help.map((description, index) => '<label title="' + description + '"><input type="radio" name="score-' + item.id + '" value="' + (index + 1) + '" required><span>' + (index + 1) + '</span></label>').join('') + '</div><p class="rating-description" id="description-' + item.id + '">Selecciona una valoración para leer su descripción.</p><label class="field high-score-reason" id="reason-wrap-' + item.id + '" hidden><span>¿Qué evidencia justifica esta valoración alta?</span><input name="reason-' + item.id + '" maxlength="180" placeholder="Da un ejemplo breve"></label></fieldset>').join('');
  return '<section class="screen screen-narrow" aria-labelledby="rubric-title">' + renderMissionRoadmap(4) + '<p class="eyebrow">Paso 4 · Mirar y conversar</p><h1 id="rubric-title">¿Cómo quedó la idea?</h1><div class="next-action"><span aria-hidden="true">⭐</span><p><strong>No es un examen.</strong> En cada tarjeta elige del 1 al 5. Pulsa un número para leer qué significa.</p></div><div class="rating-key" aria-label="Guía rápida de puntuación"><span><b>1</b> Apenas empieza</span><span><b>3</b> Va por buen camino</span><span><b>5</b> Está muy bien explicada</span></div><form id="rubric-form" novalidate><div id="rubric-errors" aria-live="assertive"></div><div class="rubric-list">' + rows + '</div><div class="mission-actions"><button type="button" class="button ghost" data-nav="twist">← Revisar el cambio</button><button class="button primary" type="submit">Terminar misión y recuperar núcleo →</button></div></form><p class="subtle center">La Energía Creativa sirve para conversar y mejorar. No es una nota ni una medición científica.</p></section>';
}

function bindRubric() {
  const mission = currentMission();
  const form = document.getElementById('rubric-form');
  RUBRIC.forEach((item) => {
    form.querySelectorAll('[name="score-' + item.id + '"]').forEach((input) => input.addEventListener('change', () => {
      document.getElementById('description-' + item.id).textContent = item.help[Number(input.value) - 1];
      const wrapper = document.getElementById('reason-wrap-' + item.id);
      if (wrapper) { wrapper.hidden = Number(input.value) < 4; wrapper.querySelector('input').required = Number(input.value) >= 4; }
      playTone('select');
    }));
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const active = RUBRIC.filter((item) => !item.groupOnly || game.config.mode !== 'individual');
    const values = {};
    const reasons = {};
    const errors = [];
    active.forEach((item) => {
      const score = data.get('score-' + item.id);
      if (!score) errors.push('Valora ' + item.label.toLowerCase() + '.');
      else {
        values[item.id] = Number(score);
        const reason = String(data.get('reason-' + item.id) || '').trim();
        if (Number(score) >= 4 && !reason) errors.push('Justifica la valoración alta de ' + item.label.toLowerCase() + '.');
        reasons[item.id] = reason;
      }
    });
    const box = document.getElementById('rubric-errors');
    if (errors.length) { box.className = 'error-box'; box.innerHTML = '<strong>Antes de calcular:</strong><ul>' + errors.map((error) => '<li>' + error + '</li>').join('') + '</ul>'; box.scrollIntoView({ behavior: 'smooth' }); return; }
    const evaluation = calculateEvaluation(values);
    mission.evaluation = { ...evaluation, reasons };
    mission.energy = evaluation.energy;
    mission.badge = chooseBadge(evaluation.scores, mission.index);
    mission.recommendation = recommendationFor(evaluation.scores);
    mission.completedAt = new Date().toISOString();
    game = completeMission(game, mission);
    saveGame(game);
    playTone('core');
    setRoute('missionResult');
  });
}

function renderMissionResult() {
  const mission = game?.missions[game.currentMission - 1];
  if (!mission?.completedAt) return renderMap();
  const low = mission.energy < 60;
  return '<section class="screen screen-narrow result-hero" aria-labelledby="result-title">' + renderMissionRoadmap(5) + '<p class="eyebrow">Paso 5 · Sistema ' + mission.zone.system + ' recuperado</p><div class="core-earned" aria-hidden="true">' + mission.zone.icon + '</div><h1 id="result-title">¡Lo lograron!</h1><p class="lead">Recuperaron un Núcleo de Ingenio con <strong>' + escapeHtml(mission.solution.name) + '</strong>.</p><div class="energy-meter"><span class="energy-number">' + mission.energy + '</span><span>/100 de Energía Creativa</span><div class="progress-bar" aria-label="Energía de la misión"><span style="--progress:' + mission.energy + '%"></span></div></div><div class="badge-earned"><b aria-hidden="true">' + mission.badge.icon + '</b><span><small>Nueva insignia</small><strong>' + mission.badge.name + '</strong></span></div><article class="card reflection-card"><h2>Lo que hicieron bien</h2><p>' + (low ? 'Se atrevieron a crear una primera versión. Eso ya es importante. Ahora pueden volver y hacerla más clara o más útil.' : 'Imaginaron varias opciones, eligieron una, la explicaron y pudieron cambiarla cuando apareció una sorpresa.') + '</p><p><strong>Reto para la próxima:</strong> ' + mission.recommendation + '</p></article><div class="button-row" style="justify-content:center">' + (low ? '<button class="button ghost" id="improve-solution">Quiero mejorar mi invento</button>' : '') + '<button class="button primary" id="continue-expedition">' + (game.completed ? 'Ver el final de la historia' : 'Ir a la siguiente zona →') + '</button></div></section>';
}

function bindMissionResult() {
  document.getElementById('continue-expedition')?.addEventListener('click', () => setRoute(game.completed ? 'final' : 'map'));
  document.getElementById('improve-solution')?.addEventListener('click', () => {
    game.currentMission -= 1;
    game.completed = false;
    saveGame(game);
    setRoute('builder');
  });
}

function renderFinal() {
  if (!game?.completed) return renderMap();
  const averages = aggregateScores(game.missions);
  const scoreCards = RUBRIC.filter((item) => averages[item.id]).map((item) => '<div class="score-card"><strong>' + averages[item.id] + '</strong><span>' + item.label + '</span></div>').join('');
  const badges = game.missions.map((mission) => '<span class="badge-earned"><b>' + mission.badge.icon + '</b><span>' + mission.badge.name + '</span></span>').join('');
  const solutions = game.missions.map((mission) => '<li><strong>' + escapeHtml(mission.solution.name) + '</strong> · ' + mission.zone.name + '<br><span class="subtle">Cambio: ' + escapeHtml(mission.solution.changes) + '</span></li>').join('');
  return '<section class="screen screen-narrow" aria-labelledby="final-title"><div class="result-hero"><p class="eyebrow">Expedición completada</p><div class="core-earned" aria-hidden="true">✦</div><h1 id="final-title">La Asteria puede volver a casa</h1><p class="lead">Tripulación <strong>' + escapeHtml(game.config.crewName) + '</strong>: recuperaron ' + game.missionCount + ' Núcleos de Ingenio con ideas responsables y bien explicadas.</p></div><div class="card"><div class="score-grid"><div class="score-card"><strong>' + game.missions.length + '</strong><span>Misiones</span></div><div class="score-card"><strong>' + game.totalEnergy + '</strong><span>Energía total</span></div><div class="score-card"><strong>' + elapsedMinutes(game) + '</strong><span>Minutos aprox.</span></div><div class="score-card"><strong>' + game.config.players.length + '</strong><span>Participantes</span></div></div><h2>Dimensiones creativas</h2><div class="score-grid">' + scoreCards + '</div><h2>Insignias</h2><div class="badge-grid">' + badges + '</div></div><article class="card"><h2>Soluciones de la expedición</h2><ol>' + solutions + '</ol></article><div class="final-message"><h2>Una idea nunca termina en su primera versión</h2><p>Diferentes respuestas pueden ser válidas cuando están bien explicadas, son útiles y cuidan a quienes comparten el planeta. La creatividad también consiste en escuchar, cambiar y volver a intentar.</p></div><article class="card"><h2>Recomendaciones pedagógicas</h2><ul><li>Comparen el primer invento con el último: ¿qué aprendieron sobre combinar recursos?</li><li>Elijan un giro y creen una segunda adaptación posible.</li><li>Conversen sobre la consecuencia de cada solución para Nébula-X.</li></ul></article><div class="button-row"><button class="button primary" id="print-report">Imprimir o guardar PDF</button><button class="button ghost" id="download-html">Descargar informe HTML</button><button class="button ghost" id="download-txt">Descargar texto</button><button class="button secondary" id="new-expedition">Nueva expedición</button></div><p class="subtle">La Energía Creativa es una valoración pedagógica orientativa, no una medición científica definitiva.</p></section>';
}

function bindFinal() {
  document.getElementById('print-report')?.addEventListener('click', () => { if (!openPrintableReport(game)) announce('El navegador bloqueó la ventana del informe. Permite ventanas emergentes e inténtalo de nuevo.'); });
  document.getElementById('download-html')?.addEventListener('click', () => downloadReport(game, 'html'));
  document.getElementById('download-txt')?.addEventListener('click', () => downloadReport(game, 'txt'));
  document.getElementById('new-expedition')?.addEventListener('click', async () => {
    confirmDialog.querySelector('#confirm-title').textContent = '¿Comenzar una nueva expedición?';
    confirmDialog.showModal();
    const result = await new Promise((resolve) => confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue), { once: true }));
    if (result === 'confirm') { clearGame(); game = null; setRoute('story'); }
  });
}

function renderInstructions() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="instructions-title"><p class="eyebrow">Manual de expedición</p><h1 id="instructions-title">Cómo jugar</h1><p class="lead">Misión Nébula no es un cuestionario. Para avanzar deben crear, combinar, explicar, cambiar y evaluar una solución propia.</p><section class="card"><h2>Objetivo</h2><p>Recuperar los cinco Núcleos de Ingenio para reparar la Asteria. En partida rápida se recorren tres zonas.</p></section><section><h2>Secuencia de cada misión</h2><ol><li>Lean el problema y la restricción.</li><li>Examinen los recursos y generen varias ideas.</li><li>Elijan una combinación y describan funciones, pasos y razones.</li><li>Dibujen un boceto.</li><li>Adapten la idea al giro inesperado.</li><li>Usen la rúbrica y justifiquen las valoraciones altas.</li></ol></section><section class="card"><h2>Reglas esenciales</h2><ul><li>Utilicen al menos la cantidad mínima de recursos indicada.</li><li>No agreguen recursos que no estén disponibles.</li><li>Cumplan la restricción y el giro.</li><li>No dañen seres vivos ni el entorno.</li><li>Escuchen todas las propuestas antes de decidir.</li><li>La rapidez no determina la victoria.</li></ul></section><section><h2>Roles que rotan</h2><div class="card-grid">' + ROLES.map((role) => '<article class="card soft info-card"><h3>' + role.name + '</h3><p>' + role.description + '</p></article>').join('') + '</div></section><div class="callout"><strong>Privacidad:</strong> los nombres y las respuestas permanecen en el almacenamiento local de este navegador. No se envían a ningún servicio.</div><div class="button-row"><button class="button primary" data-nav="home">Volver a la portada</button><button class="button ghost" data-nav="teacher">Abrir guía docente</button></div></article>';
}

function renderTeacher() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="teacher-title"><p class="eyebrow">Acompañamiento pedagógico</p><h1 id="teacher-title">Guía para docentes</h1><p class="lead">Una mediación para que estudiantes de 10 a 12 años practiquen fluidez, flexibilidad, originalidad, elaboración, argumentación, colaboración y resolución creativa de problemas.</p><section class="card"><h2>Ficha de aplicación</h2><ul><li><strong>Participantes:</strong> individual, grupos de 2 a 4 o equipos.</li><li><strong>Duración:</strong> 60–90 minutos en cinco misiones; 35–50 en partida rápida.</li><li><strong>Materiales:</strong> dispositivo con navegador; papel y lápiz son opcionales.</li><li><strong>Organización:</strong> un dispositivo por equipo y roles rotativos.</li></ul></section><section><h2>Antes de jugar</h2><ol><li>Explique que no se busca una respuesta predeterminada.</li><li>Organice equipos diversos y acuerde turnos de palabra.</li><li>Lea los roles y permita que quienes requieran apoyo asuman más tiempo o usen comunicación escrita.</li><li>Recuerde que el planeta y sus seres vivos deben cuidarse.</li></ol></section><section class="card"><h2>Procesos creativos</h2><div class="card-grid"><article><h3>Fluidez</h3><p>Producir varias alternativas antes de elegir.</p></article><article><h3>Flexibilidad</h3><p>Cambiar de estrategia frente al giro.</p></article><article><h3>Originalidad</h3><p>Combinar recursos de forma poco habitual.</p></article><article><h3>Elaboración</h3><p>Detallar funciones, pasos y consecuencias.</p></article><article><h3>Argumentación</h3><p>Explicar por qué la propuesta puede funcionar.</p></article><article><h3>Colaboración</h3><p>Integrar aportes, escuchar y revisar juntos.</p></article></div></section><section><h2>Uso de la rúbrica</h2><p>La rúbrica se completa después de adaptar la idea. Pida evidencias concretas y trate la Energía Creativa como orientación pedagógica, nunca como diagnóstico. Una valoración baja abre una oportunidad de revisión.</p><p>Para evitar un simple concurso, no compare equipos por velocidad ni premie solo la puntuación. Destaque procesos diferentes: una buena pregunta, una combinación inesperada, un cambio bien razonado o una decisión ambiental responsable.</p></section><section class="card"><h2>Preguntas de reflexión</h2><ul><li>¿Qué parte de la solución fue más original?</li><li>¿Qué cambió cuando apareció la nueva condición?</li><li>¿Qué otra solución habría sido posible?</li><li>¿Cómo se combinaron las ideas del equipo?</li><li>¿Qué recurso tuvo el uso más inesperado?</li><li>¿Cómo se podría mejorar el invento?</li><li>¿Qué consecuencias tendría la solución para el planeta?</li></ul></section><section><h2>Adaptaciones y accesibilidad</h2><ul><li>Lea los retos en voz alta o permita respuesta dictada a una persona del equipo.</li><li>Reduzca el número de campos en una aplicación oral y use el juego para registrar acuerdos.</li><li>Active texto grande, alto contraste o reducción de movimiento.</li><li>Amplíe el tiempo y divida la misión en momentos cortos.</li><li>Permita bocetos físicos y fotografíelos solo fuera de la aplicación si el grupo lo decide.</li></ul></section><section class="callout"><h2>Después de jugar</h2><p>Abra los resultados finales, use “Imprimir o guardar PDF” y conduzca una conversación sobre decisiones, cambios y efectos ambientales. También puede descargar el informe HTML o de texto.</p></section><div class="button-row"><a class="button secondary" href="informe-actividad-1.html">Ver documento académico</a><button class="button primary" data-nav="home">Volver</button></div></article>';
}

function renderCredits() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="credits-title"><p class="eyebrow">Créditos</p><h1 id="credits-title">Sobre Misión Nébula</h1><div class="card"><h2>Autoría</h2><p class="lead"><strong>Diseñado y desarrollado por Danilo Olarte González.</strong></p><div class="credits-list"><p><strong>Programa</strong><br>Maestría en Educación</p><p><strong>Institución</strong><br>Corporación Universitaria Iberoamericana</p><p><strong>Curso</strong><br>Electiva Creatividad e Innovación Educativa</p><p><strong>Actividad</strong><br>Actividad 1, “Jugando enseño a crear”</p></div></div><section><h2>Creación responsable</h2><p>Concepto, narrativa, interfaz, ilustraciones CSS, programación y contenido pedagógico originales. Los sonidos se sintetizan en el navegador mediante Web Audio API. No se emplean personajes, imágenes, música ni recursos de franquicias externas.</p></section><section class="callout"><h2>Privacidad</h2><p>La aplicación funciona sin cuentas, analítica, publicidad ni servidores. Los datos introducidos se almacenan únicamente en el navegador mediante <code>localStorage</code>.</p></section><div class="button-row"><button class="button primary" data-nav="home">Volver a la portada</button></div></article>';
}

document.querySelectorAll('.site-header [data-nav]').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  setRoute(button.dataset.nav);
}));
document.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', () => settingsDialog.showModal()));
bindSettings(document);
window.addEventListener('storage', () => { game = loadGame(); if (route === 'home') render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('El modo sin conexión no pudo activarse.', error));
}
render();
