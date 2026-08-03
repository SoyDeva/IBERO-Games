import { readFileSync, writeFileSync } from 'node:fs';

function updateFile(path, transform) {
  const source = readFileSync(path, 'utf8');
  const next = transform(source);
  if (next === source) throw new Error(`No se aplicaron cambios en ${path}.`);
  writeFileSync(path, next);
}

function replaceOnce(source, label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  return next;
}

updateFile('js/app.js', (initial) => {
  let source = initial;
  source = replaceOnce(
    source,
    'importar adaptación y progreso',
    "import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';",
    "import { equipHangarItem, purchaseHangarItem } from './core/hangar.js?v=23';\nimport { adaptiveQuestionIndex } from './core/question-adaptation.js?v=23';"
  );
  source = replaceOnce(
    source,
    'importar almacén pedagógico',
    "import { createEconomyStore } from './services/economy-store.js?v=23';",
    "import { createEconomyStore } from './services/economy-store.js?v=23';\nimport { createLearningProgressStore } from './services/learning-progress-store.js?v=23';"
  );
  source = replaceOnce(
    source,
    'crear almacén pedagógico y selector adaptativo',
    `const rankingController = createRankingController({ loadLeaderboard: getGalacticLeaderboard, submitScore: submitGalacticScore });
const questionSession = createQuestionSession({
  resolveLevel: levelForPortal,
  createDeck: shuffledQuestions,
  shuffleOptions: shuffledQuestionOptions
});`,
    `const rankingController = createRankingController({ loadLeaderboard: getGalacticLeaderboard, submitScore: submitGalacticScore });
const learningProgressStore = createLearningProgressStore();
const questionSession = createQuestionSession({
  resolveLevel: levelForPortal,
  createDeck: shuffledQuestions,
  shuffleOptions: shuffledQuestionOptions,
  selectQuestion: (deck, context) => adaptiveQuestionIndex(deck, { progress: context.progress })
});`
  );
  source = replaceOnce(
    source,
    'mostrar resumen pedagógico en inicio',
    `    learned: localStorage.getItem('nebula-tutorial-complete') === 'true',
    achievements: ACHIEVEMENTS
  });`,
    `    learned: localStorage.getItem('nebula-tutorial-complete') === 'true',
    achievements: ACHIEVEMENTS,
    learning: learningProgressStore.summary()
  });`
  );
  source = replaceOnce(
    source,
    'entregar progreso al seleccionar pregunta',
    '  const question = questionSession.next(meta.number);',
    '  const question = questionSession.next(meta.number, { progress: learningProgressStore.load() });'
  );
  source = replaceOnce(
    source,
    'registrar respuesta pedagógica',
    `  const outcome = questionSession.answer(selectedIndex, flightMode);
  if (!outcome) return;

  revealQuizAnswer({ documentRef: document, outcome });`,
    `  const outcome = questionSession.answer(selectedIndex, flightMode);
  if (!outcome) return;
  learningProgressStore.record({
    question: questionSession.getCurrent(),
    correct: outcome.correct,
    mode: flightMode
  });

  revealQuizAnswer({ documentRef: document, outcome });`
  );

  for (const expected of [
    'createLearningProgressStore',
    'adaptiveQuestionIndex',
    'learningProgressStore.summary()',
    'learningProgressStore.record({',
    'questionSession.next(meta.number, { progress: learningProgressStore.load() })'
  ]) {
    if (!source.includes(expected)) throw new Error(`Falta integración pedagógica: ${expected}`);
  }
  return source;
});

updateFile('index.html', (source) => replaceOnce(
  source,
  'cargar estilos pedagógicos',
  '  <link rel="stylesheet" href="css/styles.css?v=23">',
  '  <link rel="stylesheet" href="css/styles.css?v=23">\n  <link rel="stylesheet" href="css/learning-progress.css?v=23">'
));

updateFile('docs/architecture.md', (initial) => {
  let source = initial;
  source = replaceOnce(
    source,
    'documentar reglas pedagógicas',
    '- límites, perspectiva y redimensionamiento de la superficie de vuelo.',
    '- límites, perspectiva y redimensionamiento de la superficie de vuelo;\n- normalización del progreso pedagógico, rachas, fortalezas y categorías de refuerzo;\n- selección adaptativa moderada sin excluir preguntas del nivel.'
  );
  source = replaceOnce(
    source,
    'documentar almacén pedagógico',
    '`question-session.js` administra una baraja por nivel, selecciona la siguiente pregunta y conserva la pregunta activa para evaluarla.',
    '`question-session.js` administra una baraja por nivel, selecciona la siguiente pregunta y conserva la pregunta activa para evaluarla. `learning-progress-store.js` persiste localmente aciertos, errores y rachas por categoría, con tolerancia a almacenamiento bloqueado.'
  );
  source = replaceOnce(
    source,
    'documentar panel pedagógico',
    '- `home-screen.js` representa perfil, récord, logros, cristales y nave activa.',
    '- `home-screen.js` representa perfil, récord, logros, cristales, nave activa y el resumen pedagógico.\n- `learning-progress-panel.js` muestra métricas, fortalezas, temas de refuerzo y la recomendación para la siguiente práctica.'
  );
  source = replaceOnce(
    source,
    'documentar coordinación pedagógica',
    'presentación pedagógica, Estación Nova, pausa, tutorial guiado y bitácora de cierre.',
    'presentación pedagógica, registro de desempeño por categoría, selección adaptativa moderada, Estación Nova, pausa, tutorial guiado y bitácora de cierre.'
  );
  source = replaceOnce(
    source,
    'completar fase pedagógica',
    '15. Panel pedagógico y adaptación por categorías sobre la arquitectura modular.',
    '15. Panel pedagógico y adaptación por categorías sobre la arquitectura modular. **Completado.**\n16. Historial por sesiones, metas pedagógicas y herramientas para docentes.'
  );
  return source;
});

console.log('Progreso pedagógico conectado a app.js, portada y arquitectura.');
