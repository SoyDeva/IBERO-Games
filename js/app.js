import { ZONES, RUBRIC, POWER_OPTIONS, BLUEPRINTS, CARE_OPTIONS, ADAPTATION_OPTIONS, NAME_PARTS, RESOURCE_ICONS } from './data.js';
import { createGame, generateMission, completeMission, missionProgress } from './game.js';
import { loadGame, saveGame, clearGame, hasSavedGame } from './storage.js';
import { calculateEvaluation, chooseBadge, recommendationFor } from './evaluation.js';
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
  return '<section class="screen hero" aria-labelledby="home-title"><div class="hero-copy"><p class="eyebrow">✦ Aventura de inventos</p><h1 id="home-title">Misión Nébula <span>Mezcla. Salva. Celebra.</span></h1><p class="lead">Toca objetos, crea inventos y ayuda a un planeta mágico.</p><div class="button-row"><button class="button primary jumbo" data-nav="new">🚀 ¡Jugar!</button>' + continueButton + '<button class="button ghost" data-nav="instructions">¿Cómo se juega?</button></div><div class="stat-strip" aria-label="Características"><span class="stat-chip">👥 1 a 4</span><span class="stat-chip">👆 Sin escribir</span><span class="stat-chip">🎨 Dibujo opcional</span></div></div><div class="planet-scene" aria-label="Ilustración del planeta Nébula-X y la nave Asteria"><div class="planet"></div><div class="ship"></div></div></section>';
}

function renderStory() {
  return '<section class="screen screen-narrow" aria-labelledby="story-title"><p class="eyebrow">¡Emergencia espacial!</p><h1 id="story-title">La Asteria necesita tu ayuda</h1><div class="story-panel"><div class="story-visual card"><div class="asteria" role="img" aria-label="Nave Asteria averiada"></div></div><div class="card"><p class="lead">Crea inventos para recuperar sus núcleos mágicos.</p><div class="mini-mix" aria-hidden="true"><span>🧩</span><i>+</i><span>✨</span><i>=</i><strong>⬡</strong></div><p class="center">¡Todas las combinaciones pueden sorprender!</p><div class="button-row"><button class="button ghost" data-nav="home">Volver</button><button class="button primary jumbo" data-nav="config">Elegir equipo</button></div></div></div></section>';
}

function renderConfig() {
  return '<section class="screen screen-narrow" aria-labelledby="config-title"><p class="eyebrow center">Dos toques y listo</p><h1 id="config-title">Elige tu tripulación</h1><form id="config-form" class="card tap-config"><fieldset class="field"><legend>Tu insignia</legend><div class="choice-grid"><label class="choice-card"><input type="radio" name="crew" value="Cometas Curiosos" checked><span><strong>☄️ Cometas</strong></span></label><label class="choice-card"><input type="radio" name="crew" value="Estrellas Valientes"><span><strong>⭐ Estrellas</strong></span></label><label class="choice-card"><input type="radio" name="crew" value="Guardianes Cósmicos"><span><strong>🪐 Guardianes</strong></span></label></div></fieldset><fieldset class="field"><legend>¿Cómo juegan?</legend><div class="choice-grid"><label class="choice-card"><input type="radio" name="mode" value="individual" checked><span><strong>🧑 Yo solo</strong></span></label><label class="choice-card"><input type="radio" name="mode" value="collaborative"><span><strong>👥 Con amigos</strong></span></label><label class="choice-card"><input type="radio" name="mode" value="teams"><span><strong>🚀 Por equipos</strong></span></label></div></fieldset><fieldset class="field"><legend>¿Cuánto quieren jugar?</legend><div class="choice-grid"><label class="choice-card"><input type="radio" name="length" value="quick" checked><span><strong>⚡ Rápido</strong><small>3 misiones · 10–15 min.</small></span></label><label class="choice-card"><input type="radio" name="length" value="full"><span><strong>🌟 Aventura</strong><small>5 misiones · 20–30 min.</small></span></label></div></fieldset><div class="button-row" style="justify-content:center"><button type="button" class="button ghost" data-nav="story">Volver</button><button class="button primary jumbo" type="submit">¡Listos!</button></div></form></section>';
}

function bindConfig() {
  const form = document.getElementById('config-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const mode = data.get('mode');
    const count = mode === 'individual' ? 1 : mode === 'collaborative' ? 4 : 2;
    const label = mode === 'teams' ? 'Equipo' : 'Explorador';
    const players = Array.from({ length: count }, (_, index) => label + ' ' + (index + 1));
    const config = { crewName: String(data.get('crew')), mode, modeLabel: modeLabels[mode], length: data.get('length'), players };
    game = createGame(config);
    saveGame(game);
    playTone('select');
    setRoute('tutorial');
  });
}

function renderTutorial() {
  return '<section class="screen screen-narrow happy-tutorial" aria-labelledby="tutorial-title"><p class="eyebrow">Mira, toca y juega</p><h1 id="tutorial-title">Solo tienes que hacer esto</h1><div class="three-step-play"><article><b aria-hidden="true">👀</b><strong>1. Mira</strong><small>Un reto corto.</small></article><article><b aria-hidden="true">🧩</b><strong>2. Mezcla</strong><small>Dos objetos y un poder.</small></article><article><b aria-hidden="true">🏆</b><strong>3. Salva</strong><small>Elige una reparación.</small></article></div><div class="mini-mix" aria-label="Ejemplo: una caja y una cuerda se convierten en un invento"><span>📦</span><i>+</i><span>🪢</span><i>+</i><span>✨</span><i>=</i><strong>🚀</strong></div><p class="center lead">No hay respuestas malas. Prueba combinaciones y diviértete.</p><div class="button-row" style="justify-content:center"><button class="button ghost" data-nav="config">Volver</button><button class="button primary jumbo" id="tutorial-finish">¡Vamos a jugar!</button></div></section>';
}

function bindTutorial() {
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
  const roles = currentMission ? currentMission.roles.map((role) => '<span class="role-pill"><b>' + escapeHtml(role.player) + '</b> · ' + role.name + '</span>').join('') : '';
  return '<section class="screen" aria-labelledby="map-title">' + renderHud() + '<p class="eyebrow">Mapa de Nébula-X</p><h1 id="map-title">Toca el planeta brillante</h1><div class="planet-map">' + nodes + '</div>' + (currentMission ? '<div class="role-strip" aria-label="Roles de esta misión">' + roles + '</div>' : '') + '<div class="button-row"><button class="button ghost small" data-reset-game>Reiniciar</button>' + (game.completed ? '<button class="button primary" data-nav="final">Ver el final</button>' : '') + '</div></section>';
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

function missionIcon(problem) {
  const value = problem.toLowerCase();
  if (value.includes('agua') || value.includes('río')) return '💧';
  if (value.includes('criatura') || value.includes('especie')) return '🐾';
  if (value.includes('energía') || value.includes('solar') || value.includes('luz')) return '☀️';
  if (value.includes('comun') || value.includes('mensaje') || value.includes('señal')) return '📡';
  if (value.includes('puente') || value.includes('camino')) return '🌉';
  if (value.includes('gravedad') || value.includes('flot')) return '🪐';
  if (value.includes('oxígeno') || value.includes('aire')) return '💨';
  if (value.includes('temperatura') || value.includes('frío')) return '🌡️';
  if (value.includes('robot')) return '🤖';
  return '🚀';
}

function renderMission() {
  const mission = currentMission();
  if (!mission) return renderHome();
  return '<section class="screen screen-narrow play-brief" aria-labelledby="mission-title">' + renderHud() + '<span class="zone-tag" style="--zone-color:' + mission.zone.color + '">' + mission.zone.icon + ' Misión ' + (mission.index + 1) + '</span><div class="big-challenge-icon" aria-hidden="true">' + missionIcon(mission.problem) + '</div><p class="step-command center">Tu reto</p><h1 id="mission-title">' + mission.problem + '</h1><div class="rule-bubble"><span aria-hidden="true">⚠️</span><p><strong>Regla:</strong> ' + mission.restriction + '</p></div><div class="object-preview" aria-label="Objetos disponibles">' + mission.resources.map((resource) => '<span title="' + resource + '"><b aria-hidden="true">' + (RESOURCE_ICONS[resource] || '✦') + '</b><small>' + resource + '</small></span>').join('') + '</div><div class="button-row" style="justify-content:center"><button class="button ghost" data-nav="map">Mapa</button><button class="button primary jumbo" id="start-building">¡Jugar!</button></div></section>';
}

function bindMission() {
  document.getElementById('start-building')?.addEventListener('click', () => setRoute('builder'));
}

function suggestedName(mission, offset = 0) {
  const first = NAME_PARTS.first[(mission.index + offset) % NAME_PARTS.first.length];
  const second = NAME_PARTS.second[(mission.problem.length + offset) % NAME_PARTS.second.length];
  return first + second.charAt(0).toUpperCase() + second.slice(1);
}

function mixerPowersFor(mission) {
  const start = (mission.problem.length + mission.index) % POWER_OPTIONS.length;
  return [0, 1, 2].map((offset) => POWER_OPTIONS[(start + offset) % POWER_OPTIONS.length]);
}

function mixerCareFor(mission) {
  const start = mission.index % CARE_OPTIONS.length;
  return [0, 1, 2].map((offset) => CARE_OPTIONS[(start + offset) % CARE_OPTIONS.length]);
}

function renderBuilder() {
  const mission = currentMission();
  if (!mission) return renderHome();
  const solution = mission.solution;
  const powers = mixerPowersFor(mission);
  const careOptions = mixerCareFor(mission);
  const resources = mission.resources.map((resource) => '<label class="mix-resource"><input type="checkbox" name="resource" value="' + resource + '" ' + (solution.selectedResources.includes(resource) ? 'checked' : '') + '><span><b aria-hidden="true">' + (RESOURCE_ICONS[resource] || '✦') + '</b><strong>' + resource + '</strong></span></label>').join('');
  const powerCards = powers.map((power) => '<label class="mix-power"><input type="radio" name="power" value="' + power.id + '" ' + (solution.primaryPower === power.id ? 'checked' : '') + '><span><b aria-hidden="true">' + power.icon + '</b><strong>' + power.label + '</strong></span></label>').join('');
  const careCards = careOptions.map((option) => '<label class="mix-care"><input type="radio" name="care" value="' + option.id + '" ' + (solution.careChoice === option.id ? 'checked' : '') + '><span><b aria-hidden="true">' + option.icon + '</b><strong>' + option.label + '</strong></span></label>').join('');
  return '<section class="screen screen-narrow mix-screen" aria-labelledby="builder-title"><p class="eyebrow center">Mezclador de inventos</p><h1 id="builder-title">Toca y crea</h1><form id="solution-form" class="mix-game" novalidate><div id="solution-errors" aria-live="assertive"></div><section aria-labelledby="pick-two-title"><h2 id="pick-two-title"><span>1</span> Elige dos objetos</h2><div class="mix-resource-grid">' + resources + '</div></section><div class="mix-machine" id="mix-machine"><div class="mix-slots" id="mix-slots"><span>?</span><i>+</i><span>?</span></div><div class="machine-orb" aria-hidden="true">✦</div><div class="mix-power-preview" id="mix-power-preview">Elige un poder</div></div><section aria-labelledby="pick-power-title"><h2 id="pick-power-title"><span>2</span> Elige un poder</h2><div class="mix-power-grid">' + powerCards + '</div></section><section aria-labelledby="pick-care-title"><h2 id="pick-care-title"><span>3</span> Elige un ecoescudo</h2><div class="mix-care-grid">' + careCards + '</div></section><details class="drawing-bonus"><summary>🎨 Dibujar es opcional</summary><div class="canvas-wrap playful-canvas"><canvas id="sketch-canvas" aria-label="Lienzo opcional para dibujar el invento">Tu navegador no permite usar el lienzo.</canvas></div><div class="canvas-tools"><label>Trazo <select id="brush-width"><option value="2">Fino</option><option value="4" selected>Medio</option><option value="8">Grueso</option></select></label><button class="button ghost small" type="button" id="undo-sketch">↶</button><button class="button ghost small" type="button" id="clear-sketch">Limpiar</button></div></details><button class="button primary mega-button" type="submit">⚡ ¡MEZCLAR!</button><button class="button text-button" type="button" data-nav="mission">Ver reto</button></form></section>';
}

function bindBuilder() {
  const mission = currentMission();
  const form = document.getElementById('solution-form');
  sketch = new SketchCanvas(document.getElementById('sketch-canvas'));
  if (mission.solution.drawing) sketch.load(mission.solution.drawing);
  document.getElementById('brush-width').addEventListener('change', (event) => sketch.setWidth(event.target.value));
  document.getElementById('undo-sketch').addEventListener('click', () => sketch.undo());
  document.getElementById('clear-sketch').addEventListener('click', () => sketch.clear());
  const updateMixer = (changedInput) => {
    const checkedResources = [...form.querySelectorAll('[name="resource"]:checked')];
    if (checkedResources.length > 2 && changedInput) {
      changedInput.checked = false;
      playTone('alert');
      announce('Solo necesitas dos objetos.');
    }
    const selected = [...form.querySelectorAll('[name="resource"]:checked')].map((input) => input.value);
    const slots = document.getElementById('mix-slots');
    slots.innerHTML = [0, 1].map((index) => '<span title="' + (selected[index] || 'Vacío') + '">' + (selected[index] ? RESOURCE_ICONS[selected[index]] || '✦' : '?') + '</span>').join('<i>+</i>');
    const powerId = new FormData(form).get('power');
    const power = POWER_OPTIONS.find((item) => item.id === powerId);
    document.getElementById('mix-power-preview').textContent = power ? power.icon + ' ' + power.label : 'Elige un poder';
    document.getElementById('mix-machine').classList.toggle('ready', selected.length === 2 && Boolean(powerId) && Boolean(new FormData(form).get('care')));
  };
  form.querySelectorAll('[name="resource"]').forEach((input) => input.addEventListener('change', () => { updateMixer(input); playTone('select'); }));
  form.querySelectorAll('[name="power"], [name="care"]').forEach((input) => input.addEventListener('change', () => { updateMixer(); playTone('select'); }));
  updateMixer();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const selectedResources = data.getAll('resource');
    const powerId = String(data.get('power') || '');
    const careChoice = String(data.get('care') || '');
    const errors = [];
    if (selectedResources.length !== 2) errors.push('Toca dos objetos.');
    if (!powerId) errors.push('Toca un poder.');
    if (!careChoice) errors.push('Toca un ecoescudo.');
    if (errors.length) {
      const box = document.getElementById('solution-errors');
      box.className = 'error-box';
      box.textContent = errors.join(' ');
      box.scrollIntoView({ behavior: 'smooth' });
      playTone('alert');
      return;
    }
    const power = POWER_OPTIONS.find((item) => item.id === powerId);
    const care = CARE_OPTIONS.find((item) => item.id === careChoice);
    const powerIndex = POWER_OPTIONS.findIndex((item) => item.id === powerId);
    const secondPower = POWER_OPTIONS[(powerIndex + 1) % POWER_OPTIONS.length];
    const blueprint = BLUEPRINTS[powerIndex % BLUEPRINTS.length];
    const name = suggestedName(mission, powerIndex);
    const powers = { [selectedResources[0]]: power.id, [selectedResources[1]]: secondPower.id };
    const resourceFunctions = {
      [selectedResources[0]]: selectedResources[0] + ' sirve para ' + power.phrase + '.',
      [selectedResources[1]]: selectedResources[1] + ' sirve para ' + secondPower.phrase + '.'
    };
    mission.solution.name = name;
    mission.solution.blueprintId = blueprint.id;
    mission.solution.powers = powers;
    mission.solution.primaryPower = powerId;
    mission.solution.reasonChoices = [];
    mission.solution.careChoice = careChoice;
    mission.solution.optionalDetail = '';
    mission.solution.alternatives = mixerPowersFor(mission).map((item) => item.label).join('\n');
    mission.solution.description = name + ' mezcla ' + selectedResources.join(' y ') + ' con el poder de ' + power.label.toLowerCase() + '. ' + blueprint.description;
    mission.solution.solvedProblem = 'Ayuda a resolver este reto: ' + mission.problem;
    mission.solution.selectedResources = selectedResources;
    mission.solution.resourceFunctions = resourceFunctions;
    mission.solution.steps = '1. Combinar ' + selectedResources.join(', ') + '. 2. Activar sus funciones: ' + Object.values(resourceFunctions).join(' ') + ' 3. Probar el invento respetando esta regla: ' + mission.restriction;
    mission.solution.reasoning = 'Puede funcionar porque combina dos objetos para ' + power.phrase + '.';
    mission.solution.environment = 'Cuida Nébula-X porque ' + care.phrase + '.';
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
  const start = (mission.index * 2) % ADAPTATION_OPTIONS.length;
  const options = [ADAPTATION_OPTIONS[start], ADAPTATION_OPTIONS[(start + 1) % ADAPTATION_OPTIONS.length]];
  const adaptations = options.map((option) => '<label class="rescue-pick"><input type="radio" name="adaptation" value="' + option.id + '"><span><b aria-hidden="true">' + option.icon + '</b><strong>' + option.label + '</strong><small>Tocar</small></span></label>').join('');
  return '<section class="screen screen-narrow rescue-screen" aria-labelledby="twist-title"><p class="eyebrow center">¡Sorpresa!</p><div class="surprise-orb" aria-hidden="true">⚡</div><h1 id="twist-title">' + mission.twist + '</h1><p class="center lead">¿Cómo salvarás <strong>' + escapeHtml(mission.solution.name) + '</strong>?</p><form id="twist-form"><div class="rescue-grid">' + adaptations + '</div><button type="button" class="button text-button" data-nav="builder">Volver al mezclador</button></form></section>';
}

function bindTwist() {
  const form = document.getElementById('twist-form');
  form.querySelectorAll('[name="adaptation"]').forEach((input) => input.addEventListener('change', () => {
    const adaptationId = input.value;
    const adaptedResource = currentMission().solution.selectedResources[0];
    const mission = currentMission();
    const adaptation = ADAPTATION_OPTIONS.find((item) => item.id === adaptationId);
    mission.solution.adaptationChoice = adaptationId;
    mission.solution.adaptedResource = adaptedResource;
    mission.solution.changes = 'Cambiamos ' + adaptedResource + ' para ' + adaptation.phrase + '.';
    mission.solution.changeReason = 'Este cambio ayuda a que ' + mission.solution.name + ' siga funcionando después de esta sorpresa: ' + mission.twist;
    game.missions[mission.index] = mission;
    saveGame(game);
    input.closest('.rescue-pick').classList.add('chosen');
    playTone('alert');
    window.setTimeout(() => setRoute('rubric'), 450);
  }));
}

function renderRubric() {
  const mission = currentMission();
  if (!mission?.solution.changes) return renderTwist();
  const moods = [
    { score: 3, emoji: '🙂', label: '¡Lo intentamos!' },
    { score: 4, emoji: '😄', label: '¡Funcionó!' },
    { score: 5, emoji: '🤩', label: '¡Fue genial!' }
  ];
  return '<section class="screen screen-narrow mood-screen" aria-labelledby="rubric-title"><p class="eyebrow center">Último toque</p><h1 id="rubric-title">¿Cómo se sintieron?</h1><div class="mood-grid">' + moods.map((mood) => '<label class="mood-pick"><input type="radio" name="mood" value="' + mood.score + '"><span><b aria-hidden="true">' + mood.emoji + '</b><strong>' + mood.label + '</strong></span></label>').join('') + '</div><p class="center subtle">No es una nota. Solo elige una cara.</p></section>';
}

function bindRubric() {
  const mission = currentMission();
  document.querySelectorAll('[name="mood"]').forEach((input) => input.addEventListener('change', () => {
    const score = Number(input.value);
    const active = RUBRIC.filter((item) => !item.groupOnly || game.config.mode !== 'individual');
    const values = Object.fromEntries(active.map((item) => [item.id, score]));
    const reasons = Object.fromEntries(active.map((item) => [item.id, 'Autoevaluación rápida elegida por la tripulación.']));
    const evaluation = calculateEvaluation(values);
    mission.evaluation = { ...evaluation, reasons, quickMood: score };
    mission.energy = evaluation.energy;
    mission.badge = chooseBadge(evaluation.scores, mission.index);
    mission.recommendation = recommendationFor(evaluation.scores);
    mission.completedAt = new Date().toISOString();
    game = completeMission(game, mission);
    saveGame(game);
    input.closest('.mood-pick').classList.add('chosen');
    playTone('core');
    window.setTimeout(() => setRoute('missionResult'), 450);
  }));
}

function renderMissionResult() {
  const mission = game?.missions[game.currentMission - 1];
  if (!mission?.completedAt) return renderMap();
  const power = POWER_OPTIONS.find((item) => item.id === mission.solution.primaryPower) || POWER_OPTIONS[0];
  const adaptation = ADAPTATION_OPTIONS.find((item) => item.id === mission.solution.adaptationChoice) || ADAPTATION_OPTIONS[0];
  const resourceIcons = mission.solution.selectedResources.map((resource) => '<span><b aria-hidden="true">' + (RESOURCE_ICONS[resource] || '✦') + '</b><small>' + resource + '</small></span>').join('<i>+</i>');
  return '<section class="screen screen-narrow win-screen" aria-labelledby="result-title"><div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><p class="eyebrow center">¡Misión superada!</p><div class="core-earned" aria-hidden="true">' + mission.zone.icon + '</div><h1 id="result-title">' + escapeHtml(mission.solution.name) + '</h1><div class="invention-formula">' + resourceIcons + '<i>+</i><span><b aria-hidden="true">' + power.icon + '</b><small>' + power.label + '</small></span><i>+</i><span><b aria-hidden="true">' + adaptation.icon + '</b><small>' + adaptation.label + '</small></span></div><div class="reward-row"><span>⚡ ' + mission.energy + '</span><span>' + mission.badge.icon + ' ' + mission.badge.name + '</span><span>⬡ Núcleo</span></div><div class="button-row" style="justify-content:center"><button class="button text-button" id="improve-solution">Volver a mezclar</button><button class="button primary jumbo" id="continue-expedition">' + (game.completed ? '🎉 Ver gran final' : '🚀 Siguiente misión') + '</button></div></section>';
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
  const badges = game.missions.map((mission) => '<span class="badge-earned"><b>' + mission.badge.icon + '</b><span>' + mission.badge.name + '</span></span>').join('');
  const inventions = game.missions.map((mission) => '<span title="' + escapeHtml(mission.solution.name) + '"><b>' + mission.zone.icon + '</b><small>' + escapeHtml(mission.solution.name) + '</small></span>').join('');
  return '<section class="screen screen-narrow win-screen" aria-labelledby="final-title"><div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><p class="eyebrow center">¡Expedición completada!</p><div class="core-earned" aria-hidden="true">🚀</div><h1 id="final-title">¡Salvaron la Asteria!</h1><p class="lead center">' + escapeHtml(game.config.crewName) + ' creó ' + game.missions.length + ' inventos increíbles.</p><div class="invention-formula final-inventions">' + inventions + '</div><div class="reward-row"><span>⚡ ' + game.totalEnergy + '</span><span>⬡ ' + game.missionCount + ' núcleos</span></div><h2>Insignias desbloqueadas</h2><div class="badge-grid">' + badges + '</div><div class="button-row" style="justify-content:center"><button class="button primary jumbo" id="new-expedition">🎮 Jugar otra vez</button></div><details class="teacher-report-tools"><summary>👩‍🏫 Informe para adultos</summary><div class="button-row"><button class="button ghost" id="print-report">Imprimir o guardar PDF</button><button class="button ghost" id="download-html">Descargar HTML</button><button class="button ghost" id="download-txt">Descargar texto</button></div><p class="subtle">La valoración es orientativa y no constituye una medición científica.</p></details></section>';
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
  return '<article class="screen screen-narrow happy-tutorial" aria-labelledby="instructions-title"><p class="eyebrow center">Así de fácil</p><h1 id="instructions-title">Mira, mezcla y salva</h1><div class="three-step-play"><article><b>👀</b><strong>Mira el reto</strong></article><article><b>🧩</b><strong>Toca dos objetos</strong></article><article><b>✨</b><strong>Elige poderes</strong></article></div><div class="mini-mix" aria-hidden="true"><span>📦</span><i>+</i><span>🪢</span><i>+</i><span>✨</span><i>=</i><strong>🚀</strong></div><p class="lead center">Después salva tu invento con un toque. ¡No tienes que escribir!</p><div class="button-row" style="justify-content:center"><button class="button primary jumbo" data-nav="new">🎮 ¡Jugar!</button><button class="button ghost" data-nav="teacher">Guía para adultos</button></div></article>';
}

function renderTeacher() {
  return '<article class="screen screen-narrow content-page" aria-labelledby="teacher-title"><p class="eyebrow">Acompañamiento pedagógico</p><h1 id="teacher-title">Guía para docentes</h1><p class="lead">Una aventura visual para que estudiantes de 10 a 12 años combinen, decidan y adapten ideas sin llenar formularios.</p><section class="card"><h2>Ficha de aplicación</h2><ul><li><strong>Participantes:</strong> individual, grupos de 2 a 4 o equipos.</li><li><strong>Duración:</strong> 20–30 minutos; partida rápida de 10–15.</li><li><strong>Interacción:</strong> tarjetas grandes y decisiones de un toque.</li><li><strong>Materiales:</strong> dispositivo con navegador; dibujo opcional.</li></ul></section><section><h2>Antes de jugar</h2><ol><li>Diga que no hay combinaciones malas.</li><li>Organice turnos breves para tocar las tarjetas.</li><li>Recuerde que el planeta y sus criaturas deben cuidarse.</li></ol></section><section class="card"><h2>Procesos creativos</h2><div class="card-grid"><article><h3>Originalidad</h3><p>Combinar objetos de forma poco habitual.</p></article><article><h3>Flexibilidad</h3><p>Elegir una reparación ante la sorpresa.</p></article><article><h3>Decisión</h3><p>Comparar opciones visuales y ponerse de acuerdo.</p></article><article><h3>Cuidado</h3><p>Activar un ecoescudo para cada invento.</p></article></div></section><section><h2>Autoevaluación rápida</h2><p>Al final el grupo elige una de tres caras. No es una nota: expresa cómo se sintió. El informe adulto conserva una ficha orientativa generada por el sistema.</p><p>No compare equipos por velocidad o energía. Celebre las combinaciones inesperadas, las reparaciones y las decisiones responsables.</p></section><section class="card"><h2>Conversación opcional</h2><ul><li>¿Qué objeto fue el más divertido?</li><li>¿Qué cambió con la sorpresa?</li><li>¿Qué otra mezcla probarían?</li></ul></section><section><h2>Accesibilidad</h2><ul><li>Lea el reto en voz alta si hace falta.</li><li>Permita participar señalando o tocando.</li><li>Active texto grande, alto contraste o reducción de movimiento.</li></ul></section><section class="callout"><h2>Informe</h2><p>Al terminar, abra “Informe para adultos” para imprimir o descargar el registro generado automáticamente.</p></section><div class="button-row"><a class="button secondary" href="informe-actividad-1.html">Ver documento académico</a><button class="button primary" data-nav="home">Volver</button></div></article>';
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
