import { createLearningExport } from '../core/learning-export.js';

function setStatus(root, message) {
  const status = root?.querySelector?.('[data-learning-tools-status]');
  if (status) status.textContent = message;
}

export function downloadLearningExport({
  progress,
  pilotName = '',
  format = 'json',
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  if (!documentRef?.createElement || typeof Blob !== 'function' || !windowRef?.URL?.createObjectURL) {
    throw new Error('Este navegador no permite crear la descarga local.');
  }

  const file = createLearningExport(progress, { pilotName, format });
  const blob = new Blob([file.content], { type: file.mime });
  const url = windowRef.URL.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = url;
  link.download = file.filename;
  link.hidden = true;
  documentRef.body?.append?.(link);
  link.click();
  link.remove?.();
  windowRef.setTimeout?.(() => windowRef.URL.revokeObjectURL(url), 0);
  return file;
}

export function bindLearningTools({
  root,
  store,
  pilotName = '',
  onChanged = () => {},
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  if (!root?.querySelector || !store) return Object.freeze({ bound: false });

  const goalForm = root.querySelector('[data-learning-goal-form]');
  const resetGoal = root.querySelector('[data-reset-learning-goal]');
  const tracking = root.querySelector('[data-learning-tracking]');
  const exportJson = root.querySelector('[data-export-learning-json]');
  const exportCsv = root.querySelector('[data-export-learning-csv]');

  goalForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(goalForm);
    store.setGoal({
      mode: data.get('goal-mode'),
      targetAnswers: data.get('goal-answers'),
      targetAccuracy: data.get('goal-accuracy'),
      focusCategory: data.get('goal-focus')
    });
    onChanged('Meta personalizada guardada.');
  });

  resetGoal?.addEventListener('click', () => {
    store.resetGoal();
    onChanged('Meta automática restaurada.');
  });

  tracking?.addEventListener('change', () => {
    store.setTracking(Boolean(tracking.checked));
    onChanged(tracking.checked ? 'Seguimiento longitudinal activado.' : 'Seguimiento longitudinal desactivado.');
  });

  function exportProgress(format) {
    try {
      const file = downloadLearningExport({
        progress: store.load(),
        pilotName,
        format,
        documentRef,
        windowRef
      });
      setStatus(root, 'Archivo ' + file.extension.toUpperCase() + ' creado en este dispositivo.');
      return file;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible crear la exportación.');
      return null;
    }
  }

  exportJson?.addEventListener('click', () => exportProgress('json'));
  exportCsv?.addEventListener('click', () => exportProgress('csv'));

  return Object.freeze({
    bound: Boolean(goalForm || resetGoal || tracking || exportJson || exportCsv),
    exportProgress
  });
}