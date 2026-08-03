const PROGRESS_VERSION = 1;
const TRACKED_MODES = new Set(['mission', 'practice']);

function safeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function normalizeStats(value = {}) {
  const attempts = safeCount(value.attempts);
  const correct = Math.min(attempts, safeCount(value.correct));
  const incorrect = Math.max(0, attempts - correct);
  const currentStreak = Math.min(correct, safeCount(value.currentStreak));
  const bestStreak = Math.max(currentStreak, safeCount(value.bestStreak));
  return { attempts, correct, incorrect, currentStreak, bestStreak };
}

export function createLearningProgress() {
  return {
    version: PROGRESS_VERSION,
    totals: normalizeStats(),
    categories: {}
  };
}

export function normalizeLearningProgress(value) {
  const source = value && typeof value === 'object' ? value : {};
  const categories = {};
  if (source.categories && typeof source.categories === 'object') {
    for (const [name, stats] of Object.entries(source.categories)) {
      const category = String(name || '').trim().slice(0, 48);
      if (!category) continue;
      categories[category] = normalizeStats(stats);
    }
  }

  const totals = Object.values(categories).reduce((result, stats) => ({
    attempts: result.attempts + stats.attempts,
    correct: result.correct + stats.correct,
    incorrect: result.incorrect + stats.incorrect,
    currentStreak: Math.max(result.currentStreak, stats.currentStreak),
    bestStreak: Math.max(result.bestStreak, stats.bestStreak)
  }), normalizeStats(source.totals));

  totals.incorrect = Math.max(0, totals.attempts - totals.correct);
  totals.currentStreak = Math.min(totals.correct, safeCount(source.totals?.currentStreak));
  totals.bestStreak = Math.max(totals.currentStreak, safeCount(source.totals?.bestStreak), ...Object.values(categories).map((stats) => stats.bestStreak));

  return { version: PROGRESS_VERSION, totals, categories };
}

export function recordLearningAnswer(progress, { question, correct, mode = 'mission' } = {}) {
  const normalized = normalizeLearningProgress(progress);
  if (!TRACKED_MODES.has(mode) || !question) return normalized;

  const category = String(question.category || '').trim().slice(0, 48);
  if (!category) return normalized;

  const isCorrect = Boolean(correct);
  const categoryStats = normalizeStats(normalized.categories[category]);
  const nextCategoryStreak = isCorrect ? categoryStats.currentStreak + 1 : 0;
  const nextTotalStreak = isCorrect ? normalized.totals.currentStreak + 1 : 0;

  return {
    version: PROGRESS_VERSION,
    totals: {
      attempts: normalized.totals.attempts + 1,
      correct: normalized.totals.correct + (isCorrect ? 1 : 0),
      incorrect: normalized.totals.incorrect + (isCorrect ? 0 : 1),
      currentStreak: nextTotalStreak,
      bestStreak: Math.max(normalized.totals.bestStreak, nextTotalStreak)
    },
    categories: {
      ...normalized.categories,
      [category]: {
        attempts: categoryStats.attempts + 1,
        correct: categoryStats.correct + (isCorrect ? 1 : 0),
        incorrect: categoryStats.incorrect + (isCorrect ? 0 : 1),
        currentStreak: nextCategoryStreak,
        bestStreak: Math.max(categoryStats.bestStreak, nextCategoryStreak)
      }
    }
  };
}

export function learningCategoryNeed(progress, category) {
  const stats = normalizeLearningProgress(progress).categories[String(category || '').trim()];
  if (!stats?.attempts) return 0.5;
  const smoothedError = (stats.incorrect + 1) / (stats.attempts + 2);
  const evidence = Math.min(1, stats.attempts / 6);
  return 0.5 * (1 - evidence) + smoothedError * evidence;
}

function categoryView(progress, name, stats) {
  const accuracy = stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0;
  const need = learningCategoryNeed(progress, name);
  const status = accuracy >= 80 && stats.attempts >= 3
    ? 'Fortaleza'
    : accuracy < 60
      ? 'En refuerzo'
      : 'En progreso';
  return { name, ...stats, accuracy, need, status };
}

export function summarizeLearningProgress(progress) {
  const normalized = normalizeLearningProgress(progress);
  const categories = Object.entries(normalized.categories)
    .map(([name, stats]) => categoryView(normalized, name, stats))
    .filter((category) => category.attempts > 0);
  const accuracy = normalized.totals.attempts
    ? Math.round((normalized.totals.correct / normalized.totals.attempts) * 100)
    : 0;
  const focus = [...categories]
    .sort((a, b) => b.need - a.need || b.attempts - a.attempts || a.name.localeCompare(b.name))
    .slice(0, 3);
  const strength = [...categories]
    .filter((category) => category.attempts >= 2)
    .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts || a.name.localeCompare(b.name))[0] || null;

  return {
    hasData: normalized.totals.attempts > 0,
    attempts: normalized.totals.attempts,
    correct: normalized.totals.correct,
    incorrect: normalized.totals.incorrect,
    accuracy,
    currentStreak: normalized.totals.currentStreak,
    bestStreak: normalized.totals.bestStreak,
    categoryCount: categories.length,
    focus,
    strength,
    recommendation: focus.length
      ? 'La próxima práctica dará un poco más de prioridad a ' + focus.map((category) => category.name).join(', ') + '.'
      : 'Responde algunos portales para descubrir tus fortalezas y temas de refuerzo.'
  };
}
