import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFlightInputController,
  flightControlCommand,
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

test('traduce los controles visibles y los bloquea fuera del vuelo activo', () => {
  assert.deepEqual(flightControlCommand('mobile-steer-left', 'running'), {
    handled: true,
    preventDefault: true,
    action: 'move',
    direction: -1
  });
  assert.deepEqual(flightControlCommand('mobile-fire-plasma', 'running'), {
    handled: true,
    preventDefault: true,
    action: 'fire'
  });
  assert.equal(flightControlCommand('mobile-fire-plasma', 'paused').action, 'none');
  assert.equal(flightControlCommand('unknown', 'running').handled, false);
});

function createControlButton(id) {
  const listeners = new Map();
  const classes = new Set();
  return {
    id,
    listeners,
    captured: null,
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    setPointerCapture(pointerId) { this.captured = pointerId; }
  };
}

test('enlaza puntero, teclado y controles táctiles sin disparos duplicados', () => {
  const windowListeners = new Map();
  const canvasListeners = new Map();
  let time = 1000;
  const windowRef = {
    performance: { now: () => time },
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
  const controls = new Map([
    ['mobile-steer-left', createControlButton('mobile-steer-left')],
    ['mobile-steer-right', createControlButton('mobile-steer-right')],
    ['mobile-fire-plasma', createControlButton('mobile-fire-plasma')]
  ]);
  const documentRef = { getElementById: (id) => controls.get(id) || null };
  const movements = [];
  const lanes = [];
  let shots = 0;
  let mode = 'running';
  const controller = createFlightInputController({
    windowRef,
    documentRef,
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

  const fireButton = controls.get('mobile-fire-plasma');
  let stopped = 0;
  fireButton.listeners.get('pointerdown')({
    currentTarget: fireButton,
    pointerId: 7,
    button: 0,
    isPrimary: true,
    preventDefault() { prevented += 1; },
    stopImmediatePropagation() { stopped += 1; }
  });
  assert.equal(fireButton.captured, 7);
  assert.equal(fireButton.classList.contains('is-pressed'), true);
  assert.equal(shots, 2);

  time += 120;
  fireButton.listeners.get('click')({
    currentTarget: fireButton,
    preventDefault() { prevented += 1; },
    stopImmediatePropagation() { stopped += 1; }
  });
  assert.equal(shots, 2, 'el click sintético posterior al pointerdown no repite el disparo');

  fireButton.listeners.get('pointerup')({ currentTarget: fireButton });
  assert.equal(fireButton.classList.contains('is-pressed'), false);

  time += 1000;
  fireButton.listeners.get('click')({
    currentTarget: fireButton,
    preventDefault() { prevented += 1; },
    stopImmediatePropagation() { stopped += 1; }
  });
  assert.equal(shots, 3, 'un click de teclado o accesibilidad sigue disparando');

  controls.get('mobile-steer-left').listeners.get('pointerdown')({
    currentTarget: controls.get('mobile-steer-left'),
    pointerId: 8,
    button: 0,
    isPrimary: true,
    preventDefault() {},
    stopImmediatePropagation() {}
  });
  assert.deepEqual(movements, [-1, -1]);
  assert.deepEqual(lanes, [1]);
  assert.equal(prevented, 5);
  assert.equal(stopped, 3);

  mode = 'paused';
  controls.get('mobile-steer-right').listeners.get('pointerdown')({
    currentTarget: controls.get('mobile-steer-right'),
    pointerId: 9,
    button: 0,
    isPrimary: true,
    preventDefault() {},
    stopImmediatePropagation() {}
  });
  assert.deepEqual(movements, [-1, -1]);

  assert.equal(controller.destroy(), true);
  assert.equal(controller.destroy(), false);
  assert.equal(controller.isBound(), false);
  assert.equal(windowListeners.size, 0);
  assert.equal(canvasListeners.size, 0);
  controls.forEach((button) => assert.equal(button.listeners.size, 0));
});

test('rechaza dependencias incompletas', () => {
  assert.throws(() => createFlightInputController({}), /ventana/);
});
