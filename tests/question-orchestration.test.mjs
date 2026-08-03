import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateQuestionAnswer, QUESTION_DELAYS } from '../js/core/question-feedback.js';
import { createQuestionSession } from '../js/services/question-session.js';
import { questionCategoryLabel, renderQuestionOptions } from '../js/ui/quiz-panel.js';

const levelOneQuestions = [
  {
    id: 'q1', level: 1, category: 'Ciencias', icon: '🌱',
    text: 'Pregunta uno', options: ['A', 'B', 'C'], answer: 1,
    fact: 'B es la respuesta correcta.'
  },
  {
    id: 'q2', level: 1, category: 'Espacio', icon: '🪐',
    text: 'Pregunta dos', options: ['Sol', 'Luna', 'Marte'], answer: 2,
    fact: 'Marte es la respuesta correcta.'
  }
];

function buildSession() {
  let deckCreations = 0;
  const session = createQuestionSession({
    resolveLevel: (portal) => Math.ceil(portal / 2),
    createDeck: (level) => {
      deckCreations += 1;
      return level === 1 ? [...levelOneQuestions] : [{ ...levelOneQuestions[0], id: 'q-level-' + level, level }];
    },
    shuffleOptions: (question) => ({ ...question, options: [...question.options] })
  });
  return { session, getDeckCreations: () => deckCreations };
}

test('mantiene una baraja por nivel y la repone únicamente al agotarse', () => {
  const { session, getDeckCreations } = buildSession();

  assert.equal(session.next(1).id, 'q2');
  assert.equal(session.remaining(1), 1);
  assert.equal(session.next(2).id, 'q1');
  assert.equal(session.remaining(1), 0);
  assert.equal(getDeckCreations(), 1);

  assert.equal(session.next(1).id, 'q2');
  assert.equal(getDeckCreations(), 2);
});

test('separa las barajas correspondientes a niveles diferentes', () => {
  const { session, getDeckCreations } = buildSession();
  const firstLevel = session.next(1);
  const secondLevel = session.next(3);

  assert.equal(firstLevel.level, 1);
  assert.equal(secondLevel.level, 2);
  assert.equal(getDeckCreations(), 2);
});

test('evalúa aciertos con el mismo mensaje y tiempo de la misión', () => {
  const outcome = evaluateQuestionAnswer(levelOneQuestions[0], 1, 'mission');
  assert.equal(outcome.correct, true);
  assert.equal(outcome.feedback, '✅ ¡Correcto! Combustible recargado.');
  assert.equal(outcome.delayMs, QUESTION_DELAYS.correct);
  assert.equal(outcome.fact, levelOneQuestions[0].fact);
});

test('diferencia la retroalimentación de misión y práctica', () => {
  const mission = evaluateQuestionAnswer(levelOneQuestions[0], 0, 'mission');
  const practice = evaluateQuestionAnswer(levelOneQuestions[0], 0, 'practice');

  assert.equal(mission.correct, false);
  assert.equal(mission.feedback, '❌ ' + levelOneQuestions[0].fact);
  assert.equal(mission.delayMs, QUESTION_DELAYS.missionIncorrect);
  assert.equal(practice.feedback, '💡 Aprendimos: ' + levelOneQuestions[0].fact);
  assert.equal(practice.delayMs, QUESTION_DELAYS.practiceIncorrect);
  assert.equal(practice.practice, true);
});

test('la sesión evalúa la pregunta que entregó más recientemente', () => {
  const { session } = buildSession();
  const question = session.next(1);
  const outcome = session.answer(question.answer, 'mission');

  assert.equal(session.getCurrent().id, question.id);
  assert.equal(outcome.correct, true);
  assert.equal(outcome.correctIndex, question.answer);
});

test('genera la etiqueta pedagógica y escapa opciones no confiables', () => {
  const question = {
    ...levelOneQuestions[0],
    options: ['Segura', '<img src=x onerror=alert(1)>', 'Otra']
  };

  assert.equal(questionCategoryLabel(question), '🌱 Ciencias · Pregunta nivel 1');
  const markup = renderQuestionOptions(question);
  assert.match(markup, /data-answer="1"/);
  assert.doesNotMatch(markup, /<img/);
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
});
