const OBSTACLE_TYPES = Object.freeze(['planet', 'meteor', 'star', 'ship']);
export const FLIGHT_LANES = Object.freeze([-1, 0, 1]);

const COLLISION_NAMES = Object.freeze({
  planet: 'un planeta',
  meteor: 'un meteorito',
  star: 'una estrella ardiente',
  ship: 'otra nave'
});

const DESTRUCTION_NAMES = Object.freeze({
  planet: 'PLANETA',
  meteor: 'METEORITO',
  star: 'ESTRELLA',
  ship: 'NAVE RIVAL'
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function randomValue(random) {
  const value = finite(random(), 0);
  return Math.max(0, Math.min(.999999999, value));
}

export function advanceFlightVitals(state, delta) {
  const elapsedDelta = Math.max(0, finite(delta));
  const checkpoints = Math.max(0, finite(state?.checkpoints));
  const lane = finite(state?.lane);
  const lanePosition = finite(state?.lanePosition);
  const tutorial = Boolean(state?.tutorial);
  const practice = Boolean(state?.practice);
  const distance = Math.max(0, finite(state?.distance));
  const fuel = Math.max(0, finite(state?.fuel));

  return {
    elapsed: Math.max(0, finite(state?.elapsed)) + elapsedDelta,
    lanePosition: lanePosition + (lane - lanePosition) * Math.min(1, elapsedDelta * 11),
    distance: tutorial ? distance : distance + (17 + checkpoints * 1.8) * elapsedDelta,
    fuel: tutorial
      ? fuel
      : Math.max(0, fuel - elapsedDelta * (1.05 + checkpoints * .035) * (practice ? .7 : 1)),
    flash: Math.max(0, finite(state?.flash) - elapsedDelta * 1.8),
    shake: Math.max(0, finite(state?.shake) - elapsedDelta * 2.5),
    weaponPulse: Math.max(0, finite(state?.weaponPulse) - elapsedDelta * 5),
    invulnerable: Math.max(0, finite(state?.invulnerable) - elapsedDelta)
  };
}

export function resolveFuelDepletion(state) {
  if (finite(state?.fuel) > 0) return { status: 'ok', patch: {} };
  if (!state?.practice) {
    return {
      status: 'stranded',
      patch: {},
      reason: 'Se terminó el combustible antes de llegar al puesto de recarga.'
    };
  }
  return {
    status: 'rescued',
    reason: 'fuel',
    patch: {
      fuel: 45,
      hull: Math.max(1, finite(state?.hull)),
      adaptiveAssist: Math.min(.16, finite(state?.adaptiveAssist) + .05)
    }
  };
}

export function advanceObstacles(obstacles, { delta, obstacleSpeed } = {}) {
  const elapsedDelta = Math.max(0, finite(delta));
  const speed = Math.max(0, finite(obstacleSpeed));
  return (Array.isArray(obstacles) ? obstacles : []).map((obstacle) => {
    const depth = finite(obstacle?.depth);
    const nextDepth = depth + elapsedDelta * speed * finite(obstacle?.speedFactor, 1);
    return {
      ...obstacle,
      previousDepth: depth,
      depth: obstacle?.tutorialTarget ? Math.min(.66, nextDepth) : nextDepth,
      spin: finite(obstacle?.spin) + elapsedDelta * finite(obstacle?.spinSpeed)
    };
  });
}

export function advanceExplosions(explosions, { delta, obstacleSpeed } = {}) {
  const elapsedDelta = Math.max(0, finite(delta));
  const speed = Math.max(0, finite(obstacleSpeed));
  return (Array.isArray(explosions) ? explosions : []).map((explosion) => ({
    ...explosion,
    age: finite(explosion?.age) + elapsedDelta,
    depth: finite(explosion?.depth) + elapsedDelta * speed * .5
  }));
}

export function advanceProjectile(projectile, delta) {
  const elapsedDelta = Math.max(0, finite(delta));
  const depth = finite(projectile?.depth);
  return {
    ...projectile,
    previousDepth: depth,
    depth: depth - elapsedDelta * 1.72,
    age: finite(projectile?.age) + elapsedDelta
  };
}

export function projectileHitsObstacle(projectile, obstacle) {
  if (projectile?.hit || obstacle?.hit || obstacle?.lane !== projectile?.lane) return false;
  const previousGap = finite(projectile?.previousDepth, finite(projectile?.depth))
    - finite(obstacle?.previousDepth, finite(obstacle?.depth));
  const currentGap = finite(projectile?.depth) - finite(obstacle?.depth);
  return (previousGap >= 0 && currentGap <= 0) || Math.abs(currentGap) < .075;
}

export function isShipCollision({ obstacle, lanePosition, invulnerable } = {}) {
  return Boolean(
    obstacle
    && !obstacle.hit
    && !obstacle.tutorialTarget
    && finite(invulnerable) <= 0
    && finite(obstacle.depth) > .87
    && finite(obstacle.depth) < .99
    && Math.abs(finite(obstacle.lane) - finite(lanePosition)) < .34
  );
}

export function cleanupFlightObjects({ explosions, projectiles, obstacles } = {}) {
  return {
    explosions: (Array.isArray(explosions) ? explosions : [])
      .filter((explosion) => finite(explosion?.age) < finite(explosion?.duration, .7)),
    projectiles: (Array.isArray(projectiles) ? projectiles : [])
      .filter((projectile) => !projectile?.hit && finite(projectile?.depth) > .015 && finite(projectile?.age) < .9),
    obstacles: (Array.isArray(obstacles) ? obstacles : [])
      .filter((obstacle) => finite(obstacle?.depth) < 1.24 && !obstacle?.hit)
  };
}

export function createObstacleWave({ checkpoints = 0, pairChance = 0, random = Math.random } = {}) {
  const level = Math.max(0, Math.floor(finite(checkpoints)));
  const randomSource = typeof random === 'function' ? random : Math.random;
  const lanes = [...FLIGHT_LANES].sort(() => randomValue(randomSource) - .5);
  const count = level >= 2 && randomValue(randomSource) < finite(pairChance) ? 2 : 1;
  const obstacles = [];

  for (let index = 0; index < count; index += 1) {
    const secondOffset = index === 1 && level > 4 && randomValue(randomSource) < .45 ? .1 : 0;
    obstacles.push({
      type: OBSTACLE_TYPES[Math.floor(randomValue(randomSource) * OBSTACLE_TYPES.length)],
      lane: lanes[index],
      depth: .035 + secondOffset,
      spin: randomValue(randomSource) * Math.PI * 2,
      spinSpeed: (randomValue(randomSource) - .5) * 2.8,
      speedFactor: .92 + randomValue(randomSource) * .16,
      size: .84 + randomValue(randomSource) * .32,
      hit: false
    });
  }
  return obstacles;
}

export function collisionOutcome(state, obstacle, random = Math.random) {
  const rawHull = finite(state?.hull) - 1;
  const fuelAfterHit = Math.max(0, finite(state?.fuel) - 12);
  const practice = Boolean(state?.practice);
  const randomSource = typeof random === 'function' ? random : Math.random;
  const patch = {
    hull: rawHull,
    totalCollisions: Math.max(0, finite(state?.totalCollisions)) + 1,
    collisionsThisLeg: Math.max(0, finite(state?.collisionsThisLeg)) + 1,
    correctStreak: 0,
    adaptiveAssist: Math.min(.16, finite(state?.adaptiveAssist) + .038),
    invulnerable: 1.05,
    fuel: fuelAfterHit,
    shake: 1,
    flash: -.7
  };

  let rescueReason = '';
  let gameOverReason = '';
  if (rawHull <= 0) {
    if (practice) {
      patch.hull = 3;
      patch.fuel = Math.max(48, fuelAfterHit);
      rescueReason = 'hull';
    } else {
      gameOverReason = 'La nave recibió demasiados golpes y quedó varada.';
    }
  }

  return {
    patch,
    collision: {
      name: COLLISION_NAMES[obstacle?.type] || 'un obstáculo',
      hull: rawHull
    },
    rescueReason,
    gameOverReason,
    explosion: {
      lane: finite(obstacle?.lane),
      depth: finite(obstacle?.depth),
      age: 0,
      seed: randomValue(randomSource) * Math.PI * 2
    }
  };
}

export function destructionOutcome(state, obstacle, random = Math.random) {
  const randomSource = typeof random === 'function' ? random : Math.random;
  const tutorialCompletedShot = Boolean(state?.tutorial && state?.tutorialStep === 'fire');
  return {
    patch: {
      destroyed: Math.max(0, finite(state?.destroyed)) + 1,
      flash: Math.max(finite(state?.flash), .72),
      shake: Math.max(finite(state?.shake), .24),
      ...(tutorialCompletedShot ? { tutorialStep: 'question' } : {})
    },
    destroyed: {
      name: DESTRUCTION_NAMES[obstacle?.type] || 'OBSTÁCULO',
      ammo: Math.max(0, finite(state?.ammo)),
      type: obstacle?.type
    },
    tutorialStep: tutorialCompletedShot ? 'question' : '',
    explosion: {
      lane: finite(obstacle?.lane),
      depth: finite(obstacle?.depth),
      age: 0,
      duration: .95,
      seed: randomValue(randomSource) * Math.PI * 2,
      kind: 'plasma',
      type: obstacle?.type
    }
  };
}
