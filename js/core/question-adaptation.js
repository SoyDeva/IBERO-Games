import { learningCategoryNeed } from './learning-progress.js';

function safeRandom(random) {
  const value = Number(random());
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.999999999, Math.max(0, value));
}

export function adaptiveQuestionIndex(deck, { progress, random = Math.random } = {}) {
  if (!Array.isArray(deck) || deck.length === 0) return -1;
  if (typeof random !== 'function') throw new TypeError('El selector adaptativo requiere una fuente aleatoria.');

  const weights = deck.map((question) => 1 + learningCategoryNeed(progress, question?.category) * 1.5);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let target = safeRandom(random) * totalWeight;

  for (let index = 0; index < weights.length; index += 1) {
    target -= weights[index];
    if (target < 0) return index;
  }
  return deck.length - 1;
}
