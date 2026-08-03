export function createRankingController({ loadLeaderboard, submitScore, ttl = 15000, now = () => Date.now() } = {}) {
  let ranking = [];
  let status = 'idle';
  let error = '';
  let updatedAt = 0;

  function getSnapshot() {
    return { ranking: [...ranking], status, error, updatedAt };
  }

  function invalidate() {
    status = 'idle';
    error = '';
    updatedAt = 0;
  }

  async function refresh({ season, limit = 10, force = false } = {}) {
    if (status === 'loading') return getSnapshot();
    if (!force && status === 'ready' && now() - updatedAt < ttl) return getSnapshot();

    status = 'loading';
    error = '';
    try {
      ranking = await loadLeaderboard(season, limit);
      status = 'ready';
      updatedAt = now();
    } catch (cause) {
      status = 'error';
      error = cause?.message || 'No fue posible consultar la clasificación.';
    }
    return getSnapshot();
  }

  async function submit(payload) {
    const response = await submitScore(payload);
    invalidate();
    return response;
  }

  return { getSnapshot, invalidate, refresh, submit };
}
