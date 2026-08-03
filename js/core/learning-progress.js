const PROGRESS_VERSION = 2;
const DEFAULT_SESSION_LIMIT = 12;
const LONGITUDINAL_SESSION_LIMIT = 60;
const TRACKED_MODES = new Set(['mission', 'practice']);
const GOAL_MODES = new Set(['mission', 'practice', 'both']);

function safeCount(value, maximum = Number.MAX_SAFE_INTEGER) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.min(maximum, Math.floor(count)) : 0;
}

function safeText(value, maximum = 80) {
  return String(value || '').trim().slice(0, maximum);
}

function normalizeStats(value = {}) {
  const attempts = safeCount(value.attempts);
  const correct = Math.min(attempts, safeCount(value.correct));
  const incorrect = Math.max(0, attempts - correct);
  const currentStreak = Math.min(correct, safeCount(value.currentStreak));
  const bestStreak = Math.min(correct, Math.max(currentStreak, safeCount(value.bestStreak)));
  return { attempts, correct, incorrect, currentStreak, bestStreak };
}

function normalizeMode(value) {
  return TRACKED_MODES.has(value) ? value : 'practice';
}

function normalizeGoalMode(value) {
  return GOAL_MODES.has(value) ? value : 'practice';
}

function normalizeDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function normalizeGoalConfig(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    mode: normalizeGoalMode(value.mode),
    targetAnswers: Math.max(3, Math.min(20, safeCount(value.targetAnswers, 20) || 8)),
    targetAccuracy: Math.max(50, Math.min(100, safeCount(value.targetAccuracy, 100) || 70)),
    focusCategory: safeText(value.focusCategory, 48)
  };
}

export function normalizeLearningPreferences(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    goal: normalizeGoalConfig(source.goal),
    longitudinal: Boolean(source.longitudinal)
  };
}

function normalizeSession(value = {}) {
  const completedAt = normalizeDate(value.completedAt);
  if (!completedAt) return null;

  const answers = safeCount(value.answers, 1000);
  const correct = Math.min(answers, safeCount(value.correct, 1000));
  const accuracy = answers ? Math.round((correct / answers) * 100) : 0;
  const targetAnswers = Math.max(1, safeCount(value.targetAnswers, 50) || 1);
  const targetAccuracy = Math.max(40, Math.min(100, safeCount(value.targetAccuracy, 100) || 70));

  return {
    completedAt,
    mode: normalizeMode(value.mode),
    answers,
    correct,
    incorrect: Math.max(0, answers - correct),
    accuracy,
    distance: safeCount(value.distance, 1000000),
    checkpoints: safeCount(value.checkpoints, 10000),
    focusCategory: safeText(value.focusCategory, 48),
    targetAnswers,
    targetAccuracy,
    goalReached: answers >= targetAnswers && accuracy >= targetAccuracy
  };
}

export function createLearningProgress() {
  return {
    version: PROGRESS_VERSION,
    totals: normalizeStats(),
    categories: {},
    sessions: [],
    preferences: normalizeLearningPreferences()
  };
}

export function normalizeLearningProgress(value) {
  const source = value && typeof value === 'object' ? value : {};
  const categories = {};
  if (source.categories && typeof source.categories === 'object') {
    for (const [name, stats] of Object.entries(source.categories)) {
      const category = safeText(name, 48);
      if (!category) continue;
      categories[category] = normalizeStats(stats);
    }
  }

  const sourceTotals = normalizeStats(source.totals);
  const categoryTotals = Object.values(categories).reduce((result, stats) => ({
    attempts: result.attempts + stats.attempts,
    correct: result.correct + stats.correct,
    incorrect: result.incorrect + stats.incorrect,
    bestStreak: Math.max(result.bestStreak, stats.bestStreak)
  }), { attempts: 0, correct: 0, incorrect: 0, bestStreak: 0 });
  const useCategoryTotals = categoryTotals.attempts > 0;
  const attempts = useCategoryTotals ? categoryTotals.attempts : sourceTotals.attempts;
  const correct = Math.min(attempts, useCategoryTotals ? categoryTotals.correct : sourceTotals.correct);
  const currentStreak = Math.min(correct, sourceTotals.currentStreak);
  const bestStreak = Math.min(correct, Math.max(currentStreak, sourceTotals.bestStreak, categoryTotals.bestStreak));
  const preferences = normalizeLearningPreferences(source.preferences);
  const sessionLimit = preferences.longitudinal ? LONGITUDINAL_SESSION_LIMIT : DEFAULT_SESSION_LIMIT;
  const sessions = Array.isArray(source.sessions)
    ? source.sessions.map(normalizeSession).filter(Boolean).slice(0, sessionLimit)
    : [];

  return {
    version: PROGRESS_VERSION,
    totals: {
      attempts,
      correct,
      incorrect: Math.max(0, attempts - correct),
      currentStreak,
      bestStreak
    },
    categories,
    sessions,
    preferences
  };
}

export function recordLearningAnswer(progress, { question, correct, mode = 'mission' } = {}) {
  const normalized = normalizeLearningProgress(progress);
  if (!TRACKED_MODES.has(mode) || !question) return normalized;

  const category = safeText(question.category, 48);
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
    },
    sessions: normalized.sessions,
    preferences: normalized.preferences
  };
}

export function learningCategoryNeed(progress, category) {
  const stats = normalizeLearningProgress(progress).categories[safeText(category, 48)];
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

function categoryViews(progress) {
  const normalized = normalizeLearningProgress(progress);
  return Object.entries(normalized.categories)
    .map(([name, stats]) => categoryView(normalized, name, stats))
    .filter((category) => category.attempts > 0);
}

export function configureLearningGoal(progress, value) {
  const normalized = normalizeLearningProgress(progress);
  const goal = normalizeGoalConfig(value);
  if (!goal) return normalized;
  return {
    ...normalized,
    preferences: { ...normalized.preferences, goal }
  };
}

export function clearLearningGoal(progress) {
  const normalized = normalizeLearningProgress(progress);
  return {
    ...normalized,
    preferences: { ...normalized.preferences, goal: null }
  };
}

export function setLongitudinalTracking(progress, enabled) {
  const normalized = normalizeLearningProgress(progress);
  const longitudinal = Boolean(enabled);
  return {
    ...normalized,
    sessions: normalized.sessions.slice(0, longitudinal ? LONGITUDINAL_SESSION_LIMIT : DEFAULT_SESSION_LIMIT),
    preferences: { ...normalized.preferences, longitudinal }
  };
}

export function createLearningGoal(progress, { mode = 'practice' } = {}) {
  const normalized = normalizeLearningProgress(progress);
  const categories = categoryViews(normalized);
  const focus = [...categories]
    .sort((a, b) => b.need - a.need || b.attempts - a.attempts || a.name.localeCompare(b.name))[0] || null;
  const normalizedMode = normalizeMode(mode);
  const custom = normalized.preferences.goal;
  const usesCustom = Boolean(custom && (custom.mode === 'both' || custom.mode === normalizedMode));
  const targetAnswers = usesCustom ? custom.targetAnswers : normalizedMode === 'mission' ? 5 : 8;
  const targetAccuracy = usesCustom ? custom.targetAccuracy : 70;
  const focusCategory = usesCustom && custom.focusCategory ? custom.focusCategory : focus?.name || '';

  return {
    mode: normalizedMode,
    targetAnswers,
    targetAccuracy,
    focusCategory,
    custom: usesCustom,
    text: 'Responde ' + targetAnswers + ' preguntas con al menos ' + targetAccuracy + '% de aciertos' + (focusCategory ? ', reforzando ' + focusCategory : '') + '.'
  };
}

export function createLearningSession(progress, {
  baseline,
  mode = 'mission',
  result = {},
  completedAt = new Date().toISOString()
} = {}) {
  if (!TRACKED_MODES.has(mode)) return null;

  const current = normalizeLearningProgress(progress);
  const start = normalizeLearningProgress(baseline);
  const answers = Math.max(0, current.totals.attempts - start.totals.attempts);
  const correct = Math.min(answers, Math.max(0, current.totals.correct - start.totals.correct));
  if (!answers) return null;

  const goal = createLearningGoal(start, { mode });
  return normalizeSession({
    completedAt,
    mode,
    answers,
    correct,
    distance: result.distance,
    checkpoints: result.checkpoints,
    focusCategory: goal.focusCategory,
    targetAnswers: goal.targetAnswers,
    targetAccuracy: goal.targetAccuracy
  });
}

export function appendLearningSession(progress, session) {
  const normalized = normalizeLearningProgress(progress);
  const safeSession = normalizeSession(session);
  if (!safeSession) return normalized;
  const limit = normalized.preferences.longitudinal ? LONGITUDINAL_SESSION_LIMIT : DEFAULT_SESSION_LIMIT;
  return {
    ...normalized,
    sessions: [safeSession, ...normalized.sessions].slice(0, limit)
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function summarizeLearningTrend(progress) {
  const sessions = normalizeLearningProgress(progress).sessions;
  if (sessions.length < 2) {
    return {
      available: false,
      direction: 'insufficient',
      accuracyDelta: 0,
      answerDelta: 0,
      goalRate: 0,
      text: 'Se necesitan al menos dos sesiones para observar una tendencia.'
    };
  }

  const windowSize = Math.min(3, Math.max(1, Math.floor(sessions.length / 2)));
  const recent = sessions.slice(0, windowSize);
  const previous = sessions.slice(windowSize, windowSize * 2);
  const recentAccuracy = Math.round(average(recent.map((session) => session.accuracy)));
  const previousAccuracy = Math.round(average(previous.map((session) => session.accuracy)));
  const recentAnswers = Math.round(average(recent.map((session) => session.answers)));
  const previousAnswers = Math.round(average(previous.map((session) => session.answers)));
  const accuracyDelta = recentAccuracy - previousAccuracy;
  const answerDelta = recentAnswers - previousAnswers;
  const goalRate = Math.round((recent.filter((session) => session.goalReached).length / recent.length) * 100);
  const direction = accuracyDelta >= 5 ? 'improving' : accuracyDelta <= -5 ? 'declining' : 'stable';
  const text = direction === 'improving'
    ? 'La precisión reciente subió ' + accuracyDelta + ' puntos porcentuales.'
    : direction === 'declining'
      ? 'La precisión reciente bajó ' + Math.abs(accuracyDelta) + ' puntos; conviene revisar el contexto y reforzar sin penalizar.'
      : 'La precisión reciente se mantiene estable.';

  return {
    available: true,
    direction,
    accuracyDelta,
    answerDelta,
    goalRate,
    recentAccuracy,
    previousAccuracy,
    comparedSessions: recent.length + previous.length,
    text
  };
}

export function summarizeLearningProgress(progress) {
  const normalized = normalizeLearningProgress(progress);
  const categories = categoryViews(normalized);
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
    categories: [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    focus,
    strength,
    goal: createLearningGoal(normalized, { mode: 'practice' }),
    customGoal: normalized.preferences.goal,
    longitudinalTracking: normalized.preferences.longitudinal,
    sessionLimit: normalized.preferences.longitudinal ? LONGITUDINAL_SESSION_LIMIT : DEFAULT_SESSION_LIMIT,
    trend: summarizeLearningTrend(normalized),
    recentSessions: normalized.sessions.slice(0, 5),
    sessionCount: normalized.sessions.length,
    recommendation: focus.length
      ? 'La próxima práctica dará un poco más de prioridad a ' + focus.map((category) => category.name).join(', ') + '.'
      : 'Responde algunos portales para descubrir tus fortalezas y temas de refuerzo.'
  };
}