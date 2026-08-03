import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/app.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar sesión de preguntas',
  "import { createRankingController } from './services/ranking-controller.js?v=23';",
  "import { createRankingController } from './services/ranking-controller.js?v=23';\nimport { createQuestionSession } from './services/question-session.js?v=23';"
);
replaceOnce(
  'importar panel de preguntas',
  "import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';",
  "import { renderCredits, renderInstructions, renderTeacher } from './ui/static-screens.js?v=23';\nimport { presentQuizPanel, resetQuizPanel, revealQuizAnswer } from './ui/quiz-panel.js?v=23';"
);

replaceOnce('retirar barajas globales', 'const questionDecks = new Map();\n', '');

replaceOnce(
  'crear sesión de preguntas',
  "const rankingController = createRankingController({ loadLeaderboard: getGalacticLeaderboard, submitScore: submitGalacticScore });",
  `const rankingController = createRankingController({ loadLeaderboard: getGalacticLeaderboard, submitScore: submitGalacticScore });
const questionSession = createQuestionSession({
  resolveLevel: levelForPortal,
  createDeck: shuffledQuestions,
  shuffleOptions: shuffledQuestionOptions
});`
);

replaceOnce(
  'extraer selección, presentación y retroalimentación de preguntas',
  /function nextQuestion\(portalNumber\) \{[\s\S]*?\n\}\n\nfunction showGameOver\(result\) \{/,
  `function showQuiz(meta) {
  const question = questionSession.next(meta.number);
  currentCheckpointClean = Boolean(meta.clean && meta.number > 1);
  presentQuizPanel({ documentRef: document, question, onAnswer: answerQuestion });
  playTone('complete');
  announce('Puesto de recarga. Responde la pregunta para continuar.');
}

function answerQuestion(selectedIndex) {
  const panel = document.getElementById('quiz-panel');
  if (!panel || panel.dataset.answered === 'true') return;
  const outcome = questionSession.answer(selectedIndex, flightMode);
  if (!outcome) return;

  revealQuizAnswer({ documentRef: document, outcome });
  lastLearnedFact = outcome.fact;

  if (outcome.correct) {
    playTone('core');
    quizTimer = window.setTimeout(() => {
      resetQuizPanel({ documentRef: document });
      const progress = flight.answerCorrect();
      const earnedCrystals = awardCrystals(12);
      if (flight.totalCorrect >= 1) unlockAchievement('first_portal');
      if (currentCheckpointClean) unlockAchievement('clean_pilot');
      if (flight.bestStreak >= 3) unlockAchievement('streak_three');
      if (progress?.stationReached) {
        showStation(progress);
        return;
      } else if (progress?.ammoRecharged) {
        showToast('⚡ NIVEL ' + progress.completedLevel + ' · PLASMA RECARGADO · +' + earnedCrystals + ' 💎', 'plasma');
      } else if (progress?.sectorChanged) {
        showToast(progress.sector.icon + ' NUEVO SECTOR · ' + progress.sector.name.toUpperCase() + ' · +' + earnedCrystals + ' 💎', 'success');
      } else {
        showToast('⛽ +38% · NIVEL ' + (flight.checkpoints + 1) + ' · +' + earnedCrystals + ' 💎', 'success');
      }
      document.getElementById('flight-canvas')?.focus();
    }, outcome.delayMs);
  } else {
    playTone('alert');
    quizTimer = window.setTimeout(() => {
      resetQuizPanel({ documentRef: document });
      if (outcome.practice) {
        const progress = flight.answerPracticeMistake();
        if (progress?.ammoRecharged) {
          showToast('⚡ PRÁCTICA NIVEL ' + progress.completedLevel + ' · PLASMA RECARGADO', 'plasma');
        } else if (progress?.sectorChanged) {
          showToast(progress.sector.icon + ' PRÁCTICA EN ' + progress.sector.name.toUpperCase(), 'success');
        } else {
          showToast('🧪 SEGUIMOS PRACTICANDO · +24% COMBUSTIBLE', 'success');
        }
        document.getElementById('flight-canvas')?.focus();
      } else {
        flight.strand('La respuesta no fue correcta. ' + outcome.fact);
      }
    }, outcome.delayMs);
  }
}

function showGameOver(result) {`
);

for (const forbidden of [
  'const questionDecks = new Map()',
  'function nextQuestion(portalNumber)',
  'currentQuestion = shuffledQuestionOptions(deck.pop())',
  "document.getElementById('quiz-category').textContent = question.icon"
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió lógica de preguntas duplicada: ${forbidden}`);
}

writeFileSync(file, source);
console.log('app.js delega barajas, evaluación y panel de preguntas.');
