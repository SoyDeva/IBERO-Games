import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFlightInputController,
  keyboardFlightCommand,
  pointerFlightLane
} from '../js/services/flight-input-controller.js';

test('interpreta flechas y teclas A/D como movimiento', () => {
  assert.deepEqual(keyboardFlightCommand({ key: 'ArrowLeft' }, 'paused'), {
    handled: true,
    preventDefault: true,
    action: 'move',
    direction: -1
  });
  assert.equal(keyboardFlightCommand({ key: 'A' }, 'running').direction, -1);
  assert.equal(keyboardFlightCommand({ key: 'ArrowRight' }, 'running').direction, 1);
  assert.equal(keyboardFlightCommand({ key: 'd' }, 'quiz').direction, 1);
});

test('la barra dispara únicamente durante el vuelo y bloquea repetición automática', () => {
  assert.deepEqual(keyboardFlightCommand({ key: ' ', code: 'Space', repeat: false }, 'running'), {
    handled: true,
    preventDefault: true,
    action: 'fire'
  });
  assert.equal(keyboardFlightCommand({ key: ' ', code: 'Space', repeat: true }, 'running').action, 'none');
  assert.equal(keyboardFlightCommand({ key: ' ', code: 'Space' }, 'paused').handled, false);
  assert.equal(keyboardFlightCommand({ key: 'x' }, 'running').handled, false);
});

test('convierte el puntero en carril por tercios del canvas', () => {
  assert.equal(pointerFlightLane({ clientX: 100, left: 100, width: 300, mode: 'running' }), -1);
  assert.equal(pointerFlightLane({ clientX: 250, left: 100, width: 300, mode: 'running' }), 0);
  assert.equal(pointerFlightLane({ clientX: 399, left: 100, width: 300, mode: 'running' }), 1);
  assert.equal(pointerFlightLane({ clientX: 100, left: 100, width: 300, mode: 'paused' }), null);
});

test('enlaza, ejecuta y retira los eventos sin duplicarlos', () => {
  const windowListeners = new Map();
  const canvasListeners = new Map();
  const windowRef = {
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (windowListeners.get(type) === listener) windowListeners.delete(type);
    }
  };
  const canvas = {
    addEventListener(type, listener) { canvasListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (canvasListeners.get(type) === listener) canvasListeners.delete(type);
    },
    getBoundingClientRect() { return { left: 10, width: 300 }; }
  };
  const movements = [];
  const lanes = [];
  let shots = 0;
  let mode = 'running';
  const controller = createFlightInputController({
    windowRef,
    canvas,
    getMode: () => mode,
    moveLane: (direction) => movements.push(direction),
    setLane: (lane) => lanes.push(lane),
    fire: () => { shots += 1; }
  });

  assert.equal(controller.bind(), true);
  assert.equal(controller.bind(), false);
  assert.equal(controller.isBound(), true);

  let prevented = 0;
  windowListeners.get('keydown')({ key: 'ArrowLeft', preventDefault() { prevented += 1; } });
  windowListeners.get('keydown')({ key: ' ', code: 'Space', repeat: false, preventDefault() { prevented += 1; } });
  canvasListeners.get('pointerdown')({ clientX: 305 });

  assert.deepEqual(movements, [-1]);
  assert.equal(shots, 1);
  assert.deepEqual(lanes, [1]);
  assert.equal(prevented, 2);

  mode = 'paused';
  canvasListeners.get('pointerdown')({ clientX: 20 });
  assert.deepEqual(lanes, [1]);

  assert.equal(controller.destroy(), true);
  assert.equal(controller.destroy(), false);
  assert.equal(controller.isBound(), false);
  assert.equal(windowListeners.size, 0);
  assert.equal(canvasListeners.size, 0);
});

test('rechaza dependencias incompletas', () => {
  assert.throws(() => createFlightInputController({}), /ventana/);
});
