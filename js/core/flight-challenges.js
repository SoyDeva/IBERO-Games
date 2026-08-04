export const FLIGHT_CHALLENGES = Object.freeze([
  Object.freeze({
    id: 'destroy',
    icon: '🎯',
    title: 'Cazador orbital',
    instruction: 'Destruye 1 obstáculo antes del portal',
    target: 1,
    reward: Object.freeze({ fuel: 0, ammo: 1, rush: 10, label: '+1 plasma · +10 impulso' })
  }),
  Object.freeze({
    id: 'collect',
    icon: '✦',
    title: 'Recolector Nébula',
    instruction: 'Recoge 1 Núcleo Nébula antes del portal',
    target: 1,
    reward: Object.freeze({ fuel: 5, ammo: 0, rush: 10, label: '+5 combustible · +10 impulso' })
  }),
  Object.freeze({
    id: 'clean',
    icon: '🛡️',
    title: 'Ruta impecable',
    instruction: 'Llega al portal sin chocar',
    target: 1,
    reward: Object.freeze({ fuel: 8, ammo: 0, rush: 12, label: '+8 combustible · +12 impulso' })
  })
]);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function randomValue(random) {
  const value = finite(random(), 0);
  return clamp(value, 0, .999999999);
}

export function createFlightChallengeState() {
  return {
    sectorChallenge: null,
    lastChallengeId: '',
    challengeMessageTime: 0,
    challengesCompleted: 0
  };
}

export function createSectorChallenge({ previousId = '', random = Math.random } = {}) {
  const source = typeof random === 'function' ? random : Math.random;
  const available = FLIGHT_CHALLENGES.filter((challenge) => challenge.id !== previousId);
  const pool = available.length ? available : FLIGHT_CHALLENGES;
  const template = pool[Math.floor(randomValue(source) * pool.length)];
  return {
    ...template,
    reward: { ...template.reward },
    progress: 0,
    status: 'active'
  };
}

export function progressSectorChallenge(challenge, event = {}) {
  if (!challenge || challenge.status !== 'active') {
    return { challenge, completed: false, failed: false };
  }

  const type = String(event.type || '');
  let progress = Math.max(0, finite(challenge.progress));
  let status = 'active';

  if (type === 'collision' && challenge.id === 'clean') {
    status = 'failed';
  } else if (type === challenge.id && (type === 'destroy' || type === 'collect')) {
    progress = Math.min(challenge.target, progress + 1);
    if (progress >= challenge.target) status = 'completed';
  } else if (type === 'checkpoint') {
    if (challenge.id === 'clean' && event.clean) {
      progress = challenge.target;
      status = 'completed';
    } else {
      status = 'failed';
    }
  }

  const nextChallenge = { ...challenge, progress, status };
  return {
    challenge: nextChallenge,
    completed: status === 'completed',
    failed: status === 'failed'
  };
}

export function applyChallengeReward(state = {}, challenge = {}) {
  const reward = challenge?.reward || {};
  return {
    fuel: Math.min(100, Math.max(0, finite(state.fuel)) + Math.max(0, finite(reward.fuel))),
    ammo: Math.min(9, Math.max(0, finite(state.ammo)) + Math.max(0, finite(reward.ammo))),
    challengesCompleted: Math.max(0, finite(state.challengesCompleted)) + 1,
    challengeMessageTime: 2.6
  };
}

export function advanceChallengeTimer(state = {}, delta = 0) {
  return {
    challengeMessageTime: Math.max(0, finite(state.challengeMessageTime) - Math.max(0, finite(delta)))
  };
}
