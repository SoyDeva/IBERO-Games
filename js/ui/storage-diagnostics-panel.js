import { escapeHtml } from '../core/html.js';

function statusCopy(status) {
  if (status === 'critical') return { label: 'Requiere atención', icon: '⛔' };
  if (status === 'warning') return { label: 'Con advertencias', icon: '⚠️' };
  return { label: 'Almacenamiento correcto', icon: '✅' };
}

function renderIssues(issues = []) {
  if (!issues.length) return '<p class="storage-diagnostic-empty">No se detectaron problemas ni residuos obsoletos.</p>';
  return '<ul class="storage-diagnostic-issues">' + issues.map((issue) => {
    const marker = issue.level === 'critical' ? 'Crítico' : issue.cleanable ? 'Limpiable' : 'Aviso';
    return '<li class="' + escapeHtml(issue.level || 'warning') + '"><strong>' + marker + ':</strong> ' + escapeHtml(issue.message || '') + '</li>';
  }).join('') + '</ul>';
}

export function renderStorageDiagnosticsPanel(diagnostic = {}) {
  const status = statusCopy(diagnostic.status);
  const profileCount = Math.max(0, Number(diagnostic.profileCount) || 0);
  const cleanupCount = Math.max(0, Number(diagnostic.cleanupCount) || 0);
  const damagedProfiles = Math.max(0, Number(diagnostic.damagedProfiles) || 0);
  const action = cleanupCount
    ? '<button class="button secondary" type="button" data-cleanup-learning-storage>🧹 Limpiar ' + cleanupCount + (cleanupCount === 1 ? ' elemento obsoleto' : ' elementos obsoletos') + '</button>'
    : '';
  const guard = diagnostic.status === 'critical'
    ? '<p class="storage-diagnostic-guard">Los respaldos e importaciones quedan bloqueados hasta resolver el problema crítico.</p>'
    : '<p class="storage-diagnostic-guard">La comprobación preventiva permite respaldar y restaurar datos locales.</p>';

  return '<section class="storage-diagnostic storage-diagnostic-' + escapeHtml(diagnostic.status || 'critical') + '" aria-labelledby="storage-diagnostic-title"><div class="storage-diagnostic-heading"><div><p class="eyebrow">Salud del dispositivo</p><h3 id="storage-diagnostic-title">Diagnóstico de almacenamiento local</h3></div><span aria-hidden="true">' + status.icon + '</span></div><p class="storage-diagnostic-status"><strong>' + status.label + '</strong> · ' + escapeHtml(diagnostic.totalText || '0 B') + ' utilizados en este origen.</p><dl class="storage-diagnostic-metrics"><div><dt>Misión Nébula</dt><dd>' + escapeHtml(diagnostic.appText || '0 B') + '</dd></div><div><dt>Datos pedagógicos</dt><dd>' + escapeHtml(diagnostic.learningText || '0 B') + '</dd></div><div><dt>Perfiles válidos</dt><dd>' + profileCount + '</dd></div><div><dt>Perfiles reparables</dt><dd>' + damagedProfiles + '</dd></div><div><dt>Lectura</dt><dd>' + (diagnostic.readable ? 'Disponible' : 'Bloqueada') + '</dd></div><div><dt>Escritura</dt><dd>' + (diagnostic.writable ? 'Disponible' : 'Bloqueada') + '</dd></div></dl>' + renderIssues(diagnostic.issues) + guard + '<div class="storage-diagnostic-actions">' + action + '<button class="button ghost" type="button" data-refresh-learning-storage>↻ Volver a comprobar</button></div><small>La medida es una estimación UTF‑8 del almacenamiento accesible a esta página. La limpieza nunca elimina perfiles pedagógicos válidos.</small></section>';
}
