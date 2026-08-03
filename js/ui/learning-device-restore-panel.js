import { escapeHtml } from '../core/html.js';

function formatDate(value) {
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

function metricLine(label, metric) {
  if (!metric) return '<p><strong>' + label + ':</strong> no existe en este dispositivo.</p>';
  return '<p><strong>' + label + ':</strong> ' + metric.attempts + ' respuestas · ' + metric.accuracy + '% · ' + metric.sessions + ' sesiones · ' + escapeHtml(formatDate(metric.updatedAt)) + '</p>';
}

function renderProfile(profile) {
  const id = escapeHtml(profile.id);
  const name = escapeHtml(profile.pilotName || 'Piloto local');
  const badges = [profile.active ? '<span class="learning-restore-badge active">Activo</span>' : '', profile.conflict ? '<span class="learning-restore-badge conflict">Coincidencia</span>' : '<span class="learning-restore-badge new">Nuevo</span>'].join('');
  const resolution = profile.conflict
    ? '<label class="learning-restore-resolution"><span>Al aplicar</span><select data-restore-learning-action="' + id + '"><option value="keep" selected>Conservar datos locales</option><option value="replace">Reemplazar con el respaldo</option></select></label>'
    : '<p class="learning-restore-resolution-note">Se añadirá como perfil nuevo.</p>';
  return '<article class="learning-restore-profile"><div class="learning-restore-profile-heading"><label><input type="checkbox" data-restore-learning-profile value="' + id + '" checked><span><strong>' + name + '</strong><small>' + badges + '</small></span></label></div><div class="learning-restore-comparison">' + metricLine('Respaldo', profile.incoming) + metricLine('Local', profile.local) + '</div>' + resolution + '</article>';
}

export function renderLearningDeviceRestorePreview(preview = {}) {
  const profiles = Array.isArray(preview.profiles) ? preview.profiles : [];
  const exportedAt = escapeHtml(formatDate(preview.exportedAt));
  const summary = preview.newProfileCount + (preview.newProfileCount === 1 ? ' perfil nuevo' : ' perfiles nuevos') + ' · ' + preview.conflictCount + (preview.conflictCount === 1 ? ' coincidencia' : ' coincidencias');
  return '<section class="learning-device-restore" aria-labelledby="learning-device-restore-title"><div class="learning-device-restore-heading"><div><p class="eyebrow">Vista previa verificada</p><h4 id="learning-device-restore-title">Restaurar perfiles del dispositivo</h4></div><span aria-hidden="true">🔎</span></div><p>Respaldo del ' + exportedAt + ' · ' + escapeHtml(summary) + '.</p><p class="learning-restore-warning">Revisa cada perfil. La vista previa todavía no modifica ningún dato local.</p><div class="learning-restore-profiles">' + profiles.map(renderProfile).join('') + '</div><div class="learning-restore-actions"><button class="button primary" type="button" data-apply-learning-device-restore>Aplicar selección</button><button class="button ghost" type="button" data-cancel-learning-device-restore>Cancelar</button></div></section>';
}

export function readLearningDeviceRestoreDecisions(root) {
  const checkboxes = Array.from(root?.querySelectorAll?.('[data-restore-learning-profile]') || []);
  return checkboxes.map((checkbox) => {
    const profileId = String(checkbox.value || '').trim();
    if (!checkbox.checked) return { profileId, action: 'skip' };
    const resolution = root.querySelector?.('[data-restore-learning-action="' + profileId + '"]');
    return { profileId, action: resolution?.value || 'add' };
  });
}
