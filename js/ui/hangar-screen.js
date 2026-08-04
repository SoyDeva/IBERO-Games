import { escapeHtml } from '../core/html.js';

function skinPreviewMarkup(skin) {
  return '<div class="skin-preview" aria-hidden="true" style="--skin-body:' + skin.body + ';--skin-wing:' + skin.wing + ';--skin-glass:' + skin.glass + ';--skin-flame:' + skin.flame + ';--skin-glow:' + skin.glow + '"><i></i><span></span><b></b></div>';
}

function trailPreviewMarkup(trail) {
  return '<div class="trail-preview" aria-hidden="true" style="--trail-one:' + trail.primary + ';--trail-two:' + trail.secondary + '"><span>▲</span><i></i><i></i><i></i><i></i></div>';
}

function perkMarkup(perk, label) {
  if (!perk) return '';
  return '<div class="hangar-perk"><span aria-hidden="true">' + escapeHtml(perk.icon || '✨') + '</span><div><small>' + escapeHtml(label) + '</small><strong>' + escapeHtml(perk.name) + '</strong><p>' + escapeHtml(perk.description) + '</p></div></div>';
}

function catalogAction(kind, id, item, owned, active) {
  if (active) return '<button class="button equipped" type="button" disabled>✓ En uso</button>';
  if (owned) return '<button class="button secondary" type="button" data-equip-item data-kind="' + kind + '" data-item="' + id + '">Usar ahora</button>';
  return '<button class="button primary" type="button" data-buy-item data-kind="' + kind + '" data-item="' + id + '">💎 ' + item.price + ' · Desbloquear</button>';
}

export function renderHangarScreen({ economy, skins, trails, message = '' }) {
  const shipCards = Object.entries(skins).map(([id, skin]) => {
    const owned = economy.ownedSkins.includes(id);
    const active = economy.activeSkin === id;
    const action = catalogAction('skin', id, skin, owned, active);
    return '<article class="skin-card ' + (active ? 'active' : '') + '">' + skinPreviewMarkup(skin) + '<p class="skin-rarity">' + skin.icon + ' NAVE ESPECIAL</p><h2>' + escapeHtml(skin.name) + '</h2><p>' + escapeHtml(skin.description) + '</p>' + perkMarkup(skin.perk, 'HABILIDAD PASIVA') + action + '</article>';
  }).join('');

  const trailCards = Object.entries(trails).map(([id, trail]) => {
    const owned = economy.ownedTrails.includes(id);
    const active = economy.activeTrail === id;
    return '<article class="trail-card ' + (active ? 'active' : '') + '">' + trailPreviewMarkup(trail) + '<div class="trail-card-copy"><p class="skin-rarity">' + trail.icon + ' SISTEMA DE PROPULSIÓN</p><h3>' + escapeHtml(trail.name) + '</h3><p>' + escapeHtml(trail.description) + '</p>' + perkMarkup(trail.perk, 'VENTAJA INSTALADA') + '</div>' + catalogAction('trail', id, trail, owned, active) + '</article>';
  }).join('');

  const activeSkin = skins[economy.activeSkin];
  const activeTrail = trails[economy.activeTrail];
  const statusMessage = message ? '<p class="shop-message" role="status">' + escapeHtml(message) + '</p>' : '';
  const loadoutSummary = '<div class="active-loadout" aria-label="Configuración activa"><span>CONFIGURACIÓN ACTIVA</span><strong>' + escapeHtml(activeSkin?.icon || '🚀') + ' ' + escapeHtml(activeSkin?.name || 'Nébula') + ' + ' + escapeHtml(activeTrail?.icon || '💫') + ' ' + escapeHtml(activeTrail?.name || 'Pulso Nébula') + '</strong><small>Una habilidad de nave y una ventaja de propulsión se combinan durante el vuelo.</small></div>';

  return '<section class="screen screen-narrow orbital-shop" aria-labelledby="shop-title"><div class="hangar-hero"><div class="hangar-satellite" aria-hidden="true">🛰️</div><div><p class="eyebrow">🛸 Centro de tecnología</p><h1 id="shop-title">Hangar Estelar</h1><p class="lead">Combina una nave especial con un sistema útil. Cada elección cambia la forma de sobrevivir a la misión.</p></div><div class="shop-wallet"><span>Tu energía estelar</span><strong>💎 <b data-crystal-balance>' + economy.credits + '</b></strong><small>Sin dinero real</small></div></div>' + statusMessage + loadoutSummary + '<div class="hangar-section-title"><span>🚀</span><div><p>NAVES CON HABILIDAD</p><h2>Escoge tu nave</h2></div><small>' + economy.ownedSkins.length + '/' + Object.keys(skins).length + ' desbloqueadas</small></div><div class="skin-grid">' + shipCards + '</div><div class="hangar-section-title"><span>⚙️</span><div><p>VENTAJAS DE VUELO</p><h2>Sistemas de propulsión</h2></div><small>' + economy.ownedTrails.length + '/' + Object.keys(trails).length + ' desbloqueados</small></div><div class="trail-grid">' + trailCards + '</div><div class="shop-note"><span>💡</span><p><strong>La estrategia ayuda, pero no responde por ti:</strong> las mejoras permiten ahorrar combustible, resistir choques o iniciar con más plasma. Las preguntas, la puntuación y los controles siguen dependiendo del piloto.</p></div><div class="button-row"><button class="button primary" data-nav="flight" data-mode="mission">🚀 Probar mi configuración</button><button class="button ranking-button" data-nav="ranking">🏆 Ver Liga Galáctica</button><button class="button ghost" data-nav="home">Volver</button></div></section>';
}
