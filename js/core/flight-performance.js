export const FLIGHT_QUALITY_PROFILES = Object.freeze({
  economy: Object.freeze({
    id: 'economy',
    pixelRatioCap: 1.25,
    starCount: 46,
    particleRatio: .38,
    renderEvery: 2,
    idleRenderEvery: 3,
    hudInterval: 150,
    detailRatio: .52
  }),
  balanced: Object.freeze({
    id: 'balanced',
    pixelRatioCap: 2,
    starCount: 72,
    particleRatio: .68,
    renderEvery: 1,
    idleRenderEvery: 2,
    hudInterval: 110,
    detailRatio: .78
  }),
  high: Object.freeze({
    id: 'high',
    pixelRatioCap: 2.5,
    starCount: 105,
    particleRatio: 1,
    renderEvery: 1,
    idleRenderEvery: 2,
    hudInterval: 85,
    detailRatio: 1
  })
});

const QUALITY_ORDER = Object.freeze(['economy', 'balanced', 'high']);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function getFlightQualityProfile(id = 'balanced') {
  return FLIGHT_QUALITY_PROFILES[id] || FLIGHT_QUALITY_PROFILES.balanced;
}

export function detectFlightQuality({
  viewportWidth = 960,
  devicePixelRatio = 1,
  hardwareConcurrency = 8,
  deviceMemory = 8,
  saveData = false,
  reducedMotion = false
} = {}) {
  finite(viewportWidth, 960);
  const ratio = Math.max(1, finite(devicePixelRatio, 1));
  const cores = Math.max(1, finite(hardwareConcurrency, 8));
  const memory = Math.max(1, finite(deviceMemory, 8));

  if (saveData || cores <= 4 || memory <= 4) return 'economy';
  if (reducedMotion) return 'balanced';
  if (ratio >= 2.5 && cores >= 6 && memory >= 8) return 'high';
  if (cores <= 6 || memory <= 6) return 'balanced';
  return 'high';
}

export function createFlightPerformanceState(capabilities = {}) {
  const quality = detectFlightQuality(capabilities);
  return {
    quality,
    maximumQuality: quality,
    averageFrameMs: 16.7,
    slowFrames: 0,
    fastFrames: 0,
    cooldownFrames: 120
  };
}

export function updateFlightPerformance(state = {}, frameMs = 16.7) {
  const currentQuality = getFlightQualityProfile(state.quality).id;
  const maximumQuality = getFlightQualityProfile(state.maximumQuality || currentQuality).id;
  const sample = clamp(finite(frameMs, 16.7), 4, 80);
  const averageFrameMs = finite(state.averageFrameMs, 16.7) * .92 + sample * .08;
  let slowFrames = averageFrameMs > 23.5 ? Math.max(0, finite(state.slowFrames)) + 1 : Math.max(0, finite(state.slowFrames) - 2);
  let fastFrames = averageFrameMs < 16.4 ? Math.max(0, finite(state.fastFrames)) + 1 : Math.max(0, finite(state.fastFrames) - 1);
  let cooldownFrames = Math.max(0, finite(state.cooldownFrames) - 1);
  let quality = currentQuality;

  const currentIndex = QUALITY_ORDER.indexOf(currentQuality);
  const maximumIndex = QUALITY_ORDER.indexOf(maximumQuality);
  if (cooldownFrames === 0 && slowFrames >= 42 && currentIndex > 0) {
    quality = QUALITY_ORDER[currentIndex - 1];
    slowFrames = 0;
    fastFrames = 0;
    cooldownFrames = 240;
  } else if (cooldownFrames === 0 && fastFrames >= 360 && currentIndex < maximumIndex) {
    quality = QUALITY_ORDER[currentIndex + 1];
    slowFrames = 0;
    fastFrames = 0;
    cooldownFrames = 360;
  }

  return {
    state: { quality, maximumQuality, averageFrameMs, slowFrames, fastFrames, cooldownFrames },
    changed: quality !== currentQuality
  };
}

export function scaledVisualCount(count, profile, minimum = 0) {
  const safeCount = Math.max(0, Math.floor(finite(count)));
  const ratio = getFlightQualityProfile(profile?.id || profile).particleRatio;
  return Math.max(Math.max(0, Math.floor(finite(minimum))), Math.round(safeCount * ratio));
}

export function shouldRenderFlightFrame(frameNumber, profile, running = true) {
  const quality = getFlightQualityProfile(profile?.id || profile);
  const interval = running ? quality.renderEvery : quality.idleRenderEvery;
  return Math.max(0, Math.floor(finite(frameNumber))) % Math.max(1, interval) === 0;
}
