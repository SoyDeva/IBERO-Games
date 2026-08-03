import { escapeHtml } from '../core/html.js';

export function renderRankingScreen({ snapshot, pilotName = '', seasonName, skins, trails }) {
  const { ranking = [], status: rankingStatus = 'idle', error: rankingError = '' } = snapshot || {};
  const isCurrentPilot = (name) => name?.toLocaleLowerCase('es') === pilotName?.toLocaleLowerCase('es');
  const medals = ['🥇', '🥈', '🥉'];

  const podium = [1, 0, 2].map((index) => {
    const entry = ranking[index];
    const place = index + 1;
    if (!entry) return '<div class="podium-place place-' + place + ' empty"><span>' + medals[index] + '</span><strong>Disponible</strong><small>¡Puede ser tu lugar!</small><i>' + place + '</i></div>';
    const skin = skins[entry.skin] || skins.nebula;
    return '<div class="podium-place place-' + place + (isCurrentPilot(entry.name) ? ' current' : '') + '"><span>' + medals[index] + '</span><b>' + skin.icon + '</b><strong>' + escapeHtml(entry.name) + '</strong><small>' + entry.distance + ' km · ' + entry.correct + ' aciertos</small><i>' + place + '</i></div>';
  }).join('');

  const rows = ranking.map((entry, index) => {
    const skin = skins[entry.skin] || skins.nebula;
    const trail = trails[entry.trail] || trails.pulse;
    return '<li class="ranking-row' + (isCurrentPilot(entry.name) ? ' current' : '') + '"><span class="ranking-position">' + (index < 3 ? medals[index] : index + 1) + '</span><span class="ranking-pilot"><b>' + skin.icon + '</b><span><strong>' + escapeHtml(entry.name) + '</strong><small>' + trail.icon + ' ' + escapeHtml(trail.name) + '</small></span></span><span><strong>' + entry.distance + ' km</strong><small>Distancia</small></span><span><strong>' + entry.checkpoints + '</strong><small>Portales</small></span><span><strong>' + entry.correct + '</strong><small>Aciertos</small></span></li>';
  }).join('');

  const waiting = rankingStatus === 'loading'
    ? '<div class="ranking-empty ranking-loading"><span>🛰️</span><h2>Conectando con la galaxia…</h2><p>Estamos reuniendo los mejores vuelos de todos los dispositivos.</p></div>'
    : rankingStatus === 'error'
      ? '<div class="ranking-empty ranking-error"><span>📡</span><h2>Se perdió la señal espacial</h2><p>' + escapeHtml(rankingError) + '</p><button class="button ghost" type="button" data-refresh-ranking>🔄 Intentar otra vez</button></div>'
      : '<div class="ranking-empty"><span>🪐</span><h2>La galaxia espera a su primera leyenda</h2><p>Completa una misión real para inaugurar esta temporada mundial.</p></div>';

  const onlineStatus = rankingStatus === 'ready' ? '🟢 EN LÍNEA' : rankingStatus === 'error' ? '🔴 SIN SEÑAL' : '🟡 CONECTANDO';

  return '<section class="screen screen-narrow galaxy-ranking" aria-labelledby="ranking-title"><div class="ranking-hero"><div><p class="eyebrow">🌎 Temporada mundial · ' + escapeHtml(seasonName) + '</p><h1 id="ranking-title">Liga Galáctica</h1><p class="lead">Los diez mejores vuelos, sin importar desde qué dispositivo jueguen.</p><span class="league-online-status">' + onlineStatus + '</span></div><div class="season-core" aria-hidden="true"><span>★</span><i></i><i></i></div></div><p class="season-rule"><span>🔄</span><strong>Clasificación justa:</strong> cada actualización abre una temporada nueva y vacía. Los apodos son únicos y solo se conserva el mejor vuelo de cada piloto.</p><div class="space-podium">' + podium + '</div>' + (ranking.length ? '<ol class="ranking-list">' + rows + '</ol>' : waiting) + '<div class="button-row"><button class="button primary launch-button" data-nav="flight" data-mode="mission">🚀 Mejorar mi posición</button><button class="button ghost" type="button" data-refresh-ranking>🔄 Actualizar tabla</button><button class="button shop-button" data-nav="shop">🛸 Visitar Hangar</button><button class="button ghost" data-nav="home">Volver</button></div></section>';
}
