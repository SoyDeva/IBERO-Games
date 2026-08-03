import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/space-game.js';
let source = readFileSync(file, 'utf8');

const before = `  update(delta) {
    Object.assign(this, advanceFlightVitals(this, delta));

    const fuelOutcome = resolveFuelDepletion(this);`;
const after = `  update(delta) {
    Object.assign(this, advanceFlightVitals(this, delta));
    const difficulty = this.getDifficulty();

    const fuelOutcome = resolveFuelDepletion(this);`;

if (!source.includes("from './core/flight-simulation.js?v=23'")) {
  throw new Error('La conexión de simulación no está presente en space-game.js.');
}
if (!source.includes(before)) {
  throw new Error('No se encontró el punto exacto para restaurar difficulty.');
}

source = source.replace(before, after);

if (!source.includes('const difficulty = this.getDifficulty();')) {
  throw new Error('No se restauró el cálculo de dificultad.');
}

writeFileSync(file, source);
console.log('Se restauró el cálculo local de dificultad en update().');
