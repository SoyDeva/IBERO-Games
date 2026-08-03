import { escapeHtml } from '../core/html.js';

function skinPreviewMarkup(skin) {
  return '<div class="skin-preview" aria-hidden="true" style="--skin-body:' + skin.body + ';--skin-wing:' + skin.wing + ';--skin-glass:' + skin.glass + ';--skin-flame:' + skin.flame + ';--skin-glow:' + skin.glow + '"><i></i><span></span><b></b></div>';
}

function trailPreviewMarkup(trail) {
  return '<div class="trail-preview" aria-hidden="true" style="--trail-one:' + trail.primary + ';--trail-two:' + trail.secondary + '"><span>▲</span><i></i><i></i><i></i><i></i></div>';
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
    return '<article class="skin-card ' + (active ? 'active' : '') + '">' + skinPreviewMarkup(skin) + '<p class="skin-rarity">' + skin.icon + ' ESTILO DE NAVE</p><h2>' + escapeHtml(skin.name) + '</h2><p>' + escapeHtml(skin.description) + '</p>' + action + '</article>';
  }).join('');

  const trailCards = Object.entries(trails).map(([id, trail]) => {
    const owned = economy.ownedTrails.includes(id);
    const active = economy.activeTrail === id;
    return '<article class="trail-card ' + (active ? 'active' : '') + '">' + trailPreviewMarkup(trail) + '<div><p class="skin-rarity">' + trail.icon + ' ESTELA DE MOTOR</p><h3>' + escapeHtml(trail.name) + '</h3><p>' + escapeHtml(trail.description) + '</p></div>' + catalogAction('trail', id, trail, owned, active) + '</article>';
  }).join('');

  const statusMessage = message ? '<p class="shop-message" role="status">' + escapeHtml(message) + '</p>' : '';

  return '<section class="screen screen-narrow orbital-shop" aria-labelledby="shop-title"><div class="hangar-hero"><div class="hangar-satellite" aria-hidden="true">🛰️</div><div><p class="eyebrow">🛸 Centro de personalización</p><h1 id="shop-title">Hangar Estelar</h1><p class="lead">Construye una Asteria única. Todo es cosmético: el conocimiento y la habilidad siguen mandando.</p></div><div class="shop-wallet"><span>Tu energía estelar</span><strong>💎 <b data-crystal-balance>' + economy.credits + '</b></strong><small>Sin dinero real</small></div></div>' + statusMessage + '<div class="hangar-section-title"><span>🚀</span><div><p>PINTURA Y FUSELAJE</p><h2>Escoge tu nave</h2></div><small>' + economy.ownedSkins.length + '/' + Object.keys(skins).length + ' desbloqueadas</small></div><div class="skin-grid">' + shipCards + '</div><div class="hangar-section-title"><span>✨</span><div><p>EFECTOS DE VUELO</p><h2>Estelas de motor</h2></div><small>' + economy.ownedTrails.length + '/' + Object.keys(trails).length + ' desbloqueadas</small></div><div class="trail-grid">' + trailCards + '</div><div class="shop-note"><span>💡</span><p><strong>Consigue energía estelar:</strong> gana 12 cristales por respuesta correcta y 3 por objeto destruido en una misión real.</p></div><div class="button-row"><button class="button primary" data-nav="flight" data-mode="mission">🚀 Volar con mi diseño</button><button class="button ranking-button" data-nav="ranking">🏆 Ver Liga Galáctica</button><button class="button ghost" data-nav="home">Volver</button></div></section>';
}
