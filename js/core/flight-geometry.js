const CANVAS_METRICS = new WeakMap();

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

export function resizeFlightCanvas({ canvas, context, devicePixelRatio = 1, maxPixelRatio = 2 } = {}) {
  if (!canvas?.getBoundingClientRect || !context?.setTransform) {
    throw new TypeError('Se requiere un canvas y un contexto compatibles.');
  }
  const rect = canvas.getBoundingClientRect();
  const ratioLimit = Math.min(2, Math.max(1, finite(maxPixelRatio, 2)));
  const ratio = Math.min(Math.max(1, finite(devicePixelRatio, 1)), ratioLimit);
  const width = Math.max(320, finite(rect?.width, 960) || 960);
  const height = Math.max(420, finite(rect?.height, 600) || 600);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  const previous = CANVAS_METRICS.get(canvas);
  const changed = !previous
    || previous.pixelWidth !== pixelWidth
    || previous.pixelHeight !== pixelHeight
    || previous.ratio !== ratio;

  if (changed) {
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    CANVAS_METRICS.set(canvas, { pixelWidth, pixelHeight, ratio });
  }
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
