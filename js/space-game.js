import { ammoMilestone, createFlightState, flightDifficulty, flightHud, flightSector, flightSectorIndex, flightSummary } from './core/flight-state.js?v=23';
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
} from './core/flight-simulation.js?v=23';
import {
  advanceEnergyCores,
  advanceExcitementTimers,
  chargeNebulaRush,
  cleanupEnergyCores,
  collectEnergyCore,
  createEnergyCore,
  isEnergyCoreCollected,
  nebulaRushFuelMultiplier,
  penalizeNebulaRush
} from './core/flight-excitement.js?v=23';
import {
  advanceChallengeTimer,
  applyChallengeReward,
  createSectorChallenge,
  progressSectorChallenge
} from './core/flight-challenges.js?v=23';
import { createFlightInputController } from './services/flight-input-controller.js?v=23';
import { SHIP_SKINS, SHIP_TRAILS } from './config/ship-catalog.js?v=23';
import { clamp, resizeFlightCanvas } from './core/flight-geometry.js?v=23';
import { createFlightRenderer } from './ui/flight-renderer.js?v=23';
import { createFlightExcitementRenderer } from './ui/flight-excitement-renderer.js?v=23';

export { SHIP_SKINS, SHIP_TRAILS };

export class SpaceFlight {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.renderer = createFlightRenderer(this);
    this.excitementRenderer = createFlightExcitementRenderer(this);
    this.width = 960;
    this.height = 600;
    Object.assign(this, createFlightState());
    this.lastFrame = performance.now();
    this.stars = Array.from({ length: 105 }, () => this.createStar());
    this.boundFrame = (time) => this.frame(time);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.inputController = createFlightInputController({
      windowRef: window,
      canvas,
      getMode: () => this.mode,
      moveLane: (direction) => this.moveLane(direction),
      setLane: (lane) => this.setLane(lane),
      fire: () => this.fire()
    });
    this.inputController.bind();
    this.resize();
    this.frameId = requestAnimationFrame(this.boundFrame);
  }

  createStar() {
    return {
      angle: Math.random() * Math.PI * 2,
      radius: .08 + Math.random() * .72,
      depth: Math.random(),
      size: .45 + Math.random() * 1.65
    };
  }

  resize() {
    const metrics = resizeFlightCanvas({
      canvas: this.canvas,
      context: this.context,
      devicePixelRatio: window.devicePixelRatio
    });
    this.width = metrics.width;
    this.height = metrics.height;
  }

  start(options = {}) {
    const practice = Boolean(options.practice);
    const tutorial = Boolean(options.tutorial);
    const shipSkin = SHIP_SKINS[options.skin] ? options.skin : 'nebula';
    const shipTrail = SHIP_TRAILS[options.trail] ? options.trail : 'pulse';
    Object.assign(this, createFlightState({ mode: 'running', practice, tutorial, shipSkin, shipTrail }));
    if (!tutorial) this.startNextChallenge();
    this.emitHud();
    if (tutorial) this.callbacks.onTutorialStep?.({ step: 'left' });
  }

  pause() {
    if (this.mode === 'running') this.mode = 'paused';
  }

  resume() {
    if (this.mode === 'paused') this.mode = 'running';
  }

  enterStation() {
    if (this.mode === 'running') this.mode = 'station';
  }

  leaveStation() {
    if (this.mode === 'station') this.mode = 'running';
  }

  setLane(target) {
    if (this.mode !== 'running') return;
    const previousLane = this.lane;
    this.lane = clamp(Math.round(target), -1, 1);
    const direction = Math.sign(this.lane - previousLane);
    if (!direction) return;
    this.callbacks.onSteer?.(this.lane);
    if (this.tutorial && this.tutorialStep === 'left' && direction < 0) {
      this.tutorialStep = 'right';
      this.callbacks.onTutorialStep?.({ step: 'right' });
    } else if (this.tutorial && this.tutorialStep === 'right' && direction > 0) {
      this.lane = 0;
      this.tutorialStep = 'fire';
      this.obstacles = [{ type: 'meteor', lane: 0, depth: .2, spin: 0, spinSpeed: 1.2, speedFactor: .42, size: 1.05, hit: false, tutorialTarget: true }];
      this.callbacks.onTutorialStep?.({ step: 'fire' });
    }
  }

  moveLane(direction) {
    this.setLane(this.lane + Math.sign(direction));
  }

  fire() {
    if (this.mode !== 'running') return false;
    if (this.tutorial && this.tutorialStep !== 'fire') return false;
    if (this.ammo <= 0) {
      this.callbacks.onEmptyFire?.();
      return false;
    }
    this.ammo -= 1;
    this.weaponPulse = 1;
    this.projectiles.push({ lane: this.lane, depth: .79, previousDepth: .79, age: 0, hit: false });
    this.callbacks.onFire?.({ ammo: this.ammo });
    this.emitHud();
    return true;
  }

  answerCorrect() {
    if (this.mode !== 'quiz') return;
    this.stationSlowdown = 0;
    const previousSector = this.getSectorIndex();
    this.checkpoints += 1;
    this.totalCorrect += 1;
    this.correctStreak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.correctStreak);
    this.adaptiveAssist = Math.max(0, this.adaptiveAssist - (this.collisionsThisLeg === 0 ? .025 : .012));
    this.collisionsThisLeg = 0;
    this.fuel = Math.min(100, this.fuel + 38);
    const ammoRecharged = this.rechargeAmmoAtMilestone();
    this.nextCheckpoint += 330 + this.checkpoints * 12;
    this.spawnTimer = 2;
    this.flash = 1;
    this.createCelebration();
    this.mode = 'running';
    this.chargeRush(28, 'answer');
    this.startNextChallenge();
    this.callbacks.onLevelUp?.({ level: this.checkpoints + 1 });
    const sectorChanged = this.getSectorIndex() !== previousSector;
    const sector = this.getSector();
    if (sectorChanged) this.callbacks.onSectorChange?.(sector);
    this.emitHud();
    return { ammoRecharged, completedLevel: this.checkpoints, sectorChanged, sector, stationReached: !this.practice && this.checkpoints % 10 === 0 };
  }

  answerPracticeMistake() {
    if (this.mode !== 'quiz' || !this.practice) return;
    this.stationSlowdown = 0;
    const previousSector = this.getSectorIndex();
    this.checkpoints += 1;
    this.correctStreak = 0;
    this.adaptiveAssist = Math.min(.16, this.adaptiveAssist + .04);
    this.collisionsThisLeg = 0;
    this.fuel = Math.min(100, this.fuel + 24);
    Object.assign(this, penalizeNebulaRush(this));
    const ammoRecharged = this.rechargeAmmoAtMilestone();
    this.nextCheckpoint += 330 + this.checkpoints * 12;
    this.spawnTimer = 2.25;
    this.mode = 'running';
    this.startNextChallenge();
    this.callbacks.onLevelUp?.({ level: this.checkpoints + 1 });
    const sectorChanged = this.getSectorIndex() !== previousSector;
    const sector = this.getSector();
    if (sectorChanged) this.callbacks.onSectorChange?.(sector);
    this.emitHud();
    return { ammoRecharged, completedLevel: this.checkpoints, sectorChanged, sector };
  }

  rechargeAmmoAtMilestone() {
    const milestone = ammoMilestone(this.checkpoints, this.ammo);
    if (!milestone.recharged) return false;
    this.ammo = milestone.ammo;
    this.callbacks.onAmmoRecharge?.({ ammo: milestone.ammo, restored: milestone.restored, level: milestone.level });
    return true;
  }

  applyStationPurchase(type) {
    if (this.mode !== 'station') return false;
    if (type === 'repair') {
      this.hull = 3;
      this.fuel = Math.min(100, this.fuel + 20);
    } else if (type === 'plasma') {
      this.ammo = 5;
    } else if (type === 'stabilizer') {
      this.stationSlowdown = .09;
    } else {
      return false;
    }
    this.createCelebration(30);
    this.emitHud();
    return true;
  }

  finishTutorial() {
    this.tutorial = false;
    this.tutorialStep = 'complete';
    this.mode = 'paused';
    this.createCelebration(64);
    this.callbacks.onTutorialComplete?.();
  }

  strand(reason) {
    if (this.mode === 'gameover') return;
    this.mode = 'gameover';
    this.callbacks.onGameOver?.({ reason, ...this.getSummary() });
  }

  getSummary() {
    return flightSummary(this);
  }

  frame(time) {
    const delta = Math.min((time - this.lastFrame) / 1000, .04);
    this.lastFrame = time;
    const flightPace = this.mode === 'running' ? (this.rushTime > 0 ? 1.72 : 1) : .18;
    this.updateStars(delta, flightPace);
    if (this.mode === 'running') this.update(delta);
    this.updateCelebration(delta);
    this.draw();
    this.frameId = requestAnimationFrame(this.boundFrame);
  }

  updateStars(delta, pace) {
    this.stars.forEach((star) => {
      star.depth += delta * (.2 + this.checkpoints * .022) * pace;
      if (star.depth > 1) Object.assign(star, this.createStar(), { depth: .02 });
    });
  }

  update(delta) {
    const rushFuelMultiplier = nebulaRushFuelMultiplier(this);
    Object.assign(this, advanceFlightVitals({
      ...this,
      fuelDrainMultiplier: this.fuelDrainMultiplier * rushFuelMultiplier
    }, delta));
    Object.assign(this, advanceExcitementTimers(this, delta));
    Object.assign(this, advanceChallengeTimer(this, delta));
    const difficulty = this.getDifficulty();

    const fuelOutcome = resolveFuelDepletion(this);
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

    const remaining = this.nextCheckpoint - this.distance;
    this.spawnTimer -= delta;
    if (!this.tutorial && this.spawnTimer <= 0 && remaining > 65) {
      this.spawnWave();
      this.spawnTimer = difficulty.spawnInterval + Math.random() * .32;
    }

    this.obstacles = advanceObstacles(this.obstacles, {
      delta,
      obstacleSpeed: difficulty.obstacleSpeed
    });
    this.updateEnergyCores(delta, difficulty, remaining);
    this.updateProjectiles(delta);
    for (const obstacle of this.obstacles) {
      if (isShipCollision({ obstacle, lanePosition: this.lanePosition, invulnerable: this.invulnerable })) {
        obstacle.hit = true;
        this.collide(obstacle);
      }
      if (this.mode === 'gameover') break;
    }
    this.explosions = advanceExplosions(this.explosions, {
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
    this.obstacles = activeObjects.obstacles;
    this.energyCores = cleanupEnergyCores(this.energyCores);
    if (this.mode !== 'running') {
      this.emitHud();
      return;
    }

    if (!this.tutorial && this.distance >= this.nextCheckpoint) {
      const clean = this.collisionsThisLeg === 0;
      this.recordChallengeEvent({ type: 'checkpoint', clean });
      this.mode = 'quiz';
      this.obstacles = [];
      this.projectiles = [];
      this.energyCores = [];
      this.callbacks.onCheckpoint?.({ number: this.checkpoints + 1, fuel: Math.round(this.fuel), clean });
    }
    this.emitHud();
  }

  updateEnergyCores(delta, difficulty, remaining) {
    if (this.tutorial) return;
    if (this.coreSpawnTimer <= 0 && remaining > 90 && this.energyCores.length === 0) {
      const blockedLanes = this.obstacles
        .filter((obstacle) => !obstacle.hit && obstacle.depth < .34)
        .map((obstacle) => obstacle.lane);
      this.energyCores.push(createEnergyCore({ blockedLanes, random: Math.random }));
      this.coreSpawnTimer = 10.5 + Math.random() * 6.5;
    }

    this.energyCores = advanceEnergyCores(this.energyCores, {
      delta,
      speed: difficulty.obstacleSpeed
    });

    for (const core of this.energyCores) {
      if (!isEnergyCoreCollected({ core, lanePosition: this.lanePosition })) continue;
      this.collectCore(core);
    }
  }

  collectCore(core) {
    core.collected = true;
    const outcome = collectEnergyCore(this);
    Object.assign(this, outcome.patch);
    if (outcome.activated) this.activateRushCelebration('core');
    this.recordChallengeEvent({ type: 'collect' });
    this.callbacks.onEnergyCore?.({
      collected: this.coresCollected,
      fuel: this.fuel,
      ammo: this.ammo,
      ammoBonus: outcome.ammoBonus,
      rushCharge: this.rushCharge,
      rushActive: this.rushTime > 0
    });
    this.emitHud();
  }

  chargeRush(amount, source = '') {
    if (this.tutorial) return false;
    const outcome = chargeNebulaRush(this, amount);
    Object.assign(this, outcome.patch);
    if (outcome.activated) this.activateRushCelebration(source);
    return outcome.activated;
  }

  activateRushCelebration(source) {
    this.createCelebration(38);
    this.callbacks.onNebulaRush?.({
      source,
      duration: this.rushTime,
      ammo: this.ammo,
      rushes: this.rushes
    });
  }

  startNextChallenge() {
    if (this.tutorial) {
      this.sectorChallenge = null;
      return null;
    }
    const challenge = createSectorChallenge({ previousId: this.lastChallengeId, random: Math.random });
    this.sectorChallenge = challenge;
    this.lastChallengeId = challenge.id;
    this.challengeMessageTime = 0;
    this.callbacks.onChallengeStart?.({ challenge: { ...challenge, reward: { ...challenge.reward } } });
    return challenge;
  }

  recordChallengeEvent(event) {
    const outcome = progressSectorChallenge(this.sectorChallenge, event);
    if (!outcome.challenge || outcome.challenge === this.sectorChallenge) return outcome;
    this.sectorChallenge = outcome.challenge;

    if (outcome.completed) {
      Object.assign(this, applyChallengeReward(this, outcome.challenge));
      const rushActivated = this.chargeRush(outcome.challenge.reward.rush, 'challenge');
      this.createCelebration(24);
      this.callbacks.onChallengeComplete?.({
        challenge: { ...outcome.challenge, reward: { ...outcome.challenge.reward } },
        reward: { ...outcome.challenge.reward },
        completed: this.challengesCompleted,
        rushActivated
      });
    } else if (outcome.failed) {
      this.challengeMessageTime = 1.8;
      this.callbacks.onChallengeFailed?.({ challenge: { ...outcome.challenge, reward: { ...outcome.challenge.reward } } });
    }
    return outcome;
  }

  getDifficulty() {
    return flightDifficulty(this);
  }

  getSectorIndex() {
    return flightSectorIndex(this.checkpoints);
  }

  getSector() {
    return flightSector(this.checkpoints);
  }

  updateProjectiles(delta) {
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

  spawnWave() {
    this.obstacles.push(...createObstacleWave({
      checkpoints: this.checkpoints,
      pairChance: this.getDifficulty().pairChance,
      random: Math.random
    }));
  }

  collide(obstacle) {
    const outcome = collisionOutcome(this, obstacle, Math.random);
    Object.assign(this, outcome.patch, penalizeNebulaRush(this));
    this.recordChallengeEvent({ type: 'collision' });
    this.explosions.push(outcome.explosion);
    this.callbacks.onCollision?.(outcome.collision);
    if (outcome.rescueReason) {
      this.callbacks.onPracticeRescue?.({ reason: outcome.rescueReason });
    } else if (outcome.gameOverReason) {
      this.strand(outcome.gameOverReason);
    }
  }

  destroyObstacle(obstacle) {
    obstacle.hit = true;
    const outcome = destructionOutcome(this, obstacle, Math.random);
    Object.assign(this, outcome.patch);
    if (!this.tutorial) this.chargeRush(18, 'destroy');
    this.recordChallengeEvent({ type: 'destroy' });
    this.explosions.push(outcome.explosion);
    this.callbacks.onDestroy?.(outcome.destroyed);
    if (outcome.tutorialStep) this.callbacks.onTutorialStep?.({ step: outcome.tutorialStep });
  }

  emitHud() {
    this.callbacks.onHud?.(flightHud(this));
  }

  createCelebration(count = 46) {
    const colors = ['#5ee8ef', '#f7cb62', '#ff7bac', '#8d73ff', '#57e0a0', '#ffffff'];
    for (let index = 0; index < count; index += 1) {
      this.celebrationParticles.push({
        x: this.width * (.18 + Math.random() * .64),
        y: this.height * (.16 + Math.random() * .25),
        vx: (Math.random() - .5) * 150,
        vy: -40 + Math.random() * 95,
        gravity: 80 + Math.random() * 80,
        age: 0,
        duration: 1.2 + Math.random() * .8,
        size: 3 + Math.random() * 6,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - .5) * 8,
        color: colors[index % colors.length],
        star: index % 5 === 0
      });
    }
  }

  updateCelebration(delta) {
    this.celebrationParticles.forEach((particle) => {
      particle.age += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += particle.gravity * delta;
      particle.spin += particle.spinSpeed * delta;
    });
    this.celebrationParticles = this.celebrationParticles.filter((particle) => particle.age < particle.duration);
  }

  draw() {
    this.renderer.draw();
    this.excitementRenderer.draw();
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.inputController.destroy();
  }
}
