import { BADGES, RECOMMENDATIONS } from './data.js';

/**
 * Convierte la rúbrica acordada por participantes en una energía orientativa de 0 a 100.
 * @param {Record<string, number>} values Valoraciones de 1 a 5.
 * @returns {{scores: object, average: number, energy: number}} Resultado pedagógico.
 */
export function calculateEvaluation(values) {
  const entries = Object.entries(values).filter(([, value]) => Number.isFinite(Number(value)));
  const scores = Object.fromEntries(entries.map(([key, value]) => [key, Number(value)]));
  const average = entries.length ? entries.reduce((sum, [, value]) => sum + Number(value), 0) / entries.length : 0;
  return { scores, average: Number(average.toFixed(1)), energy: Math.round(average * 20) };
}

export function chooseBadge(scores, missionIndex) {
  const dimension = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  return BADGES.find((badge) => badge.dimension === dimension) || BADGES[missionIndex % BADGES.length];
}

export function recommendationFor(scores) {
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0];
  return RECOMMENDATIONS[weakest] || 'Sigan haciendo preguntas, probando combinaciones y explicando sus decisiones.';
}

export function aggregateScores(missions) {
  const totals = {};
  const counts = {};
  missions.forEach((mission) => {
    Object.entries(mission.evaluation?.scores || {}).forEach(([key, score]) => {
      totals[key] = (totals[key] || 0) + score;
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return Object.fromEntries(Object.keys(totals).map((key) => [key, Number((totals[key] / counts[key]).toFixed(1))]));
}
