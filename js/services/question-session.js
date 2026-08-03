import { evaluateQuestionAnswer } from '../core/question-feedback.js';

export function createQuestionSession({ resolveLevel, createDeck, shuffleOptions, selectQuestion }) {
  if (typeof resolveLevel !== 'function' || typeof createDeck !== 'function' || typeof shuffleOptions !== 'function') {
    throw new TypeError('La sesión de preguntas requiere resolutor de nivel, creador de baraja y mezclador de opciones.');
  }
  if (selectQuestion !== undefined && typeof selectQuestion !== 'function') {
    throw new TypeError('El selector de preguntas debe ser una función.');
  }

  const decks = new Map();
  let currentQuestion = null;

  function next(portalNumber, context = {}) {
    const level = resolveLevel(portalNumber);
    let deck = decks.get(level);

    if (!deck?.length) {
      deck = createDeck(level);
      if (!Array.isArray(deck) || deck.length === 0) {
        throw new Error('No hay preguntas disponibles para el nivel ' + level + '.');
      }
      decks.set(level, deck);
    }

    const requestedIndex = selectQuestion
      ? Number(selectQuestion(deck, { ...context, level, portalNumber }))
      : deck.length - 1;
    const selectedIndex = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < deck.length
      ? requestedIndex
      : deck.length - 1;
    const [selectedQuestion] = deck.splice(selectedIndex, 1);
    currentQuestion = shuffleOptions(selectedQuestion);
    return currentQuestion;
  }

  function answer(selectedIndex, mode = 'mission') {
    return evaluateQuestionAnswer(currentQuestion, selectedIndex, mode);
  }

  function getCurrent() {
    return currentQuestion;
  }

  function remaining(level) {
    return decks.get(level)?.length || 0;
  }

  return Object.freeze({ next, answer, getCurrent, remaining });
}
