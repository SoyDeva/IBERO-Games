import { createLearningRepairStore } from '../services/learning-repair-store.js';

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

export function bindLearningRepairTools({
  root,
  repairStore = createLearningRepairStore(),
  onChanged = () => {},
  documentRef = globalThis.document,
  windowRef = globalThis.window
} = {}) {
  const downloadButton = root?.querySelector?.('[data-download-learning-repair-original]');
  const applyButton = root?.querySelector?.('[data-apply-learning-repair]');
  if (!downloadButton && !applyButton) return Object.freeze({ bound: false });

  const preview = repairStore.preview();
  let originalDownloaded = false;

  function downloadOriginal() {
    try {
      const file = downloadLocalFile(repairStore.createOriginalFile(), { documentRef, windowRef });
      originalDownloaded = true;
      if (applyButton) {
        applyButton.disabled = false;
        applyButton.setAttribute?.('aria-disabled', 'false');
      }
      setStatus(root, 'Contenido pedagógico original descargado como ' + file.filename + '. Ya puedes confirmar la reparación.');
      return file;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible descargar el contenido original.');
      return null;
    }
  }

  function applyRepair() {
    if (!preview.canRepair) return null;
    if (!originalDownloaded) {
      setStatus(root, 'Descarga primero el contenido original antes de guardar la reparación.');
      return null;
    }
    const confirmed = windowRef?.confirm
      ? windowRef.confirm('La reparación conservará ' + preview.recoveredCount + ' perfiles reconocibles y excluirá ' + preview.droppedCount + ' entradas irreconocibles. El archivo original ya fue descargado. ¿Guardar la versión normalizada?')
      : true;
    if (!confirmed) {
      setStatus(root, 'Reparación cancelada. El contenido local no fue modificado.');
      return null;
    }
    try {
      const result = repairStore.applyRepair(preview.sourceFingerprint, { originalDownloaded });
      onChanged('Reparación pedagógica completada: ' + result.recoveredCount + (result.recoveredCount === 1 ? ' perfil recuperado.' : ' perfiles recuperados.'));
      return result;
    } catch (error) {
      setStatus(root, error?.message || 'No fue posible aplicar la reparación pedagógica.');
      return null;
    }
  }

  downloadButton?.addEventListener('click', downloadOriginal);
  applyButton?.addEventListener('click', applyRepair);

  return Object.freeze({
    bound: true,
    preview,
    downloadOriginal,
    applyRepair
  });
}
