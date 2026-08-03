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

function option(value, label, selectedValue) {
  return '<option value="' + escapeHtml(value) + '"' + (value === selectedValue ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
}

function renderGoalTools(learning) {
  const goal = learning.customGoal || {
    mode: 'practice',
    targetAnswers: 8,
    targetAccuracy: 70,
    focusCategory: ''
  };
  const categoryOptions = [option('', 'Selección automática', goal.focusCategory)]
    .concat((learning.categories || []).map((category) => option(category.name, category.name, goal.focusCategory)))
    .join('');
  const modeOptions = [
    option('practice', 'Práctica', goal.mode),
    option('mission', 'Misión', goal.mode),
    option('both', 'Misión y práctica', goal.mode)
  ].join('');

  return '<section class="teacher-learning-tools" aria-labelledby="learning-tools-title"><div class="teacher-learning-tools-heading"><div><p class="eyebrow">Control local</p><h3 id="learning-tools-title">Metas, respaldo y privacidad</h3></div><span>⚙️</span></div><form data-learning-goal-form class="learning-goal-form"><label><span>Aplicar meta en</span><select name="goal-mode">' + modeOptions + '</select></label><label><span>Respuestas objetivo</span><input name="goal-answers" type="number" min="3" max="20" value="' + goal.targetAnswers + '" required></label><label><span>Precisión objetivo</span><span class="learning-percent-input"><input name="goal-accuracy" type="number" min="50" max="100" value="' + goal.targetAccuracy + '" required><b>%</b></span></label><label><span>Tema prioritario</span><select name="goal-focus">' + categoryOptions + '</select></label><div class="learning-goal-actions"><button class="button primary" type="submit">Guardar meta</button><button class="button ghost" type="button" data-reset-learning-goal>Usar meta automática</button></div></form><label class="learning-tracking-toggle"><input type="checkbox" data-learning-tracking' + (learning.longitudinalTracking ? ' checked' : '') + '><span><strong>Seguimiento longitudinal ampliado</strong><small>Desactivado por defecto. Al activarlo, este navegador conserva hasta 60 sesiones; al desactivarlo vuelve a guardar solo 12.</small></span></label><div class="learning-export-actions"><button class="button secondary" type="button" data-export-learning-json>⬇️ Exportar reporte JSON</button><button class="button secondary" type="button" data-export-learning-csv>📊 Exportar CSV</button><button class="button secondary" type="button" data-backup-learning>🛟 Respaldar perfil activo</button><button class="button secondary" type="button" data-backup-learning-device>🗂️ Respaldar todos los perfiles</button><button class="button secondary" type="button" data-print-learning-report>🖨️ Imprimir reporte</button></div><label class="learning-import-control"><span><strong>Importar respaldo del perfil activo</strong><small>Selecciona un archivo JSON creado por Misión Nébula. Reemplazará únicamente el progreso pedagógico de este piloto.</small></span><input type="file" accept="application/json,.json" data-import-learning></label><p class="teacher-learning-privacy">🔒 Estos datos permanecen en este navegador. Los perfiles se separan por apodo y no se envían a la Liga Galáctica ni a Supabase.</p><p class="learning-integrity-note">Las sumas de integridad detectan daños accidentales en los archivos; no funcionan como firma digital ni prueba de autoría.</p><p class="learning-tools-status" data-learning-tools-status role="status" aria-live="polite"></p></section>';
}

function profileFallback(learning) {
  return [{
    id: learning.profileId || 'local',
    pilotName: learning.profileName || 'Piloto local',
    active: true,
    updatedAt: '',
    attempts: Number(learning.attempts) || 0,
    accuracy: Number(learning.accuracy) || 0,
    bestStreak: Number(learning.bestStreak) || 0,
    sessions: Number(learning.sessionCount) || 0,
    goalRate: 0,
    focusCategory: learning.focus?.[0]?.name || ''
  }];
}

function renderProfileRows(learning) {
  const profiles = Array.isArray(learning.availableProfiles) && learning.availableProfiles.length
    ? learning.availableProfiles
    : profileFallback(learning);
  return profiles.map((profile) => {
    const name = escapeHtml(profile.pilotName || 'Piloto local');
    const id = escapeHtml(profile.id || '');
    const focus = profile.focusCategory ? escapeHtml(profile.focusCategory) : 'Sin evidencia';
    const updated = profile.updatedAt ? escapeHtml(formatSessionDate(profile.updatedAt)) : 'Sin actividad guardada';
    const action = profile.active
      ? '<span class="learning-profile-active">Perfil activo</span>'
      : '<button class="button danger learning-profile-delete" type="button" data-delete-learning-profile="' + id + '" data-learning-profile-name="' + name + '">Eliminar</button>';
    return '<tr' + (profile.active ? ' class="learning-profile-row-active"' : '') + '><th scope="row"><strong>' + name + '</strong><small>' + updated + '</small></th><td>' + (Number(profile.attempts) || 0) + '</td><td>' + (Number(profile.accuracy) || 0) + '%</td><td>' + (Number(profile.sessions) || 0) + '</td><td>' + (Number(profile.goalRate) || 0) + '%</td><td>' + focus + '</td><td>' + action + '</td></tr>';
  }).join('');
}

function renderProfileAdministration(learning) {
  return '<section class="learning-profile-administration" aria-labelledby="learning-profiles-title"><div class="learning-profile-administration-heading"><div><p class="eyebrow">Este dispositivo</p><h3 id="learning-profiles-title">Perfiles pedagógicos locales</h3></div><span aria-hidden="true">👥</span></div><p>La comparación describe actividad y tendencias; no ordena estudiantes ni convierte los resultados en calificaciones.</p><div class="teacher-table-wrap"><table class="learning-profile-table"><thead><tr><th>Perfil</th><th>Respuestas</th><th>Precisión</th><th>Sesiones</th><th>Metas</th><th>Refuerzo</th><th>Acción</th></tr></thead><tbody>' + renderProfileRows(learning) + '</tbody></table></div><small>Para proteger el progreso en uso, el perfil activo no se puede eliminar. Cambia de piloto antes de borrar ese perfil.</small></section>';
}

function renderTrend(learning) {
  if (!learning.longitudinalTracking) {
    return '<section class="learning-trend learning-trend-off"><h3>Tendencia longitudinal</h3><p>La retención ampliada está desactivada. El juego conserva únicamente las 12 sesiones recientes.</p></section>';
  }
  const trend = learning.trend || {};
  if (!trend.available) {
    return '<section class="learning-trend"><h3>Tendencia longitudinal</h3><p>' + escapeHtml(trend.text || 'Se necesitan más sesiones para observar una tendencia.') + '</p></section>';
  }
  const icon = trend.direction === 'improving' ? '📈' : trend.direction === 'declining' ? '🧩' : '➡️';
  return '<section class="learning-trend"><div><span aria-hidden="true">' + icon + '</span><div><h3>Tendencia longitudinal</h3><p>' + escapeHtml(trend.text) + '</p></div></div><dl><div><dt>Precisión reciente</dt><dd>' + trend.recentAccuracy + '%</dd></div><div><dt>Cambio</dt><dd>' + (trend.accuracyDelta > 0 ? '+' : '') + trend.accuracyDelta + ' pp</dd></div><div><dt>Metas alcanzadas</dt><dd>' + trend.goalRate + '%</dd></div><div><dt>Sesiones comparadas</dt><dd>' + trend.comparedSessions + '</dd></div></dl><small>Esta lectura describe bloques de sesiones y debe combinarse con observación pedagógica.</small></section>';
}

export function renderTeacherLearningReport({ learning = {}, pilotName = '' } = {}) {
  const name = escapeHtml(pilotName || 'Piloto local');
  const profileName = escapeHtml(learning.profileName || pilotName || 'Piloto local');
  const profileCount = Math.max(1, Number(learning.profileCount) || 1);
  const goal = learning.goal?.text ? escapeHtml(learning.goal.text) : 'Responder algunos portales para establecer una meta personalizada.';
  const strength = learning.strength ? escapeHtml(learning.strength.name + ' · ' + learning.strength.accuracy + '%') : 'Aún sin evidencia suficiente.';
  const focus = (learning.focus || []).length
    ? learning.focus.map((category) => escapeHtml(category.name)).join(', ')
    : 'Aún sin evidencia suficiente.';

  return '<section class="teacher-learning-report" aria-labelledby="teacher-learning-title"><div class="teacher-learning-heading"><div><p class="eyebrow">Lectura pedagógica local</p><h2 id="teacher-learning-title">Progreso de ' + name + '</h2></div></div><p class="learning-profile-context">👤 Perfil pedagógico activo: <strong>' + profileName + '</strong> · ' + profileCount + (profileCount === 1 ? ' perfil guardado' : ' perfiles guardados') + ' en este dispositivo.</p><div class="teacher-learning-metrics"><span><small>Respuestas</small><strong>' + (learning.attempts || 0) + '</strong></span><span><small>Aciertos</small><strong>' + (learning.accuracy || 0) + '%</strong></span><span><small>Mejor racha</small><strong>' + (learning.bestStreak || 0) + '</strong></span><span><small>Sesiones</small><strong>' + (learning.sessionCount || 0) + '</strong></span></div><div class="teacher-learning-summary"><p><strong>Fortaleza observada:</strong> ' + strength + '</p><p><strong>Temas de refuerzo:</strong> ' + focus + '</p><p><strong>Meta vigente:</strong> ' + goal + (learning.goal?.custom ? ' <em>(personalizada)</em>' : ' <em>(automática)</em>') + '</p></div>' + renderGoalTools(learning) + renderProfileAdministration(learning) + renderTrend(learning) + '<h3>Desempeño acumulado por categoría</h3><div class="teacher-table-wrap"><table><thead><tr><th>Categoría</th><th>Respuestas</th><th>Aciertos</th><th>Lectura</th></tr></thead><tbody>' + renderCategoryRows(learning.categories) + '</tbody></table></div><h3>Sesiones recientes</h3><div class="teacher-table-wrap"><table><thead><tr><th>Fecha</th><th>Modo</th><th>Respuestas</th><th>Aciertos</th><th>Portales</th><th>Meta</th></tr></thead><tbody>' + renderSessionRows(learning.recentSessions) + '</tbody></table></div><div class="callout"><h3>Criterio de uso</h3><p>Interprete tendencias, no resultados aislados. Combine esta lectura con observación del proceso, conversación con el estudiante y actividades del aula. El porcentaje no debe convertirse automáticamente en una calificación.</p></div></section>';
}
