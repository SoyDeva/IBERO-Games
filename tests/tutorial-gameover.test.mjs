import assert from 'node:assert/strict';
import test from 'node:test';

import { createMissionSummary, rankingSyncPresentation } from '../js/core/mission-summary.js';
import { evaluateTutorialAnswer, TUTORIAL_COMPLETION, TUTORIAL_QUESTION, tutorialStep } from '../js/core/tutorial.js';
import { renderGameOverScreen, updateGameOverRanking } from '../js/ui/game-over-screen.js';
import { applyTutorialStep } from '../js/ui/tutorial-panel.js';

test('el tutorial conserva pasos, pregunta y tiempos actuales', () => {
  assert.equal(tutorialStep('left').targets[0], '#steer-left');
  assert.equal(tutorialStep('question').delayMs, 650);
  assert.equal(TUTORIAL_QUESTION.answer, 1);
  assert.equal(TUTORIAL_COMPLETION.delayMs, 1700);
  assert.equal(tutorialStep('desconocido'), null);
});

test('evalúa la pregunta del tutorial sin penalizar intentos fallidos', () => {
  const wrong = evaluateTutorialAnswer(0);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.delayMs, 0);
  assert.match(wrong.message, /Casi/);

  const correct = evaluateTutorialAnswer(1);
  assert.equal(correct.correct, true);
  assert.equal(correct.delayMs, 900);
  assert.equal(correct.fact, TUTORIAL_QUESTION.fact);
});

test('aplica objetivos visuales del tutorial y limpia el objetivo anterior', () => {
  const previous = { removed: false, classList: { remove() { this.owner.removed = true; }, owner: null } };
  previous.classList.owner = previous;
  const left = { added: false, classList: { add() { this.owner.added = true; }, owner: null } };
  left.classList.owner = left;
  const mobile = { added: false, classList: { add() { this.owner.added = true; }, owner: null } };
  mobile.classList.owner = mobile;
  const coach = { innerHTML: '', hidden: true };
  const documentRef = {
    getElementById: () => coach,
    querySelectorAll(selector) {
      if (selector === '.tutorial-target') return [previous];
      if (selector === '#steer-left') return [left];
      if (selector === '#mobile-steer-left') return [mobile];
      return [];
    }
  };

  const outcome = applyTutorialStep({ documentRef, step: tutorialStep('left') });
  assert.equal(outcome.showQuestion, false);
  assert.equal(previous.removed, true);
  assert.equal(left.added, true);
  assert.equal(mobile.added, true);
  assert.equal(coach.hidden, false);
  assert.match(coach.innerHTML, /Muévete a la izquierda/);
});

test('prepara una bitácora normalizada y calcula el mejor récord', () => {
  const summary = createMissionSummary({
    result: { distance: 820, correct: 3, bestStreak: 2, destroyed: 4, checkpoints: 3, reason: 'Fin' },
    previousBest: 900,
    crystals: 21,
    achievements: ['first_portal'],
    learnedFact: 'Dato',
    pilotName: 'Nova',
    mode: 'mission'
  });
  assert.equal(summary.best, 900);
  assert.equal(summary.distance, 820);
  assert.equal(summary.syncRanking, true);
  assert.deepEqual(summary.achievements, ['first_portal']);

  const practice = createMissionSummary({ result: { distance: -4 }, mode: 'practice' });
  assert.equal(practice.distance, 0);
  assert.equal(practice.syncRanking, false);
});

test('renderiza la bitácora, escapa contenido y enlaza sus cinco acciones', () => {
  const handlers = {};
  const controls = new Map();
  for (const selector of ['#restart-flight', '#practice-after-game', '#shop-after-game', '#ranking-after-game', '[data-nav]']) {
    controls.set(selector, { addEventListener(_event, handler) { handlers[selector] = handler; } });
  }
  const overlay = {
    innerHTML: '',
    hidden: true,
    querySelector(selector) { return controls.get(selector) || null; }
  };
  const documentRef = { getElementById: (id) => id === 'flight-overlay' ? overlay : null };
  const summary = createMissionSummary({
    result: { distance: 100, reason: '<b>Fin</b>' },
    pilotName: '<img>',
    learnedFact: '<script>',
    crystals: 12,
    achievements: ['a'],
    mode: 'mission'
  });
  let calls = 0;
  const actions = {
    restart: () => { calls += 1; }, practice: () => { calls += 1; }, shop: () => { calls += 1; },
    ranking: () => { calls += 1; }, exit: () => { calls += 1; }
  };

  assert.equal(renderGameOverScreen({ documentRef, summary, actions }), true);
  assert.equal(overlay.hidden, false);
  assert.match(overlay.innerHTML, /Bitácora/);
  assert.match(overlay.innerHTML, /&lt;img&gt;/);
  assert.doesNotMatch(overlay.innerHTML, /<script>/);
  Object.values(handlers).forEach((handler) => handler());
  assert.equal(calls, 5);
});

test('representa sincronización, posición y error de la Liga', () => {
  assert.equal(rankingSyncPresentation({}).status, 'synced');
  assert.equal(rankingSyncPresentation({ position: 2, updated: true }).prefix, '🏆 ');
  assert.equal(rankingSyncPresentation({ error: 'sin red' }).status, 'error');

  const classes = new Set(['syncing']);
  const note = {
    textContent: '', innerHTML: '',
    classList: {
      remove(name) { classes.delete(name); },
      add(name) { classes.add(name); }
    }
  };
  const documentRef = { getElementById: () => note };
  updateGameOverRanking({ documentRef, pilotName: '<Nova>', position: 3, updated: false });
  assert.equal(classes.has('syncing'), false);
  assert.match(note.innerHTML, /#3/);
  assert.match(note.innerHTML, /&lt;Nova&gt;/);

  updateGameOverRanking({ documentRef, error: 'sin conexión' });
  assert.equal(classes.has('sync-error'), true);
  assert.match(note.textContent, /sin conexión/);
});
