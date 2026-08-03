function catalogFor(kind, catalogs = {}) {
  return kind === 'trail' ? catalogs.trails || {} : kind === 'skin' ? catalogs.skins || {} : null;
}

function keysFor(kind) {
  if (kind === 'trail') return { owned: 'ownedTrails', active: 'activeTrail' };
  if (kind === 'skin') return { owned: 'ownedSkins', active: 'activeSkin' };
  return null;
}

function cloneEconomy(economy = {}) {
  return {
    ...economy,
    ownedSkins: [...(economy.ownedSkins || [])],
    ownedTrails: [...(economy.ownedTrails || [])]
  };
}

export function purchaseHangarItem(economy, { kind, id } = {}, catalogs = {}) {
  const catalog = catalogFor(kind, catalogs);
  const keys = keysFor(kind);
  const item = catalog?.[id];
  if (!catalog || !keys || !item) return { status: 'invalid', economy };

  if (economy[keys.owned]?.includes(id)) {
    return { status: 'owned', economy, item };
  }

  const missing = Math.max(0, Number(item.price) - Number(economy.credits || 0));
  if (missing > 0) {
    return { status: 'insufficient', economy, item, missing };
  }

  const next = cloneEconomy(economy);
  next.credits -= Number(item.price) || 0;
  next[keys.owned].push(id);
  next[keys.active] = id;
  return { status: 'purchased', economy: next, item };
}

export function equipHangarItem(economy, { kind, id } = {}, catalogs = {}) {
  const catalog = catalogFor(kind, catalogs);
  const keys = keysFor(kind);
  const item = catalog?.[id];
  if (!catalog || !keys || !item) return { status: 'invalid', economy };
  if (!economy[keys.owned]?.includes(id)) return { status: 'locked', economy, item };
  if (economy[keys.active] === id) return { status: 'active', economy, item };

  const next = cloneEconomy(economy);
  next[keys.active] = id;
  return { status: 'equipped', economy: next, item };
}
