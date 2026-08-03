function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function easeIn(value) {
  const normalized = finite(value);
  return normalized * normalized;
}

export function resizeFlightCanvas({ canvas, context, devicePixelRatio = 1 } = {}) {
  if (!canvas?.getBoundingClientRect || !context?.setTransform) {
    throw new TypeError('Se requiere un canvas y un contexto compatibles.');
  }
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(Math.max(1, finite(devicePixelRatio, 1)), 2);
  const width = Math.max(320, finite(rect?.width, 960) || 960);
  const height = Math.max(420, finite(rect?.height, 600) || 600);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width, height, ratio };
}

export function projectFlightPoint({ width, height, lane, depth } = {}) {
  const safeWidth = Math.max(0, finite(width));
  const safeHeight = Math.max(0, finite(height));
  const progress = easeIn(depth);
  const horizon = safeHeight * .235;
  return {
    x: safeWidth / 2 + finite(lane) * (safeWidth * (.035 + progress * .255)),
    y: horizon + progress * (safeHeight * .69),
    scale: .1 + progress * 1.22
  };
}
