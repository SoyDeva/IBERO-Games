import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/space-game.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar controlador de entrada',
  "} from './core/flight-simulation.js?v=23';",
  "} from './core/flight-simulation.js?v=23';\nimport { createFlightInputController } from './services/flight-input-controller.js?v=23';"
);

replaceOnce(
  'conectar controlador de entrada en el constructor',
  `    this.boundFrame = (time) => this.frame(time);
    this.boundKey = (event) => this.onKey(event);
    this.boundPointer = (event) => this.onPointer(event);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    window.addEventListener('keydown', this.boundKey);
    canvas.addEventListener('pointerdown', this.boundPointer);`,
  `    this.boundFrame = (time) => this.frame(time);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.inputController = createFlightInputController({
      windowRef: window,
      canvas,
      getMode: () => this.mode,
      moveLane: (direction) => this.moveLane(direction),
      setLane: (lane) => this.setLane(lane),
      fire: () => this.fire()
    });
    this.inputController.bind();`
);

replaceOnce(
  'retirar interpretación directa de eventos',
  /\n  onKey\(event\) \{[\s\S]*?\n  \}\n\n  onPointer\(event\) \{[\s\S]*?\n  \}\n\n  answerCorrect\(\) \{/,
  '\n  answerCorrect() {'
);

for (const forbidden of [
  'this.boundKey =',
  'this.boundPointer =',
  "window.addEventListener('keydown'",
  "canvas.addEventListener('pointerdown'",
  'onKey(event) {',
  'onPointer(event) {'
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió entrada duplicada en SpaceFlight: ${forbidden}`);
}

if (!source.includes('this.inputController.bind();')) {
  throw new Error('No quedó enlazado el controlador de entrada.');
}

writeFileSync(file, source);
console.log('SpaceFlight delega teclado y puntero al controlador de entrada.');
