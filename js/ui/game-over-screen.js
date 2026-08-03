import { escapeHtml } from '../core/html.js';
import { rankingSyncPresentation } from '../core/mission-summary.js';

function metric(value, label, suffix = '') {
  return '<span><b>' + escapeHtml(value) + '</b>' + suffix + '<small>' + escapeHtml(label) + '</small></span>';
}

export function renderGameOverScreen({ documentRef = document, summary, actions = {} }) {
  const overlay = documentRef.getElementById('flight-overlay');
  if (!overlay || !summary) return false;

  const learned = summary.learnedFact
    ? '<div class="learned-fact"><span>💡</span><p><small>HOY APRENDISTE</small><strong>' + escapeHtml(summary.learnedFact) + '</strong></p></div>'
    : '';
  const achievementNote = summary.achievements.length
    ? '<p class="run-achievements">🏅 Desbloqueaste ' + summary.achievements.length + (summary.achievements.length === 1 ? ' logro nuevo' : ' logros nuevos') + '</p>'
    : '';
  const rankingNote = summary.syncRanking
    ? '<p class="ranking-result syncing" id="ranking-result">🛰️ Enviando tu mejor vuelo a la Liga Galáctica…</p>'
    : '';

  overlay.innerHTML = '<div class="overlay-card stranded-card"><div class="stranded-icon" aria-hidden="true">🛰️</div><p class="eyebrow">Bitácora de ' + escapeHtml(summary.pilotName) + '</p><h2>¡Gran intento, piloto!</h2><p>' + escapeHtml(summary.reason) + '</p><div class="flight-summary">'
    + metric(summary.distance, 'Distancia', ' km')
    + metric(summary.correct, 'Respuestas')
    + metric(summary.bestStreak, 'Mejor racha')
    + metric(summary.destroyed, 'Destruidos')
    + metric(summary.checkpoints, 'Portales')
    + metric(summary.best, 'Récord', ' km')
    + metric('+' + summary.crystals + ' 💎', 'Cristales ganados')
    + '</div>' + rankingNote + learned + achievementNote
    + '<div class="summary-actions"><button class="button primary launch-button" id="restart-flight">🚀 Intentar otra vez</button><button class="button ranking-button" id="ranking-after-game">🏆 Clasificación</button><button class="button ghost" id="shop-after-game">🛸 Hangar</button><button class="button ghost" id="practice-after-game">🧪 Practicar</button><button class="button text-button" data-nav="home">Salir</button></div></div>';
  overlay.hidden = false;

  overlay.querySelector('#restart-flight')?.addEventListener('click', actions.restart || (() => {}));
  overlay.querySelector('#practice-after-game')?.addEventListener('click', actions.practice || (() => {}));
  overlay.querySelector('#shop-after-game')?.addEventListener('click', actions.shop || (() => {}));
  overlay.querySelector('#ranking-after-game')?.addEventListener('click', actions.ranking || (() => {}));
  overlay.querySelector('[data-nav]')?.addEventListener('click', actions.exit || (() => {}));
  return true;
}

export function updateGameOverRanking({ documentRef = document, pilotName, position, error, updated }) {
  const note = documentRef.getElementById('ranking-result');
  if (!note) return false;
  const presentation = rankingSyncPresentation({ pilotName, position, error, updated });
  note.classList.remove('syncing');

  if (presentation.status === 'error') {
    note.classList.add('sync-error');
    note.textContent = presentation.text;
  } else if (presentation.status === 'position') {
    note.innerHTML = presentation.prefix + escapeHtml(presentation.pilotName) + ', tu mejor marca ocupa el puesto <strong>#' + presentation.position + '</strong> de la Liga Galáctica mundial.';
  } else {
    note.textContent = presentation.text;
  }
  return true;
}
