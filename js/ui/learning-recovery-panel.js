import { escapeHtml } from '../core/html.js';

function formatDate(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'hoy';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

export function renderLearningRecoveryPanel(recovery) {
  if (!recovery?.available) return '';
  const label = escapeHtml(recovery.label || 'cambio pedagógico');
  const created = escapeHtml(formatDate(recovery.createdAt));
  return '<aside class="learning-recovery-panel" data-learning-recovery-panel role="status"><div><span aria-hidden="true">↩️</span><div><strong>Punto de recuperación disponible</strong><p>Puedes deshacer la ' + label + ' realizada ' + created + '. La opción desaparecerá si se registra actividad pedagógica posterior o al cumplirse 24 horas.</p></div></div><div class="learning-recovery-actions"><button class="button secondary" type="button" data-undo-learning-change>Deshacer último cambio</button><button class="button ghost" type="button" data-dismiss-learning-recovery>Descartar punto</button></div></aside>';
}

export function mountLearningRecoveryPanel({
  root,
  recovery,
  documentRef = globalThis.document
} = {}) {
  const status = root?.querySelector?.('[data-learning-tools-status]');
  if (!status || !documentRef?.createElement) return null;
  const previous = root.querySelector?.('[data-learning-recovery-panel]');
  previous?.remove?.();
  const html = renderLearningRecoveryPanel(recovery);
  if (!html) return null;
  const wrapper = documentRef.createElement('div');
  wrapper.innerHTML = html;
  const panel = wrapper.firstElementChild;
  if (!panel) return null;
  status.before?.(panel);
  return panel;
}
