import { createLearningExport } from '../core/learning-export.js';

const MAX_BACKUP_BYTES = 1024 * 1024;

function setStatus(root, message) {
  const status = root?.querySelector?.('[data-learning-tools-status]');
  if (status) status.textContent = message;
}

function downloadLocalFile(file, {
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  const BlobConstructor = windowRef?.Blob || globalThis.Blob;
  if (!documentRef?.createElement || typeof BlobConstructor !== 'function' || !windowRef?.URL?.createObjectURL) {
    throw new Error('Este navegador no permite crear la descarga local.');
  }

  const blob = new BlobConstructor([file.content], { type: file.mime });
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

export function downloadLearningExport({
  progress,
  pilotName = '',
  format = 'json',
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  return downloadLocalFile(createLearningExport(progress, { pilotName, format }), { documentRef, windowRef });
}

export function downloadLearningBackup({
  store,
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  if (!store?.createBackup) throw new Error('No fue posible preparar el respaldo pedagógico.');
  return downloadLocalFile(store.createBackup(), { documentRef, windowRef });
}

export function downloadLearningDeviceBackup({
  store,
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  if (!store?.createDeviceBackup) throw new Error('No fue posible preparar el respaldo consolidado.');
  return downloadLocalFile(store.createDeviceBackup(), { documentRef, windowRef });
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
  const backupButton = root.querySelector('[data-backup-learning]');
  const deviceBackupButton = root.querySelector('[data-backup-learning-device]');
  const importInput = root.querySelector('[data-import-learning]');
  const printReport = root.querySelector('[data-print-learning-report]');
  const deleteProfileButtons = Array.from(root.querySelectorAll?.('[data-delete-learning-profile]') || []);

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

  function backupProgress() {
    try {
      const file = downloadLearningBackup({ store, documentRef, windowRef });
      setStatus(root, 'Respaldo verificable creado para ' + (pilotName || 'el perfil activo') + '.');
      return file;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible crear el respaldo.');
      return null;
    }
  }

  function backupDevice() {
    try {
      const file = downloadLearningDeviceBackup({ store, documentRef, windowRef });
      const count = Number(file.backup?.profileCount) || 0;
      setStatus(root, 'Respaldo consolidado creado con ' + count + (count === 1 ? ' perfil.' : ' perfiles.'));
      return file;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible crear el respaldo consolidado.');
      return null;
    }
  }

  async function importProgress() {
    const file = importInput?.files?.[0];
    if (!file) return null;
    if (Number(file.size) > MAX_BACKUP_BYTES) {
      setStatus(root, 'El respaldo supera el límite de 1 MB.');
      importInput.value = '';
      return null;
    }

    const confirmed = windowRef?.confirm
      ? windowRef.confirm('La importación reemplazará el progreso pedagógico de ' + (pilotName || 'este piloto') + '. ¿Continuar?')
      : true;
    if (!confirmed) {
      setStatus(root, 'Importación cancelada.');
      importInput.value = '';
      return null;
    }

    try {
      const content = await file.text();
      const result = store.importBackup(content);
      importInput.value = '';
      onChanged('Respaldo verificado e importado para ' + result.pilotName + '.');
      return result;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible verificar e importar el respaldo.');
      importInput.value = '';
      return null;
    }
  }

  function deleteProfile(button) {
    const profileId = button?.dataset?.deleteLearningProfile || '';
    const profileName = button?.dataset?.learningProfileName || 'este perfil';
    if (!profileId) return null;
    const confirmed = windowRef?.confirm
      ? windowRef.confirm('¿Eliminar de este dispositivo el perfil pedagógico de ' + profileName + '? Esta acción no borra su cuenta de la Liga y no se puede deshacer sin un respaldo.')
      : true;
    if (!confirmed) {
      setStatus(root, 'Eliminación cancelada.');
      return null;
    }

    try {
      const result = store.removeProfile(profileId);
      onChanged('Perfil pedagógico de ' + result.removed.pilotName + ' eliminado del dispositivo.');
      return result;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible eliminar el perfil pedagógico.');
      return null;
    }
  }

  exportJson?.addEventListener('click', () => exportProgress('json'));
  exportCsv?.addEventListener('click', () => exportProgress('csv'));
  backupButton?.addEventListener('click', backupProgress);
  deviceBackupButton?.addEventListener('click', backupDevice);
  importInput?.addEventListener('change', importProgress);
  printReport?.addEventListener('click', () => windowRef?.print?.());
  deleteProfileButtons.forEach((button) => button.addEventListener('click', () => deleteProfile(button)));

  return Object.freeze({
    bound: Boolean(goalForm || resetGoal || tracking || exportJson || exportCsv || backupButton || deviceBackupButton || importInput || printReport || deleteProfileButtons.length),
    exportProgress,
    backupProgress,
    backupDevice,
    importProgress,
    deleteProfile
  });
}
