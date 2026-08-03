import { escapeHtml } from '../core/html.js';

function renderFocusCategory(category) {
  return '<li><span><strong>' + escapeHtml(category.name) + '</strong><small>' + escapeHtml(category.status) + '</small></span><b>' + category.accuracy + '%</b></li>';
}

export function renderLearningProgressPanel(summary = {}) {
  if (!summary.hasData) {
    return '<section class="learning-progress learning-progress-empty" aria-labelledby="learning-progress-title"><div class="learning-progress-heading"><span aria-hidden="true">🧭</span><div><p class="eyebrow">Ruta de aprendizaje</p><h2 id="learning-progress-title">Tu panel pedagógico</h2></div></div><p>Responde algunos portales y aquí aparecerán tus fortalezas, temas de refuerzo y una recomendación para la siguiente práctica.</p><small>No es una calificación: es una brújula para seguir aprendiendo.</small></section>';
  }

  const focusItems = (summary.focus || []).map(renderFocusCategory).join('');
  const strength = summary.strength
    ? '<p class="learning-strength"><span aria-hidden="true">🌟</span><span><small>Fortaleza destacada</small><strong>' + escapeHtml(summary.strength.name) + ' · ' + summary.strength.accuracy + '%</strong></span></p>'
    : '';

  return '<section class="learning-progress" aria-labelledby="learning-progress-title"><div class="learning-progress-heading"><span aria-hidden="true">🧭</span><div><p class="eyebrow">Ruta de aprendizaje</p><h2 id="learning-progress-title">Tu panel pedagógico</h2></div></div><div class="learning-metrics"><span><small>Respuestas</small><strong>' + summary.attempts + '</strong></span><span><small>Aciertos</small><strong>' + summary.accuracy + '%</strong></span><span><small>Mejor racha</small><strong>🔥 ' + summary.bestStreak + '</strong></span></div><div class="learning-focus"><h3>Temas para reforzar</h3><ul>' + focusItems + '</ul></div>' + strength + '<p class="learning-recommendation">💡 ' + escapeHtml(summary.recommendation || '') + '</p><small class="learning-note">La adaptación es moderada: todas las preguntas del nivel siguen apareciendo antes de repetirse.</small></section>';
}
