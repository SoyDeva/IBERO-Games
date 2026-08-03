import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar dominios de tutorial y bitácora',
  "import { escapeHtml } from './core/html.js?v=23';",
  "import { escapeHtml } from './core/html.js?v=23';\nimport { createMissionSummary } from './core/mission-summary.js?v=23';\nimport { evaluateTutorialAnswer, TUTORIAL_COMPLETION, TUTORIAL_QUESTION, tutorialStep } from './core/tutorial.js?v=23';"
);
replaceOnce(
  'importar pantalla de cierre',
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';",
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';\nimport { renderGameOverScreen, updateGameOverRanking } from './ui/game-over-screen.js?v=23';"
);
replaceOnce(
  'importar panel de tutorial',
  "import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';",
  "import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';\nimport { applyTutorialStep, clearTutorialTargets, hideTutorialCoach, hideTutorialQuestion, presentTutorialQuestion, revealTutorialAnswer, showTutorialCoach } from './ui/tutorial-panel.js?v=23';"
);
replaceOnce('retirar pregunta global del tutorial', 'let currentQuestion = null;\n', '');

replaceOnce(
  'extraer tutorial guiado',
  /function clearTutorialTargets\(\) \{[\s\S]*?\n\}\n\nfunction startFlightSession\(\) \{/,
  `function handleTutorialStep({ step }) {
  const presentation = applyTutorialStep({ documentRef: document, step: tutorialStep(step) });
  if (presentation.showQuestion) quizTimer = window.setTimeout(showTutorialQuestion, presentation.delayMs);
}

function showTutorialQuestion() {
  const shown = presentTutorialQuestion({
    documentRef: document,
    question: TUTORIAL_QUESTION,
    onAnswer: answerTutorialQuestion
  });
  if (shown) playTone('complete');
}

function answerTutorialQuestion(selectedIndex) {
  const panel = document.getElementById('quiz-panel');
  if (!panel || panel.dataset.answered === 'true') return;
  const outcome = evaluateTutorialAnswer(selectedIndex);
  revealTutorialAnswer({ documentRef: document, outcome });
  playTone(outcome.tone);
  if (!outcome.correct) return;

  lastLearnedFact = outcome.fact;
  localStorage.setItem('nebula-tutorial-complete', 'true');
  quizTimer = window.setTimeout(() => {
    hideTutorialQuestion(document);
    flight.finishTutorial();
  }, outcome.delayMs);
}

function completeTutorial() {
  clearTutorialTargets(document);
  showTutorialCoach({ documentRef: document, step: TUTORIAL_COMPLETION });
  playTone('achievement');
  quizTimer = window.setTimeout(() => {
    flightMode = 'mission';
    hideTutorialCoach(document);
    startFlightSession();
    showToast(TUTORIAL_COMPLETION.toast, 'success');
  }, TUTORIAL_COMPLETION.delayMs);
}

function startFlightSession() {`
);

replaceOnce(
  'extraer bitácora de cierre',
  /function showGameOver\(result\) \{[\s\S]*?\n\}\n\nfunction syncFlightViewport\(\) \{/,
  `function showGameOver(result) {
  stopMusic();
  const rankingPromise = recordRanking(result);
  const pilotName = getPilotName() || 'Piloto';
  const summary = createMissionSummary({
    result,
    previousBest: Number(localStorage.getItem('nebula-flight-best') || 0),
    crystals: runCrystals,
    achievements: runAchievements,
    learnedFact: lastLearnedFact,
    pilotName,
    mode: flightMode
  });
  localStorage.setItem('nebula-flight-best', String(summary.best));
  renderGameOverScreen({
    documentRef: document,
    summary,
    actions: {
      restart: () => {
        flightMode = 'mission';
        startFlightSession();
      },
      practice: () => {
        flightMode = 'practice';
        startFlightSession();
      },
      shop: () => setRoute('shop'),
      ranking: () => setRoute('ranking'),
      exit: () => setRoute('home')
    }
  });
  if (summary.syncRanking) {
    rankingPromise.then((ranking) => updateGameOverRanking({ documentRef: document, pilotName, ...ranking }));
  }
  announce('Misión terminada. Revisa tu bitácora y vuelve a intentarlo cuando quieras.');
}

function syncFlightViewport() {`
);

for (const forbidden of [
  'let currentQuestion = null',
  'function clearTutorialTargets()',
  "currentQuestion = {",
  "overlay.innerHTML = '<div class=\"overlay-card stranded-card\"",
  "document.getElementById('quiz-category').textContent = '🌎 PREGUNTA DE ENTRENAMIENTO'"
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió lógica duplicada de tutorial o bitácora: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js delega tutorial guiado y bitácora de cierre.');
