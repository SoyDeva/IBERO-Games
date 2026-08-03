import { readFileSync, writeFileSync } from 'node:fs';

const flightPath = 'js/space-game.js';
const rendererPath = 'js/ui/flight-renderer.js';
let source = readFileSync(flightPath, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

const renderStart = source.indexOf('  project(lane, depth) {');
const renderEnd = source.indexOf('  destroy() {', renderStart);
if (renderStart < 0 || renderEnd < 0 || renderEnd <= renderStart) {
  throw new Error('No se encontró el bloque exacto de geometría y dibujo.');
}
const renderMethods = source.slice(renderStart, renderEnd);

const rendererSource = `import { FLIGHT_LANES } from '../core/flight-simulation.js?v=23';
import { clamp, easeIn } from '../core/flight-geometry.js?v=23';
import { SHIP_SKINS, SHIP_TRAILS } from '../config/ship-catalog.js?v=23';

class FlightRenderer {
  constructor(flight) {
    if (!flight?.context) throw new TypeError('Se requiere una sesión de vuelo con contexto Canvas.');
    this.flight = flight;
    return new Proxy(this, {
      get(target, property, receiver) {
        if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
        const value = flight[property];
        return typeof value === 'function' ? value.bind(flight) : value;
      },
      set(target, property, value, receiver) {
        if (Reflect.has(target, property)) return Reflect.set(target, property, value, receiver);
        flight[property] = value;
        return true;
      }
    });
  }

${renderMethods.trimStart()}}

export function createFlightRenderer(flight) {
  return new FlightRenderer(flight);
}
`;

source = `${source.slice(0, renderStart)}  draw() {\n    this.renderer.draw();\n  }\n\n${source.slice(renderEnd)}`;

replaceOnce(
  'importar catálogos, geometría y renderizador',
  "import { createFlightInputController } from './services/flight-input-controller.js?v=23';",
  `import { createFlightInputController } from './services/flight-input-controller.js?v=23';
import { SHIP_SKINS, SHIP_TRAILS } from './config/ship-catalog.js?v=23';
import { clamp, resizeFlightCanvas } from './core/flight-geometry.js?v=23';
import { createFlightRenderer } from './ui/flight-renderer.js?v=23';

export { SHIP_SKINS, SHIP_TRAILS };`
);

replaceOnce(
  'retirar catálogos y utilidades visuales duplicadas',
  /export const SHIP_SKINS = Object\.freeze\(\{[\s\S]*?export const SHIP_TRAILS = Object\.freeze\(\{[\s\S]*?\n\}\);\nfunction clamp\(value, minimum, maximum\) \{[\s\S]*?\n\}\n\nfunction easeIn\(value\) \{[\s\S]*?\n\}\n/,
  ''
);

replaceOnce(
  'crear renderizador de la sesión',
  "    this.context = canvas.getContext('2d');\n    this.callbacks = callbacks;",
  "    this.context = canvas.getContext('2d');\n    this.callbacks = callbacks;\n    this.renderer = createFlightRenderer(this);"
);

replaceOnce(
  'delegar redimensionamiento del canvas',
  /  resize\(\) \{[\s\S]*?\n  \}\n\n  start\(options = \{\}\) \{/,
  `  resize() {
    const metrics = resizeFlightCanvas({
      canvas: this.canvas,
      context: this.context,
      devicePixelRatio: window.devicePixelRatio
    });
    this.width = metrics.width;
    this.height = metrics.height;
  }

  start(options = {}) {`
);

replaceOnce(
  'desmontar el controlador de entrada',
  /  destroy\(\) \{\n    cancelAnimationFrame\(this\.frameId\);\n    this\.resizeObserver\.disconnect\(\);\n    window\.removeEventListener\('keydown', this\.boundKey\);\n    this\.canvas\.removeEventListener\('pointerdown', this\.boundPointer\);\n  \}/,
  `  destroy() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.inputController.destroy();
  }`
);

for (const forbidden of [
  'export const SHIP_SKINS =',
  'function easeIn(value)',
  '  project(lane, depth) {',
  '  drawSpace(ctx) {',
  "window.removeEventListener('keydown', this.boundKey)",
  "this.canvas.removeEventListener('pointerdown', this.boundPointer)"
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió lógica visual duplicada: ${forbidden}`);
}

if (!rendererSource.includes('drawShip(ctx)') || !rendererSource.includes('drawExplosion(ctx, explosion)')) {
  throw new Error('El renderizador generado quedó incompleto.');
}
if (!source.includes('this.renderer.draw();') || !source.includes('this.inputController.destroy();')) {
  throw new Error('SpaceFlight no quedó conectado al renderizador y al ciclo de vida.');
}

writeFileSync(rendererPath, rendererSource);
writeFileSync(flightPath, source);
console.log('SpaceFlight delega catálogos, geometría, Canvas y desmontaje de entrada.');
