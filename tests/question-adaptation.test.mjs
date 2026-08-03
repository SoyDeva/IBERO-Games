import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningProgress, recordLearningAnswer } from '../js/core/learning-progress.js';
import { adaptiveQuestionIndex } from '../js/core/question-adaptation.js';
import { createQuestionSession } from '../js/services/question-session.js';

function progressWithEvidence() {
  let progress = createLearningProgress();
  for (let index = 0; index < 5; index += 1) {
    progress = recordLearningAnswer(progress, {
      question: { category: 'Lenguaje' },
      correct: true
    });
    progress = recordLearningAnswer(progress, {
      question: { category: 'Matemáticas' },
      correct: index === 0
    });
  }
  return progress;
}

test('favorece una categoría débil sin excluir las demás', () => {
  const deck = [
    { id: 'lenguaje', category: 'Lenguaje' },
    { id: 'matematicas', category: 'Matemáticas' }
  ];
  const selected = adaptiveQuestionIndex(deck, {
    progress: progressWithEvidence(),
    random: () => 0.6
  });
  assert.equal(selected, 1);
  assert.equal(adaptiveQuestionIndex(deck, { random: () => 0.1 }), 0);
});

test('la sesión adaptativa consume toda la baraja antes de repetir', () => {
  const questions = [
    { id: 'a', category: 'Lenguaje', options: ['A'], answer: 0 },
    { id: 'b', category: 'Matemáticas', options: ['B'], answer: 0 },
    { id: 'c', category: 'Ciencias', options: ['C'], answer: 0 }
  ];
  const selectedIndexes = [1, 0, 0];
  const session = createQuestionSession({
    resolveLevel: () => 1,
    createDeck: () => [...questions],
    shuffleOptions: (question) => question,
    selectQuestion: (deck) => selectedIndexes.shift() ?? deck.length - 1
  });

  assert.equal(session.next(1).id, 'b');
  assert.equal(session.remaining(1), 2);
  assert.equal(session.next(1).id, 'a');
  assert.equal(session.next(1).id, 'c');
  assert.equal(session.remaining(1), 0);
  assert.equal(new Set(['b', 'a', 'c']).size, 3);
});

test('rechaza selectores inválidos y usa el final como reserva segura', () => {
  assert.throws(() => createQuestionSession({
    resolveLevel: () => 1,
    createDeck: () => [],
    shuffleOptions: (question) => question,
    selectQuestion: true
  }), /selector de preguntas/);

  const session = createQuestionSession({
    resolveLevel: () => 1,
    createDeck: () => [
      { id: 'primera', options: ['A'], answer: 0 },
      { id: 'ultima', options: ['B'], answer: 0 }
    ],
    shuffleOptions: (question) => question,
    selectQuestion: () => 99
  });
  assert.equal(session.next(1).id, 'ultima');
});
