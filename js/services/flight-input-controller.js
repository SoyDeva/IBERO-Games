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

export function createFlightInputController({
  windowRef,
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

  return {
    bind() {
      if (bound) return false;
      windowRef.addEventListener('keydown', onKey);
      canvas.addEventListener('pointerdown', onPointer);
      bound = true;
      return true;
    },
    destroy() {
      if (!bound) return false;
      windowRef.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
      bound = false;
      return true;
    },
    isBound() {
      return bound;
    },
    onKey,
    onPointer
  };
}
