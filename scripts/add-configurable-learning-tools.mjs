import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(source, label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  return next;
}

const path = 'js/app.js';
let source = readFileSync(path, 'utf8');

source = replaceOnce(
  source,
  'importación del controlador pedagógico',
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';",
  "import { bindNavigation } from './ui/navigation-bindings.js?v=23';\nimport { bindLearningTools } from './ui/learning-tools-controller.js?v=23';"
);

source = replaceOnce(
  source,
  'enlace de herramientas pedagógicas',
  "  app.querySelector('[data-print-learning-report]')?.addEventListener('click', () => window.print());",
  "  bindLearningTools({\n    root: app,\n    store: learningProgressStore,\n    pilotName: getPilotName(),\n    onChanged: (message) => {\n      announce(message);\n      render();\n    },\n    documentRef: document,\n    windowRef: window\n  });"
);

if ((source.match(/bindLearningTools/g) || []).length !== 2) {
  throw new Error('La integración del controlador quedó duplicada o incompleta.');
}

writeFileSync(path, source);