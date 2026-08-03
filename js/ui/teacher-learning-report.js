import { escapeHtml } from '../core/html.js';

function formatSessionDate(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

function renderCategoryRows(categories = []) {
  if (!categories.length) return '<tr><td colspan="4">Aún no hay respuestas registradas.</td></tr>';
  return categories.map((category) => '<tr><th scope="row">' + escapeHtml(category.name) + '</th><td>' + category.attempts + '</td><td>' + category.accuracy + '%</td><td>' + escapeHtml(category.status) + '</td></tr>').join('');
}

function renderSessionRows(sessions = []) {
  if (!sessions.length) return '<tr><td colspan="6">Todavía no hay sesiones terminadas con respuestas.</td></tr>';
  return sessions.map((session) => {
    const mode = session.mode === 'mission' ? 'Misión' : 'Práctica';
    return '<tr><td>' + escapeHtml(formatSessionDate(session.completedAt)) + '</td><td>' + mode + '</td><td>' + session.answers + '</td><td>' + session.accuracy + '%</td><td>' + session.checkpoints + '</td><td>' + (session.goalReached ? 'Alcanzada' : 'En proceso') + '</td></tr>';
  }).join('');
}

export function renderTeacherLearningReport({ learning = {}, pilotName = '' } = {}) {
  const name = escapeHtml(pilotName || 'Piloto local');
  const goal = learning.goal?.text ? escapeHtml(learning.goal.text) : 'Responder algunos portales para establecer una meta personalizada.';
  const strength = learning.strength ? escapeHtml(learning.strength.name + ' · ' + learning.strength.accuracy + '%') : 'Aún sin evidencia suficiente.';
  const focus = (learning.focus || []).length
    ? learning.focus.map((category) => escapeHtml(category.name)).join(', ')
    : 'Aún sin evidencia suficiente.';

  return '<section class="teacher-learning-report" aria-labelledby="teacher-learning-title"><div class="teacher-learning-heading"><div><p class="eyebrow">Lectura pedagógica local</p><h2 id="teacher-learning-title">Progreso de ' + name + '</h2></div><button class="button secondary" type="button" data-print-learning-report>🖨️ Imprimir reporte</button></div><p class="teacher-learning-privacy">🔒 Estos datos permanecen en este navegador. No se envían a la Liga Galáctica ni a Supabase.</p><div class="teacher-learning-metrics"><span><small>Respuestas</small><strong>' + (learning.attempts || 0) + '</strong></span><span><small>Aciertos</small><strong>' + (learning.accuracy || 0) + '%</strong></span><span><small>Mejor racha</small><strong>' + (learning.bestStreak || 0) + '</strong></span><span><small>Sesiones</small><strong>' + (learning.sessionCount || 0) + '</strong></span></div><div class="teacher-learning-summary"><p><strong>Fortaleza observada:</strong> ' + strength + '</p><p><strong>Temas de refuerzo:</strong> ' + focus + '</p><p><strong>Meta sugerida:</strong> ' + goal + '</p></div><h3>Desempeño acumulado por categoría</h3><div class="teacher-table-wrap"><table><thead><tr><th>Categoría</th><th>Respuestas</th><th>Aciertos</th><th>Lectura</th></tr></thead><tbody>' + renderCategoryRows(learning.categories) + '</tbody></table></div><h3>Sesiones recientes</h3><div class="teacher-table-wrap"><table><thead><tr><th>Fecha</th><th>Modo</th><th>Respuestas</th><th>Aciertos</th><th>Portales</th><th>Meta</th></tr></thead><tbody>' + renderSessionRows(learning.recentSessions) + '</tbody></table></div><div class="callout"><h3>Criterio de uso</h3><p>Interprete tendencias, no resultados aislados. Combine esta lectura con observación del proceso, conversación con el estudiante y actividades del aula. El porcentaje no debe convertirse automáticamente en una calificación.</p></div></section>';
}
