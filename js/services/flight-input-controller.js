const FLIGHT_CONTROL_BINDINGS = Object.freeze({
  'steer-left': Object.freeze({ action: 'move', direction: -1 }),
  'mobile-steer-left': Object.freeze({ action: 'move', direction: -1 }),
  'steer-right': Object.freeze({ action: 'move', direction: 1 }),
  'mobile-steer-right': Object.freeze({ action: 'move', direction: 1 }),
  'fire-plasma': Object.freeze({ action: 'fire' }),
  'mobile-fire-plasma': Object.freeze({ action: 'fire' })
});

const CONTROL_IDS = Object.freeze(Object.keys(FLIGHT_CONTROL_BINDINGS));
const SYNTHETIC_CLICK_WINDOW_MS = 800;

export function keyboardFlightCommand(event, mode) {
  const key = String(event?.key || '');
  if (['ArrowLeft', 'a', 'A'].includes(key)) {
    return { handled: true, preventDefault: true, action: 'move', direction: -1 };
  }
  if (['ArrowRight', 'd', 'D'].includes(key)) {
    return { handled: true, preventDefault: true, action: 'move', direction: 1 };
  }
  const space = event?.code === 'Space' || key === ' ';
  if (space && mode === 'running') {
    return {
      handled: true,
      preventDefault: true,
      action: event?.repeat ? 'none' : 'fire'
    };
  }
  return { handled: false, preventDefault: false, action: 'none' };
}

export function pointerFlightLane({ clientX, left, width, mode } = {}) {
  if (mode !== 'running') return null;
  const safeWidth = Math.max(1, Number(width) || 0);
  const position = ((Number(clientX) || 0) - (Number(left) || 0)) / safeWidth;
  if (position < 1 / 3) return -1;
  if (position > 2 / 3) return 1;
  return 0;
}

export function flightControlCommand(id, mode) {
  const binding = FLIGHT_CONTROL_BINDINGS[String(id || '')];
  if (!binding) return { handled: false, preventDefault: false, action: 'none' };
  if (mode !== 'running') return { handled: true, preventDefault: true, action: 'none' };
  return { handled: true, preventDefault: true, ...binding };
}

export function createFlightInputController({
  windowRef,
  documentRef = windowRef?.document,
  canvas,
  getMode,
  moveLane,
  setLane,
  fire
} = {}) {
  if (!windowRef?.addEventListener || !windowRef?.removeEventListener) {
    throw new TypeError('Se requiere una ventana compatible con eventos.');
  }
  if (!canvas?.addEventListener || !canvas?.removeEventListener || !canvas?.getBoundingClientRect) {
    throw new TypeError('Se requiere un canvas compatible con eventos.');
  }
  if (typeof getMode !== 'function' || typeof moveLane !== 'function' || typeof setLane !== 'function' || typeof fire !== 'function') {
    throw new TypeError('Se requieren callbacks completos para controlar el vuelo.');
  }

  let bound = false;
  let controlButtons = [];
  const pointerActivatedAt = new WeakMap();
  const now = () => Number(windowRef.performance?.now?.()) || Date.now();

  const executeControl = (button) => {
    const command = flightControlCommand(button?.id, getMode());
    if (!command.handled || command.action === 'none') return false;
    if (command.action === 'move') moveLane(command.direction);
    if (command.action === 'fire') fire();
    return true;
  };

  const onKey = (event) => {
    const command = keyboardFlightCommand(event, getMode());
    if (!command.handled) return;
    if (command.preventDefault) event.preventDefault?.();
    if (command.action === 'move') moveLane(command.direction);
    if (command.action === 'fire') fire();
  };

  const onPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    const lane = pointerFlightLane({
      clientX: event?.clientX,
      left: rect.left,
      width: rect.width,
      mode: getMode()
    });
    if (lane !== null) setLane(lane);
  };

  const onControlPointerDown = (event) => {
    if (event?.isPrimary === false) return;
    if (Number.isFinite(event?.button) && event.button !== 0) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const button = event.currentTarget;
    pointerActivatedAt.set(button, now());
    button.classList?.add?.('is-pressed');
    try { button.setPointerCapture?.(event.pointerId); } catch (error) { /* Safari puede rechazar captura durante cambios de viewport. */ }
    executeControl(button);
  };

  const releaseControl = (event) => {
    event.currentTarget?.classList?.remove?.('is-pressed');
  };

  const onControlClick = (event) => {
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const button = event.currentTarget;
    const elapsed = now() - (pointerActivatedAt.get(button) ?? -Infinity);
    if (elapsed >= 0 && elapsed < SYNTHETIC_CLICK_WINDOW_MS) return;
    executeControl(button);
  };

  const bindControlButton = (button) => {
    button.addEventListener('pointerdown', onControlPointerDown, { passive: false });
    button.addEventListener('pointerup', releaseControl);
    button.addEventListener('pointercancel', releaseControl);
    button.addEventListener('lostpointercapture', releaseControl);
    button.addEventListener('click', onControlClick);
  };

  const unbindControlButton = (button) => {
    button.removeEventListener('pointerdown', onControlPointerDown);
    button.removeEventListener('pointerup', releaseControl);
    button.removeEventListener('pointercancel', releaseControl);
    button.removeEventListener('lostpointercapture', releaseControl);
    button.removeEventListener('click', onControlClick);
    button.classList?.remove?.('is-pressed');
  };

  return {
    bind() {
      if (bound) return false;
      windowRef.addEventListener('keydown', onKey);
      canvas.addEventListener('pointerdown', onPointer);
      controlButtons = CONTROL_IDS
        .map((id) => documentRef?.getElementById?.(id))
        .filter(Boolean);
      controlButtons.forEach(bindControlButton);
      bound = true;
      return true;
    },
    destroy() {
      if (!bound) return false;
      windowRef.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
      controlButtons.forEach(unbindControlButton);
      controlButtons = [];
      bound = false;
      return true;
    },
    isBound() {
      return bound;
    },
    onKey,
    onPointer,
    onControlPointerDown,
    onControlClick
  };
}
