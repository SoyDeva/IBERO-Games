import { RUBRIC } from './data.js';
import { aggregateScores } from './evaluation.js';
import { elapsedMinutes } from './game.js';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function missionArticle(mission) {
  const functions = mission.solution.selectedResources.map((resource) => '<li><strong>' + escapeHtml(resource) + ':</strong> ' + escapeHtml(mission.solution.resourceFunctions[resource] || '') + '</li>').join('');
  const scores = RUBRIC.filter((item) => mission.evaluation?.scores[item.id]).map((item) => '<li>' + item.label + ': ' + mission.evaluation.scores[item.id] + '/5</li>').join('');
  const drawing = mission.solution.drawing ? '<img class="report-sketch" src="' + mission.solution.drawing + '" alt="Boceto de ' + escapeHtml(mission.solution.name) + '">' : '<p><em>No se guardó boceto en esta misión.</em></p>';
  return '<article class="report-mission"><h2>Misión ' + (mission.index + 1) + ': ' + escapeHtml(mission.zone.name) + '</h2>' +
    '<p><strong>Problema:</strong> ' + escapeHtml(mission.problem) + '</p><p><strong>Restricción:</strong> ' + escapeHtml(mission.restriction) + '</p>' +
    '<p><strong>Giro inesperado:</strong> ' + escapeHtml(mission.twist) + '</p><h3>' + escapeHtml(mission.solution.name) + '</h3>' +
    '<p><strong>Posibilidades exploradas:</strong><br>' + escapeHtml(mission.solution.alternatives).replace(/\r?\n/g, '<br>') + '</p><p>' + escapeHtml(mission.solution.description) + '</p><p><strong>Problema que resuelve:</strong> ' + escapeHtml(mission.solution.solvedProblem) + '</p>' +
    '<h4>Funciones de los recursos</h4><ul>' + functions + '</ul><p><strong>Pasos:</strong> ' + escapeHtml(mission.solution.steps) + '</p>' +
    '<p><strong>Por qué funcionará:</strong> ' + escapeHtml(mission.solution.reasoning) + '</p><p><strong>Cuidado del planeta:</strong> ' + escapeHtml(mission.solution.environment) + '</p>' +
    '<p><strong>Cambios:</strong> ' + escapeHtml(mission.solution.changes) + '</p><p><strong>Razón del cambio:</strong> ' + escapeHtml(mission.solution.changeReason) + '</p>' +
    drawing + '<h4>Valoración</h4><ul>' + scores + '</ul><p><strong>Energía Creativa:</strong> ' + mission.energy + '/100 · <strong>Insignia:</strong> ' + escapeHtml(mission.badge?.name || '') + '</p></article>';
}

/**
 * Construye un informe autónomo y seguro con los datos de una expedición.
 * @param {object} game Partida completada.
 * @returns {string} Documento HTML listo para imprimir o descargar.
 */
export function buildReportHtml(game) {
  const averages = aggregateScores(game.missions);
  const dimensions = RUBRIC.filter((item) => averages[item.id]).map((item) => '<li>' + item.label + ': ' + averages[item.id] + '/5</li>').join('');
  const players = game.config.players.map(escapeHtml).join(', ');
  const missions = game.missions.map(missionArticle).join('');
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe de expedición · Misión Nébula</title><style>' +
    'body{font-family:Arial,sans-serif;color:#20194d;line-height:1.55;max-width:900px;margin:auto;padding:32px}h1,h2,h3{color:#322574}header{border-bottom:4px solid #7657e8;margin-bottom:28px}.summary{background:#f1edff;padding:18px;border-radius:12px}.report-mission{break-inside:avoid;border-top:2px solid #d7cff8;margin-top:28px;padding-top:16px}.report-sketch{max-width:100%;border:1px solid #aaa}.notice{font-size:.9rem;color:#555}footer{margin-top:40px;border-top:1px solid #aaa;padding-top:12px}@media print{body{padding:0}.no-print{display:none}.report-mission{break-inside:avoid-page}}</style></head><body>' +
    '<header><p>Misión Nébula: Rescate en el planeta desconocido</p><h1>Informe de la experiencia creativa</h1><p>Diseñado y desarrollado por Danilo Olarte González.</p></header>' +
    '<section class="summary"><h2>Tripulación ' + escapeHtml(game.config.crewName) + '</h2><p><strong>Participantes:</strong> ' + players + '</p><p><strong>Modalidad:</strong> ' + escapeHtml(game.config.modeLabel) + '</p><p><strong>Misiones:</strong> ' + game.missions.length + ' · <strong>Tiempo aproximado:</strong> ' + elapsedMinutes(game) + ' minutos · <strong>Energía total:</strong> ' + game.totalEnergy + '</p><h3>Promedio por dimensión</h3><ul>' + dimensions + '</ul></section>' +
    missions + '<section><h2>Reflexión final</h2><p>Una solución siempre puede revisarse y mejorarse. Diferentes respuestas pueden ser válidas cuando son responsables, útiles y están bien explicadas.</p><p><strong>Recomendación pedagógica:</strong> conversen sobre el uso más inesperado de un recurso, el cambio más importante ante un giro y una alternativa que todavía no probaron.</p></section>' +
    '<p class="notice">La Energía Creativa es una valoración pedagógica orientativa; no es una medición científica definitiva de la creatividad.</p><button class="no-print" onclick="window.print()">Imprimir o guardar como PDF</button><footer>Corporación Universitaria Iberoamericana · Maestría en Educación · Electiva Creatividad e Innovación Educativa<br>Diseñado y desarrollado por Danilo Olarte González.</footer></body></html>';
}

export function downloadReport(game, format = 'html') {
  const html = buildReportHtml(game);
  let content = html;
  let type = 'text/html';
  let extension = 'html';
  if (format === 'txt') {
    const documentValue = new DOMParser().parseFromString(html, 'text/html');
    content = documentValue.body.innerText;
    type = 'text/plain';
    extension = 'txt';
  }
  const url = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'informe-mision-nebula.' + extension;
  link.click();
  URL.revokeObjectURL(url);
}

export function openPrintableReport(game) {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return false;
  reportWindow.opener = null;
  reportWindow.document.open();
  reportWindow.document.write(buildReportHtml(game));
  reportWindow.document.close();
  return true;
}
