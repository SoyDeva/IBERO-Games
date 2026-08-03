export function pauseButtonMarkup(paused) {
  return paused
    ? '<span>▶</span><strong>Continuar</strong>'
    : '<span>⏸</span><strong>Pausa</strong>';
}

export function applyPausePanelState({ documentRef = document, paused }) {
  const panel = documentRef.getElementById('pause-panel');
  const button = documentRef.getElementById('pause-flight');
  if (!panel || !button) return false;

  documentRef.querySelector('.flight-page')?.classList.toggle('is-paused', paused);
  panel.hidden = !paused;
  button.innerHTML = pauseButtonMarkup(paused);
  button.setAttribute('aria-label', paused ? 'Continuar vuelo' : 'Pausar vuelo');
  if (paused) documentRef.getElementById('resume-flight')?.focus();
  return true;
}
