import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/space-game.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar reglas puras de simulación',
  "import { ammoMilestone, createFlightState, flightDifficulty, flightHud, flightSector, flightSectorIndex, flightSummary } from './core/flight-state.js?v=23';",
  `import { ammoMilestone, createFlightState, flightDifficulty, flightHud, flightSector, flightSectorIndex, flightSummary } from './core/flight-state.js?v=23';
import {
  advanceExplosions,
  advanceFlightVitals,
  advanceObstacles,
  advanceProjectile,
  cleanupFlightObjects,
  collisionOutcome,
  createObstacleWave,
  destructionOutcome,
  FLIGHT_LANES,
  isShipCollision,
  projectileHitsObstacle,
  resolveFuelDepletion
} from './core/flight-simulation.js?v=23';`
);

replaceOnce(
  'retirar catálogos duplicados de simulación',
  "\nconst LANES = [-1, 0, 1];\nconst OBSTACLE_TYPES = ['planet', 'meteor', 'star', 'ship'];",
  ''
);

replaceOnce(
  'delegar avance de variables continuas',
  /    this\.elapsed \+= delta;[\s\S]*?    this\.invulnerable = Math\.max\(0, this\.invulnerable - delta\);/,
  '    Object.assign(this, advanceFlightVitals(this, delta));'
);

replaceOnce(
  'delegar rescate por combustible',
  /    if \(this\.fuel <= 0\) \{[\s\S]*?\n    \}\n\n    const remaining/,
  `    const fuelOutcome = resolveFuelDepletion(this);
    if (fuelOutcome.status === 'rescued') {
      Object.assign(this, fuelOutcome.patch);
      this.callbacks.onPracticeRescue?.({ reason: fuelOutcome.reason });
      this.emitHud();
      return;
    }
    if (fuelOutcome.status === 'stranded') {
      this.strand(fuelOutcome.reason);
      return;
    }

    const remaining`
);

replaceOnce(
  'delegar avance de obstáculos',
  /    for \(const obstacle of this\.obstacles\) \{\n      obstacle\.previousDepth = obstacle\.depth;\n      obstacle\.depth \+= delta \* difficulty\.obstacleSpeed \* obstacle\.speedFactor;\n      if \(obstacle\.tutorialTarget && obstacle\.depth > \.66\) obstacle\.depth = \.66;\n      obstacle\.spin \+= delta \* obstacle\.spinSpeed;\n    \}/,
  `    this.obstacles = advanceObstacles(this.obstacles, {
      delta,
      obstacleSpeed: difficulty.obstacleSpeed
    });`
);

replaceOnce(
  'delegar detección de colisión',
  "if (!obstacle.hit && !obstacle.tutorialTarget && this.invulnerable <= 0 && obstacle.depth > .87 && obstacle.depth < .99 && Math.abs(obstacle.lane - this.lanePosition) < .34)",
  "if (isShipCollision({ obstacle, lanePosition: this.lanePosition, invulnerable: this.invulnerable }))"
);

replaceOnce(
  'delegar avance y limpieza de objetos',
  /    this\.explosions\.forEach\(\(explosion\) => \{\n      explosion\.age \+= delta;\n      explosion\.depth \+= delta \* difficulty\.obstacleSpeed \* \.5;\n    \}\);\n    this\.explosions = this\.explosions\.filter\(\(explosion\) => explosion\.age < \(explosion\.duration \|\| \.7\)\);\n    this\.projectiles = this\.projectiles\.filter\(\(projectile\) => !projectile\.hit && projectile\.depth > \.015 && projectile\.age < \.9\);\n    this\.obstacles = this\.obstacles\.filter\(\(obstacle\) => obstacle\.depth < 1\.24 && !obstacle\.hit\);/,
  `    this.explosions = advanceExplosions(this.explosions, {
      delta,
      obstacleSpeed: difficulty.obstacleSpeed
    });
    const activeObjects = cleanupFlightObjects({
      explosions: this.explosions,
      projectiles: this.projectiles,
      obstacles: this.obstacles
    });
    this.explosions = activeObjects.explosions;
    this.projectiles = activeObjects.projectiles;
    this.obstacles = activeObjects.obstacles;`
);

replaceOnce(
  'delegar movimiento y cruce de proyectiles',
  /  updateProjectiles\(delta\) \{[\s\S]*?\n  \}\n\n  spawnWave\(\) \{/,
  `  updateProjectiles(delta) {
    for (let index = 0; index < this.projectiles.length; index += 1) {
      let projectile = advanceProjectile(this.projectiles[index], delta);
      this.projectiles[index] = projectile;
      for (const obstacle of this.obstacles) {
        if (!projectileHitsObstacle(projectile, obstacle)) continue;
        projectile = { ...projectile, hit: true };
        this.projectiles[index] = projectile;
        this.destroyObstacle(obstacle);
      }
    }
  }

  spawnWave() {`
);

replaceOnce(
  'delegar generación de oleadas',
  /  spawnWave\(\) \{[\s\S]*?\n  \}\n\n  collide\(obstacle\) \{/,
  `  spawnWave() {
    this.obstacles.push(...createObstacleWave({
      checkpoints: this.checkpoints,
      pairChance: this.getDifficulty().pairChance,
      random: Math.random
    }));
  }

  collide(obstacle) {`
);

replaceOnce(
  'delegar resultado de colisión y rescate',
  /  collide\(obstacle\) \{[\s\S]*?\n  \}\n\n  destroyObstacle\(obstacle\) \{/,
  `  collide(obstacle) {
    const outcome = collisionOutcome(this, obstacle, Math.random);
    Object.assign(this, outcome.patch);
    this.explosions.push(outcome.explosion);
    this.callbacks.onCollision?.(outcome.collision);
    if (outcome.rescueReason) {
      this.callbacks.onPracticeRescue?.({ reason: outcome.rescueReason });
    } else if (outcome.gameOverReason) {
      this.strand(outcome.gameOverReason);
    }
  }

  destroyObstacle(obstacle) {`
);

replaceOnce(
  'delegar resultado de destrucción',
  /  destroyObstacle\(obstacle\) \{[\s\S]*?\n  \}\n\n  emitHud\(\) \{/,
  `  destroyObstacle(obstacle) {
    obstacle.hit = true;
    const outcome = destructionOutcome(this, obstacle, Math.random);
    Object.assign(this, outcome.patch);
    this.explosions.push(outcome.explosion);
    this.callbacks.onDestroy?.(outcome.destroyed);
    if (outcome.tutorialStep) this.callbacks.onTutorialStep?.({ step: outcome.tutorialStep });
  }

  emitHud() {`
);

replaceOnce('usar carriles compartidos', 'const safeLane = LANES.find', 'const safeLane = FLIGHT_LANES.find');

for (const forbidden of [
  'const LANES = [-1, 0, 1]',
  "const OBSTACLE_TYPES = ['planet'",
  'this.elapsed += delta',
  'this.hull -= 1',
  'const names = { planet:',
  'const lanes = [...LANES]'
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió lógica duplicada de simulación: ${forbidden}`);
}

writeFileSync(file, source);
console.log('space-game.js delega simulación, oleadas, colisiones, rescates y destrucciones.');
