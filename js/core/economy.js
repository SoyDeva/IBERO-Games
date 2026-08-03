export function defaultEconomy() {
  return {
    credits: 0,
    ownedSkins: ['nebula'],
    activeSkin: 'nebula',
    ownedTrails: ['pulse'],
    activeTrail: 'pulse'
  };
}

export function normalizeEconomy(saved = {}, { skins = {}, trails = {} } = {}) {
  const ownedSkins = Array.isArray(saved.ownedSkins)
    ? saved.ownedSkins.filter((id) => Boolean(skins[id]))
    : [];
  if (!ownedSkins.includes('nebula')) ownedSkins.unshift('nebula');

  const ownedTrails = Array.isArray(saved.ownedTrails)
    ? saved.ownedTrails.filter((id) => Boolean(trails[id]))
    : [];
  if (!ownedTrails.includes('pulse')) ownedTrails.unshift('pulse');

  return {
    credits: Math.max(0, Math.floor(Number(saved.credits) || 0)),
    ownedSkins,
    activeSkin: ownedSkins.includes(saved.activeSkin) ? saved.activeSkin : 'nebula',
    ownedTrails,
    activeTrail: ownedTrails.includes(saved.activeTrail) ? saved.activeTrail : 'pulse'
  };
}
