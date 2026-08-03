import { escapeHtml } from '../core/html.js';

export function renderStationOffers(offers) {
  return Object.entries(offers).map(([id, offer]) => (
    '<button class="station-offer" type="button" data-station-buy="' + escapeHtml(id)
    + '" data-price="' + Number(offer.price) + '"><span>' + escapeHtml(offer.icon)
    + '</span><strong>' + escapeHtml(offer.name) + '</strong><small>'
    + escapeHtml(offer.description) + '</small><b>💎 ' + Number(offer.price) + '</b></button>'
  )).join('');
}

export function updateStationButtons({ documentRef = document, credits = 0, purchased = false }) {
  documentRef.querySelectorAll('[data-station-buy]').forEach((button) => {
    const price = Number(button.dataset.price);
    button.disabled = purchased || credits < price;
    button.classList.toggle('unaffordable', !purchased && credits < price);
  });
}

export function openStationPanel({ documentRef = document, progress }) {
  const panel = documentRef.getElementById('station-panel');
  if (!panel) return false;
  documentRef.getElementById('station-level').textContent = '✨ NIVEL ' + progress.completedLevel + ' SUPERADO';
  documentRef.getElementById('station-title').textContent = 'Estación Nova-' + progress.completedLevel;
  documentRef.getElementById('station-result').textContent = 'Ganaste acceso a la estación. Elige una ayuda o guarda tus cristales.';
  panel.hidden = false;
  panel.querySelector('button:not([disabled])')?.focus();
  return true;
}

export function setStationResult(message, { documentRef = document } = {}) {
  const result = documentRef.getElementById('station-result');
  if (!result) return false;
  result.textContent = message;
  return true;
}

export function closeStationPanel({ documentRef = document } = {}) {
  const panel = documentRef.getElementById('station-panel');
  if (!panel) return false;
  panel.hidden = true;
  return true;
}
