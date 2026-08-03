import { escapeHtml } from '../core/html.js';

function renderFocusCategory(category) {
  return '<li><span><strong>' + escapeHtml(category.name) + '</strong><small>' + escapeHtml(category.status) + '</small></span><b>' + category.accuracy + '%</b></li>';
}

function renderRecentSession(session) {
  if (!session) return '';
  const mode = session.mode === 'mission' ? 'Misión' : 'Práctica';
  const status = session.goalReached ? 'Meta alcanzada' : 'Meta en proceso';
  return '<div class="learning-last-session"><span aria-hidden="true">' + (session.goalReached ? '✅' : '🧪') + '</span><p><small>Última sesión · ' + mode + '</small><strong>' + session.correct + '/' + session.answers + ' respuestas · ' + session.accuracy + '%</strong><span>' + status + '</span></p></div>';
}

function renderTrend(summary) {
  if (!summary.longitudinalTracking) return '';
  const trend = summary.trend || {};
  if (!trend.available) return '<p class="learning-mini-trend">📍 Seguimiento ampliado activo · completa otra sesión para comparar.</p>';
  const icon = trend.direction === 'improving' ? '📈' : trend.direction === 'declining' ? '🧩' : '➡️';
  return '<p class="learning-mini-trend">' + icon + ' ' + escapeHtml(trend.text) + '</p>';
}

function renderProfile(summary) {
  const name = escapeHtml(summary.profileName || 'Piloto local');
  return '<p class="learning-profile-chip">👤 Perfil pedagógico: <strong>' + name + '</strong></p>';
}

export function renderLearningProgressPanel(summary = {}) {
  const profile = renderProfile(summary);
  if (!summary.hasData) {
    return '<section class="learning-progress learning-progress-empty" aria-labelledby="learning-progress-title"><div class="learning-progress-heading"><span aria-hidden="true">🧭</span><div><p class="eyebrow">Ruta de aprendizaje</p><h2 id="learning-progress-title">Tu panel pedagógico</h2></div></div>' + profile + '<p>Responde algunos portales y aquí aparecerán tus fortalezas, temas de refuerzo y una recomendación para la siguiente práctica.</p><small>No es una calificación: es una brújula para seguir aprendiendo.</small></section>';
  }

  const focusItems = (summary.focus || []).map(renderFocusCategory).join('');
  const strength = summary.strength
    ? '<p class="learning-strength"><span aria-hidden="true">🌟</span><span><small>Fortaleza destacada</small><strong>' + escapeHtml(summary.strength.name) + ' · ' + summary.strength.accuracy + '%</strong></span></p>'
    : '';
  const goal = summary.goal
    ? '<div class="learning-goal"><span aria-hidden="true">🎯</span><p><small>Próxima meta de práctica' + (summary.goal.custom ? ' · personalizada' : ' · automática') + '</small><strong>' + escapeHtml(summary.goal.text) + '</strong></p></div>'
    : '';
  const recent = renderRecentSession(summary.recentSessions?.[0]);
  const trend = renderTrend(summary);

  return '<section class="learning-progress" aria-labelledby="learning-progress-title"><div class="learning-progress-heading"><span aria-hidden="true">🧭</span><div><p class="eyebrow">Ruta de aprendizaje</p><h2 id="learning-progress-title">Tu panel pedagógico</h2></div></div>' + profile + '<div class="learning-metrics"><span><small>Respuestas</small><strong>' + summary.attempts + '</strong></span><span><small>Aciertos</small><strong>' + summary.accuracy + '%</strong></span><span><small>Mejor racha</small><strong>🔥 ' + summary.bestStreak + '</strong></span></div>' + goal + recent + trend + '<div class="learning-focus"><h3>Temas para reforzar</h3><ul>' + focusItems + '</ul></div>' + strength + '<p class="learning-recommendation">💡 ' + escapeHtml(summary.recommendation || '') + '</p><small class="learning-note">La adaptación es moderada: todas las preguntas del nivel siguen apareciendo antes de repetirse.</small></section>';
}
