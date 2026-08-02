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
  alternatives: ['Tres posibilidades antes de elegir', 'Escribe al menos tres ideas breves, una por línea. Después desarrolla la que el equipo prefiera.', 500],
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
  return '<section class="screen screen-narrow" aria-labelledby="tutorial-title"><ol class="stepper" aria-label="Progreso de preparación"><li><span class="step-number">✓</span><span>Tripulación</span></li><li class="active"><span class="step-number">2</span><span>Tutorial</span></li><li><span class="step-number">3</span><span>Mapa</span></li></ol><p class="eyebrow">Entrenamiento creativo</p><h1 id="tutorial-title">Cinco movimientos para inventar</h1><p class="lead">Explora cada paso. Después podrás entrar al mapa de Nébula-X.</p><div class="tutorial-layout"><div class="tutorial-nav" role="tablist" aria-label="Pasos del tutorial">' + TUTORIAL_STEPS.map((step, index) => '<button role="tab" aria-selected="' + (index === 0) + '" class="' + (index === 0 ? 'active' : '') + '" data-tutorial-step="' + index + '">' + step[0] + '</button>').join('') + '</div><div id="tutorial-demo" class="tutorial-demo card" role="tabpanel"><div><div class="tutorial-symbol" aria-hidden="true">◉</div><h2>' + TUTORIAL_STEPS[0][0] + '</h2><p class="lead">' + TUTORIAL_STEPS[0][1] + '</p></div></div></div><div class="button-row"><button class="button ghost" data-nav="config">Volver</button><button class="button primary" id="tutorial-finish">Entrar al mapa</button></div></section>';
}

function bindTutorial() {
  const demo = document.getElementById('tutorial-demo');
  const symbols = ['◉', '✦', '⚙', '↝', '◎'];
  document.querySelectorAll('[data-tutorial-step]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.tutorialStep);
    document.querySelectorAll('[data-tutorial-step]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-selected', item === button); });
    demo.innerHTML = '<div><div class="tutorial-symbol" aria-hidden="true">' + symbols[index] + '</div><h2>' + TUTORIAL_STEPS[index][0] + '</h2><p class="lead">' + TUTORIAL_STEPS[index][1] + '</p></div>';
    playTone('select');
  }));
  document.getElementById('tutorial-finish').addEventListener('click', () => setRoute('map'));
}

function renderHud() {
  return '<div class="hud"><div class="progress-wrap"><div class="progress-label"><span>Progreso de la expedición</span><strong>' + game.currentMission + ' de ' + game.missionCount + ' núcleos</strong></div><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + missionProgress(game) + '"><span style="--progress:' + missionProgress(game) + '%"></span></div></div><div class="energy-chip">⚡ ' + game.totalEnergy + ' energía</div></div>';
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
  return '<section class="screen" aria-labelledby="map-title">' + renderHud() + '<p class="eyebrow">Mapa de Nébula-X</p><h1 id="map-title">Ruta de los Núcleos de Ingenio</h1><p class="lead">Las zonas se desbloquean al explicar, adaptar y evaluar cada solución.</p><div class="planet-map">' + nodes + '</div>' + (currentMission ? '<div class="card soft"><h2>Roles para la misión ' + (game.currentMission + 1) + '</h2><p>Los roles rotan automáticamente. Una persona puede tener más de uno.</p><div class="roles-grid">' + roles + '</div></div>' : '') + '<div class="button-row"><button class="button ghost" data-reset-game>Reiniciar progreso</button>' + (game.completed ? '<button class="button primary" data-nav="final">Ver resultados finales</button>' : '') + '</div></section>';
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
  return '<section class="screen" aria-labelledby="mission-title">' + renderHud() + '<div class="mission-header"><div><span class="zone-tag" style="--zone-color:' + mission.zone.color + '">' + mission.zone.icon + ' ' + mission.zone.name + '</span><p class="eyebrow">Misión ' + (mission.index + 1) + ' · Reparar ' + mission.zone.system.toLowerCase() + '</p><h1 id="mission-title">El desafío ha aparecido</h1></div><div class="energy-chip">Usa mínimo ' + mission.minimumResources + ' recursos</div></div><div class="challenge-grid"><article class="card problem-card"><p class="eyebrow">Problema abierto</p><h2>' + mission.problem + '</h2><p>No hay una respuesta única. Generen varias opciones antes de construir la primera propuesta.</p></article><article class="card constraint-card"><p class="eyebrow">Restricción</p><h3>' + mission.restriction + '</h3><p>La solución debe cumplir esta condición desde el inicio.</p></article></div><article class="card soft"><h2>Recursos disponibles</h2><ul class="resource-list">' + mission.resources.map((resource) => '<li class="resource-chip">' + resource + '</li>').join('') + '</ul><p class="subtle">Pueden imaginar un uso diferente al habitual, pero no añadir objetos que no estén en la lista.</p></article><div class="callout"><strong>Pista de la zona:</strong> ' + mission.zone.prompt + '</div><div class="mission-actions"><button class="button ghost" data-nav="map">Volver al mapa</button><button class="button primary" id="start-building">Abrir constructor de soluciones</button></div></section>';
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
  const resources = mission.resources.map((resource) => '<label class="resource-check"><input type="checkbox" name="resource" value="' + resource + '" ' + (solution.selectedResources.includes(resource) ? 'checked' : '') + '><span>' + resource + '</span></label>').join('');
  return '<section class="screen" aria-labelledby="builder-title"><p class="eyebrow">Misión ' + (mission.index + 1) + ' · Primera solución</p><h1 id="builder-title">Laboratorio de inventos</h1><p class="lead">Construyan una idea clara, útil y respetuosa. El boceto no necesita ser perfecto: debe ayudar a explicar.</p><div class="builder-layout"><form id="solution-form" class="card" novalidate><div id="solution-errors" aria-live="assertive"></div>' + textField('alternatives', solution.alternatives) + textField('name', solution.name) + textField('description', solution.description) + textField('solvedProblem', solution.solvedProblem) + '<fieldset class="field"><legend>Recursos utilizados</legend><small>Selecciona al menos ' + mission.minimumResources + '. Después explica la función de cada uno.</small><div class="resource-checks">' + resources + '</div><div id="resource-functions" class="resource-functions"></div></fieldset>' + textField('steps', solution.steps) + textField('reasoning', solution.reasoning) + textField('environment', solution.environment) + '<fieldset class="field"><legend>Boceto del invento</legend><p class="subtle">Dibuja con mouse, lápiz o dedo. El boceto quedará dentro del informe local.</p><div class="canvas-wrap"><canvas id="sketch-canvas" aria-label="Lienzo para dibujar el invento">Tu navegador no permite usar el lienzo de dibujo.</canvas></div><div class="canvas-tools"><label>Grosor <select id="brush-width"><option value="2">Fino</option><option value="4" selected>Medio</option><option value="8">Grueso</option></select></label><button class="button ghost small" type="button" id="undo-sketch">↶ Deshacer</button><button class="button ghost small" type="button" id="clear-sketch">Limpiar</button><button class="button ghost small" type="button" id="download-sketch">Descargar PNG</button></div></fieldset><div class="mission-actions"><button type="button" class="button ghost" data-nav="mission">Revisar misión</button><button class="button primary" type="submit">Registrar primera solución</button></div></form><aside class="card soft mission-aside"><h2>Bitácora de misión</h2><dl><dt>Problema</dt><dd>' + mission.problem + '</dd><dt>Restricción</dt><dd>' + mission.restriction + '</dd><dt>Meta</dt><dd>Usar ' + mission.minimumResources + ' de ' + mission.resources.length + ' recursos como mínimo.</dd></dl><div class="callout"><strong>Recuerda:</strong> explicar por qué puede funcionar es tan importante como imaginarla.</div></aside></div></section>';
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
  form.querySelectorAll('input[maxlength], textarea[maxlength]').forEach((control) => control.addEventListener('input', () => { document.getElementById(control.name + '-count').textContent = control.value.length + '/' + control.maxLength; }));
  const updateFunctions = () => {
    const selected = [...form.querySelectorAll('[name="resource"]:checked')].map((input) => input.value);
    const container = document.getElementById('resource-functions');
    container.innerHTML = selected.map((resource) => '<label class="resource-function"><strong>' + resource + '</strong><input name="function-' + encodeURIComponent(resource) + '" maxlength="160" required placeholder="¿Qué función cumple?" value="' + escapeHtml(mission.solution.resourceFunctions[resource] || '') + '"></label>').join('');
  };
  form.querySelectorAll('[name="resource"]').forEach((input) => input.addEventListener('change', updateFunctions));
  updateFunctions();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const selectedResources = data.getAll('resource');
    const errors = [];
    Object.keys(fieldHelp).forEach((name) => { if (!String(data.get(name) || '').trim()) errors.push('Completa “' + fieldHelp[name][0] + '”.'); });
    const alternatives = String(data.get('alternatives') || '').split(/\r?\n/).map((idea) => idea.trim()).filter(Boolean);
    if (alternatives.length < 3) errors.push('Escribe al menos tres posibilidades, una por línea, antes de elegir.');
    if (selectedResources.length < mission.minimumResources) errors.push('Selecciona al menos ' + mission.minimumResources + ' recursos.');
    const resourceFunctions = {};
    selectedResources.forEach((resource) => {
      const value = String(data.get('function-' + encodeURIComponent(resource)) || '').trim();
      resourceFunctions[resource] = value;
      if (!value) errors.push('Explica la función de ' + resource + '.');
    });
    const box = document.getElementById('solution-errors');
    if (errors.length) { box.className = 'error-box'; box.innerHTML = '<strong>Revisa estos puntos:</strong><ul>' + errors.map((error) => '<li>' + error + '</li>').join('') + '</ul>'; box.scrollIntoView({ behavior: 'smooth' }); announce('Hay campos por completar en la solución.'); return; }
    Object.keys(fieldHelp).forEach((name) => { mission.solution[name] = String(data.get(name)).trim(); });
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
  return '<section class="screen screen-narrow" aria-labelledby="twist-title"><article class="card twist-card"><div class="alert-symbol" aria-hidden="true">!</div><p class="eyebrow">Alerta · Giro inesperado</p><h1 id="twist-title">Las condiciones cambiaron</h1><p class="lead">' + mission.twist + '</p><p>La primera idea sigue siendo valiosa, pero ahora debe transformarse. Cambiar de estrategia es una fortaleza creativa.</p></article><form id="twist-form" class="card"><div id="twist-errors" aria-live="assertive"></div><div class="callout"><strong>Idea inicial:</strong> <span>' + escapeHtml(mission.solution.name) + '</span> · ' + escapeHtml(mission.solution.description) + '</div><div class="field"><label for="changes">¿Qué cambios harán en la solución?</label><textarea id="changes" name="changes" maxlength="600" required aria-describedby="changes-help changes-count">' + escapeHtml(mission.solution.changes) + '</textarea><small id="changes-help">Describe qué agregan, quitan, reemplazan o reorganizan.</small><span class="counter" id="changes-count">' + mission.solution.changes.length + '/600</span></div><div class="field"><label for="changeReason">¿Por qué esos cambios responden al giro?</label><textarea id="changeReason" name="changeReason" maxlength="500" required aria-describedby="changeReason-help changeReason-count">' + escapeHtml(mission.solution.changeReason) + '</textarea><small id="changeReason-help">Conecta cada cambio con la nueva condición.</small><span class="counter" id="changeReason-count">' + mission.solution.changeReason.length + '/500</span></div><div class="mission-actions"><button type="button" class="button ghost" data-nav="builder">Volver al invento</button><button class="button primary" type="submit">Guardar mejora y evaluar</button></div></form></section>';
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
  return '<section class="screen screen-narrow" aria-labelledby="rubric-title"><p class="eyebrow">Autoevaluación o coevaluación</p><h1 id="rubric-title">Miren la idea con ojos de inventores</h1><p class="lead">Conversen y elijan una valoración honesta. La energía orienta la reflexión; no mide científicamente la creatividad.</p><form id="rubric-form" novalidate><div id="rubric-errors" aria-live="assertive"></div><div class="rubric-list">' + rows + '</div><div class="mission-actions"><button type="button" class="button ghost" data-nav="twist">Revisar adaptación</button><button class="button primary" type="submit">Calcular Energía Creativa</button></div></form></section>';
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
  return '<section class="screen screen-narrow result-hero" aria-labelledby="result-title"><p class="eyebrow">Sistema ' + mission.zone.system + ' recuperado</p><div class="core-earned" aria-hidden="true">' + mission.zone.icon + '</div><h1 id="result-title">¡Núcleo de Ingenio recuperado!</h1><p class="lead">La solución <strong>' + escapeHtml(mission.solution.name) + '</strong> se adaptó sin abandonar el cuidado de Nébula-X.</p><div class="energy-meter"><span class="energy-number">' + mission.energy + '</span><span>/100 de Energía Creativa</span><div class="progress-bar" aria-label="Energía de la misión"><span style="--progress:' + mission.energy + '%"></span></div></div><div class="badge-earned"><b aria-hidden="true">' + mission.badge.icon + '</b><span><small>Insignia obtenida</small><strong>' + mission.badge.name + '</strong></span></div><article class="card reflection-card"><h2>Retroalimentación de bitácora</h2><p>' + (low ? 'Esta valoración es una invitación a volver a mirar la idea. No es una derrota: las mejores invenciones nacen de varias versiones.' : 'El equipo explicó y transformó su propuesta. La creatividad crece cuando una idea se prueba, se conversa y se mejora.') + '</p><p><strong>Para seguir creciendo:</strong> ' + mission.recommendation + '</p></article><div class="button-row" style="justify-content:center">' + (low ? '<button class="button ghost" id="improve-solution">Revisar y mejorar</button>' : '') + '<button class="button primary" id="continue-expedition">' + (game.completed ? 'Ver resultados finales' : 'Continuar al mapa') + '</button></div></section>';
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
