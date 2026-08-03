import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(source, label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  return next;
}

const appPath = 'js/app.js';
let app = readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  'estado inicial de la sesión pedagógica',
  'let pendingPilotAction = null;',
  'let pendingPilotAction = null;\nlet learningSessionBaseline = null;'
);

app = replaceOnce(
  app,
  'vista docente con progreso local',
  'function renderFlight() {',
  "function renderTeacherView() {\n  return renderTeacher({ learning: learningProgressStore.summary(), pilotName: getPilotName() });\n}\n\nfunction renderFlight() {"
);

app = replaceOnce(
  app,
  'ruta docente dinámica',
  'const screens = { home: renderHome, flight: renderFlight, shop: renderShop, ranking: renderRanking, instructions: renderInstructions, teacher: renderTeacher, credits: renderCredits };',
  'const screens = { home: renderHome, flight: renderFlight, shop: renderShop, ranking: renderRanking, instructions: renderInstructions, teacher: renderTeacherView, credits: renderCredits };'
);

app = replaceOnce(
  app,
  'acción de impresión docente',
  "  app.querySelectorAll('[data-refresh-ranking]').forEach((button) => button.addEventListener('click', () => refreshGlobalRanking(true)));",
  "  app.querySelectorAll('[data-refresh-ranking]').forEach((button) => button.addEventListener('click', () => refreshGlobalRanking(true)));\n  app.querySelector('[data-print-learning-report]')?.addEventListener('click', () => window.print());"
);

app = replaceOnce(
  app,
  'inicio de línea base pedagógica',
  "  lastLearnedFact = '';\n  const economy = loadEconomy();",
  "  lastLearnedFact = '';\n  learningSessionBaseline = learningProgressStore.load();\n  const economy = loadEconomy();"
);

app = replaceOnce(
  app,
  'cierre de sesión pedagógica',
  "function showGameOver(result) {\n  stopMusic();",
  "function showGameOver(result) {\n  stopMusic();\n  learningProgressStore.completeSession({\n    baseline: learningSessionBaseline,\n    mode: flightMode,\n    result\n  });\n  learningSessionBaseline = null;"
);

for (const required of [
  'let learningSessionBaseline = null;',
  'function renderTeacherView()',
  'teacher: renderTeacherView',
  "data-print-learning-report",
  'learningSessionBaseline = learningProgressStore.load();',
  'learningProgressStore.completeSession({'
]) {
  if (!app.includes(required)) throw new Error(`Falta integración requerida: ${required}`);
}

writeFileSync(appPath, app);

const docsPath = 'docs/architecture.md';
let docs = readFileSync(docsPath, 'utf8');
docs = replaceOnce(
  docs,
  'reglas puras de sesiones y metas',
  '- selección adaptativa moderada sin excluir preguntas del nivel.',
  '- selección adaptativa moderada sin excluir preguntas del nivel;\n- historial normalizado de sesiones y metas pedagógicas derivadas del desempeño.'
);
docs = replaceOnce(
  docs,
  'servicio de progreso ampliado',
  '`learning-progress-store.js` persiste localmente aciertos, errores y rachas por categoría, con tolerancia a almacenamiento bloqueado.',
  '`learning-progress-store.js` persiste localmente aciertos, errores, rachas, sesiones recientes y cumplimiento de metas, con tolerancia a almacenamiento bloqueado.'
);
docs = replaceOnce(
  docs,
  'panel docente documentado',
  '- `learning-progress-panel.js` muestra métricas, fortalezas, temas de refuerzo y la recomendación para la siguiente práctica.',
  '- `learning-progress-panel.js` muestra métricas, fortalezas, temas de refuerzo, metas y la última sesión.\n- `teacher-learning-report.js` genera una lectura local por categorías y sesiones, preparada para impresión y sin convertir porcentajes en calificaciones.'
);
docs = replaceOnce(
  docs,
  'coordinación de sesiones documentada',
  'registro de desempeño por categoría, selección adaptativa moderada, Estación Nova',
  'registro de desempeño por categoría, selección adaptativa moderada, inicio y cierre de sesiones pedagógicas, Estación Nova'
);
docs = replaceOnce(
  docs,
  'fase 16 completada',
  '16. Historial por sesiones, metas pedagógicas y herramientas para docentes.',
  '16. Historial por sesiones, metas pedagógicas y herramientas para docentes. **Completado.**\n17. Metas configurables, exportación voluntaria y seguimiento longitudinal opcional.'
);
writeFileSync(docsPath, docs);

console.log('Sesiones, metas y lectura docente conectadas correctamente.');
