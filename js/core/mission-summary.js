export function createMissionSummary({
  result,
  previousBest = 0,
  crystals = 0,
  achievements = [],
  learnedFact = '',
  pilotName = 'Piloto',
  mode = 'mission'
} = {}) {
  const safeResult = result || {};
  const distance = Math.max(0, Number(safeResult.distance) || 0);
  const best = Math.max(distance, Math.max(0, Number(previousBest) || 0));

  return {
    pilotName: String(pilotName || 'Piloto'),
    reason: String(safeResult.reason || 'La misión terminó.'),
    distance,
    correct: Math.max(0, Number(safeResult.correct) || 0),
    bestStreak: Math.max(0, Number(safeResult.bestStreak) || 0),
    destroyed: Math.max(0, Number(safeResult.destroyed) || 0),
    checkpoints: Math.max(0, Number(safeResult.checkpoints) || 0),
    challengesCompleted: Math.max(0, Number(safeResult.challengesCompleted) || 0),
    best,
    crystals: Math.max(0, Number(crystals) || 0),
    achievements: Array.isArray(achievements) ? [...achievements] : [],
    learnedFact: String(learnedFact || ''),
    syncRanking: mode === 'mission'
  };
}

export function rankingSyncPresentation({ pilotName = 'Piloto', position = null, error = '', updated = false } = {}) {
  if (error) {
    return {
      status: 'error',
      text: '📡 Tu vuelo quedó en la nave, pero no pudo enviarse: ' + String(error)
    };
  }
  const safePosition = Number(position) || null;
  if (safePosition) {
    return {
      status: 'position',
      prefix: updated ? '🏆 ' : '✨ ',
      pilotName: String(pilotName || 'Piloto'),
      position: safePosition
    };
  }
  return { status: 'synced', text: '✨ Vuelo sincronizado con la Liga Galáctica.' };
}
