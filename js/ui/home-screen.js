import { escapeHtml } from '../core/html.js';
import { renderLearningProgressPanel } from './learning-progress-panel.js';

export function renderHomeScreen({
  best = 0,
  unlocked = [],
  economy,
  activeSkin,
  pilotName = '',
  learned = false,
  achievements = {},
  learning = {}
}) {
  const achievementShelf = Object.entries(achievements).map(([id, achievement]) => '<span class="' + (unlocked.includes(id) ? 'unlocked' : 'locked') + '" title="' + escapeHtml(achievement.title) + '"><b>' + (unlocked.includes(id) ? achievement.icon : '✦') + '</b><small>' + escapeHtml(achievement.title) + '</small></span>').join('');
  const achievementTotal = Object.keys(achievements).length;
  const learningPanel = renderLearningProgressPanel(learning);

  return '<section class="screen flight-home" aria-labelledby="home-title"><div class="flight-home-copy"><p class="eyebrow">🚀 Aventura educativa 2.5D</p><div class="pilot-welcome"><span>👨‍🚀</span><p><small>PILOTO ACTUAL</small><strong>' + escapeHtml(pilotName || 'Sin registrar') + '</strong></p><button type="button" data-change-pilot>' + (pilotName ? 'Cambiar' : 'Registrar') + '</button></div><h1 id="home-title">Pilota la <span>Asteria</span></h1><p class="lead">Esquiva, dispara y supera desafíos de conocimiento en cinco sectores galácticos.</p><div class="mission-formula"><span><b>🕹️</b><small>Esquiva</small></span><i>→</i><span><b>🌀</b><small>Llega</small></span><i>→</i><span><b>🧠</b><small>Responde</small></span><i>→</i><span><b>✨</b><small>Celebra</small></span></div><div class="home-actions"><button class="button primary launch-button" data-nav="flight" data-mode="mission">🚀 Jugar misión</button><button class="button shop-button" data-nav="shop">🛸 Hangar Estelar</button><button class="button ranking-button" data-nav="ranking">🏆 Liga Galáctica</button><button class="button tutorial-button" data-nav="flight" data-mode="tutorial">🎮 ' + (learned ? 'Repetir tutorial' : 'Tutorial de 30 s') + '</button><button class="button ghost" data-nav="flight" data-mode="practice">🧪 Modo práctica</button><button class="button text-button" data-nav="instructions">Ver reglas</button></div><div class="home-records">' + (best ? '<span>🏆 <strong>' + best + '</strong> km</span>' : '<span>🏆 Sin récord aún</span>') + '<span>🏅 <strong>' + unlocked.length + '</strong>/' + achievementTotal + ' logros</span><span class="crystal-chip">💎 <strong data-crystal-balance>' + economy.credits + '</strong> cristales</span></div>' + learningPanel + '<div class="achievement-shelf" aria-label="Logros de la misión">' + achievementShelf + '</div></div><div class="home-orbit" aria-hidden="true" style="--active-body:' + activeSkin.body + ';--active-wing:' + activeSkin.wing + ';--active-glow:' + activeSkin.glow + '"><div class="orbit-planet"></div><div class="orbit-ship">▲<i></i><b>' + activeSkin.icon + '</b></div><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span></div></section>';
}
