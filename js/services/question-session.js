import { evaluateQuestionAnswer } from '../core/question-feedback.js';

export function createQuestionSession({ resolveLevel, createDeck, shuffleOptions }) {
  if (typeof resolveLevel !== 'function' || typeof createDeck !== 'function' || typeof shuffleOptions !== 'function') {
    throw new TypeError('La sesión de preguntas requiere resolutor de nivel, creador de baraja y mezclador de opciones.');
  }

  const decks = new Map();
  let currentQuestion = null;

  function next(portalNumber) {
    const level = resolveLevel(portalNumber);
    let deck = decks.get(level);

    if (!deck?.length) {
      deck = createDeck(level);
      if (!Array.isArray(deck) || deck.length === 0) {
        throw new Error('No hay preguntas disponibles para el nivel ' + level + '.');
      }
      decks.set(level, deck);
    }

    currentQuestion = shuffleOptions(deck.pop());
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
