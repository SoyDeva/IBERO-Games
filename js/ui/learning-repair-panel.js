import { escapeHtml } from '../core/html.js';
import { formatStorageBytes } from '../core/storage-diagnostics.js';

function renderMessages(messages = []) {
  if (!messages.length) return '';
  return '<ul class="learning-repair-messages">' + messages.map((message) => '<li>' + escapeHtml(message) + '</li>').join('') + '</ul>';
}

function renderProfiles(profiles = []) {
  if (!profiles.length) return '<p class="learning-repair-empty">No hay perfiles recuperables para mostrar.</p>';
  return '<div class="teacher-table-wrap"><table class="learning-repair-table"><thead><tr><th>Perfil recuperable</th><th>Respuestas</th><th>Precisión</th><th>Sesiones</th></tr></thead><tbody>' + profiles.map((profile) => {
    const active = profile.active ? ' <span class="learning-profile-active">Activo</span>' : '';
    return '<tr><th scope="row">' + escapeHtml(profile.pilotName || 'Piloto local') + active + '</th><td>' + (Number(profile.attempts) || 0) + '</td><td>' + (Number(profile.accuracy) || 0) + '%</td><td>' + (Number(profile.sessions) || 0) + '</td></tr>';
  }).join('') + '</tbody></table></div>';
}

function statusCopy(status) {
  if (status === 'repairable') return { icon: '🧰', label: 'Reparación disponible' };
  if (status === 'clean') return { icon: '✅', label: 'No requiere reparación' };
  if (status === 'invalid-json') return { icon: '📄', label: 'Original ilegible' };
  return { icon: '⚠️', label: 'Reparación automática no disponible' };
}

export function renderLearningRepairPanel(preview = {}) {
  if (!preview.sourcePresent || preview.status === 'clean') return '';
  const status = statusCopy(preview.status);
  const canRepair = Boolean(preview.canRepair);
  const download = '<button class="button secondary" type="button" data-download-learning-repair-original>⬇️ Descargar contenido original</button>';
  const apply = canRepair
    ? '<button class="button primary" type="button" data-apply-learning-repair disabled aria-disabled="true">🧰 Guardar versión reparada</button>'
    : '';
  const metrics = canRepair
    ? '<dl class="learning-repair-metrics"><div><dt>Entradas originales</dt><dd>' + (Number(preview.sourceEntryCount) || 0) + '</dd></div><div><dt>Perfiles recuperables</dt><dd>' + (Number(preview.recoveredCount) || 0) + '</dd></div><div><dt>Entradas excluidas</dt><dd>' + (Number(preview.droppedCount) || 0) + '</dd></div><div><dt>Tamaño original</dt><dd>' + escapeHtml(formatStorageBytes(preview.sourceBytes)) + '</dd></div></dl>'
    : '<p class="learning-repair-source-size">Tamaño del contenido original: <strong>' + escapeHtml(formatStorageBytes(preview.sourceBytes)) + '</strong>.</p>';

  return '<section class="learning-repair-panel learning-repair-' + escapeHtml(preview.status || 'unavailable') + '" aria-labelledby="learning-repair-title"><div class="learning-repair-heading"><div><p class="eyebrow">Reparación asistida</p><h3 id="learning-repair-title">' + status.label + '</h3></div><span aria-hidden="true">' + status.icon + '</span></div><p>La vista previa no modifica el navegador. El archivo original debe descargarse antes de guardar una versión normalizada.</p>' + metrics + renderMessages(preview.messages) + renderProfiles(preview.profiles) + '<div class="learning-repair-actions">' + download + apply + '</div><p class="learning-integrity-note">La descarga conserva exactamente el contenido original, incluidos campos que el juego no reconoce. Guárdala en un lugar protegido antes de continuar.</p></section>';
}
