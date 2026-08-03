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

export const SHIP_SKINS = Object.freeze({
  nebula: { name: 'Nébula', icon: '🚀', price: 0, body: '#e9efff', wing: '#8d73ff', glass: '#54def2', flame: '#5ee8ef', glow: '#5ee8ef', description: 'El uniforme clásico de la Asteria.' },
  solar: { name: 'Solar', icon: '☀️', price: 75, body: '#fff2bd', wing: '#ff8b45', glass: '#ffd95e', flame: '#ff6d7d', glow: '#f7cb62', description: 'Brilla como una pequeña estrella.' },
  aqua: { name: 'Aqua', icon: '🌊', price: 105, body: '#dffff7', wing: '#20bfa9', glass: '#79f4ff', flame: '#57e0a0', glow: '#5ee8ef', description: 'Tecnología del Cinturón Helado.' },
  aurora: { name: 'Aurora', icon: '🌈', price: 150, body: '#ffe8f5', wing: '#ff6fb2', glass: '#bda5ff', flame: '#f7cb62', glow: '#ff7bac', description: 'Una nave legendaria llena de color.' },
  guardian: { name: 'Guardiana', icon: '🛡️', price: 190, body: '#e4fff3', wing: '#34c77b', glass: '#f7cb62', flame: '#73ffd1', glow: '#57e0a0', description: 'La protectora esmeralda de los portales.' },
  eclipse: { name: 'Eclipse', icon: '🌑', price: 240, body: '#d9d2ff', wing: '#50378e', glass: '#ff7bac', flame: '#b181ff', glow: '#b181ff', description: 'Tecnología secreta nacida en el vacío.' }
});
export const SHIP_TRAILS = Object.freeze({
  pulse: { name: 'Pulso Nébula', icon: '💫', price: 0, primary: '#5ee8ef', secondary: '#8d73ff', description: 'La estela clásica de energía azul.' },
  comet: { name: 'Cometa Dorado', icon: '☄️', price: 45, primary: '#fff2a8', secondary: '#ff8b45', description: 'Chispas doradas que cruzan el cosmos.' },
  ion: { name: 'Tormenta Iónica', icon: '⚡', price: 70, primary: '#d896ff', secondary: '#5ee8ef', description: 'Un rastro eléctrico violeta y turquesa.' },
  nature: { name: 'Aurora Viva', icon: '🌿', price: 95, primary: '#73ffd1', secondary: '#f7cb62', description: 'Partículas verdes inspiradas en la vida.' },
  rainbow: { name: 'Prisma Estelar', icon: '🌈', price: 130, primary: '#ff7bac', secondary: '#f7cb62', description: 'Una estela especial que cambia de color.' }
});
function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function easeIn(value) {
  return value * value;
}

export class SpaceFlight {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.width = 960;
    this.height = 600;
    Object.assign(this, createFlightState());
    this.lastFrame = performance.now();
    this.stars = Array.from({ length: 105 }, () => this.createStar());
    this.boundFrame = (time) => this.frame(time);
    this.boundKey = (event) => this.onKey(event);
    this.boundPointer = (event) => this.onPointer(event);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    window.addEventListener('keydown', this.boundKey);
    canvas.addEventListener('pointerdown', this.boundPointer);
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
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width || 960);
    this.height = Math.max(420, rect.height || 600);
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  start(options = {}) {
    const practice = Boolean(options.practice);
    const tutorial = Boolean(options.tutorial);
    const shipSkin = SHIP_SKINS[options.skin] ? options.skin : 'nebula';
    const shipTrail = SHIP_TRAILS[options.trail] ? options.trail : 'pulse';
    Object.assign(this, createFlightState({ mode: 'running', practice, tutorial, shipSkin, shipTrail }));
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

  onKey(event) {
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
      event.preventDefault();
      this.moveLane(-1);
    }
    if (['ArrowRight', 'd', 'D'].includes(event.key)) {
      event.preventDefault();
      this.moveLane(1);
    }
    if ((event.code === 'Space' || event.key === ' ') && this.mode === 'running') {
      event.preventDefault();
      if (!event.repeat) this.fire();
    }
  }

  onPointer(event) {
    if (this.mode !== 'running') return;
    const rect = this.canvas.getBoundingClientRect();
    const position = (event.clientX - rect.left) / Math.max(1, rect.width);
    this.setLane(position < 1 / 3 ? -1 : position > 2 / 3 ? 1 : 0);
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
    const ammoRecharged = this.rechargeAmmoAtMilestone();
    this.nextCheckpoint += 330 + this.checkpoints * 12;
    this.spawnTimer = 2.25;
    this.mode = 'running';
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
    this.updateStars(delta, this.mode === 'running' ? 1 : .18);
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
    Object.assign(this, advanceFlightVitals(this, delta));

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
    if (this.mode !== 'running') {
      this.emitHud();
      return;
    }

    if (!this.tutorial && this.distance >= this.nextCheckpoint) {
      this.mode = 'quiz';
      this.obstacles = [];
      this.projectiles = [];
      this.callbacks.onCheckpoint?.({ number: this.checkpoints + 1, fuel: Math.round(this.fuel), clean: this.collisionsThisLeg === 0 });
    }
    this.emitHud();
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
    Object.assign(this, outcome.patch);
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

  project(lane, depth) {
    const horizon = this.height * .235;
    const progress = easeIn(depth);
    return {
      x: this.width / 2 + lane * (this.width * (.035 + progress * .255)),
      y: horizon + progress * (this.height * .69),
      scale: .1 + progress * 1.22
    };
  }

  draw() {
    const ctx = this.context;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - .5) * 14 * this.shake, (Math.random() - .5) * 10 * this.shake);
    this.drawSpace(ctx);
    this.drawRoute(ctx);
    this.drawSafeRoute(ctx);
    this.drawCheckpoint(ctx);
    const sorted = [...this.obstacles].sort((a, b) => a.depth - b.depth);
    sorted.filter((obstacle) => obstacle.depth <= .92).forEach((obstacle) => this.drawObstacle(ctx, obstacle));
    this.projectiles.forEach((projectile) => this.drawProjectile(ctx, projectile));
    this.drawShip(ctx);
    sorted.filter((obstacle) => obstacle.depth > .92).forEach((obstacle) => this.drawObstacle(ctx, obstacle));
    this.explosions.forEach((explosion) => this.drawExplosion(ctx, explosion));
    this.drawCelebration(ctx);
    if (this.flash !== 0) {
      ctx.fillStyle = this.flash > 0 ? `rgba(87,224,160,${this.flash * .22})` : `rgba(255,80,110,${Math.abs(this.flash) * .32})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  drawSpace(ctx) {
    const sector = this.getSector();
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, sector.top);
    gradient.addColorStop(.48, sector.middle);
    gradient.addColorStop(1, sector.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const nebula = ctx.createRadialGradient(this.width * .18, this.height * .34, 0, this.width * .18, this.height * .34, this.width * .42);
    nebula.addColorStop(0, `rgba(${sector.glow},.23)`);
    nebula.addColorStop(1, `rgba(${sector.glow},0)`);
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height * .235;
    this.stars.forEach((star) => {
      const radius = star.radius * Math.max(this.width, this.height) * easeIn(star.depth);
      const x = centerX + Math.cos(star.angle) * radius;
      const y = centerY + Math.sin(star.angle) * radius * .7;
      const tail = 2 + star.depth * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(star.angle) * tail, y - Math.sin(star.angle) * tail * .7);
      ctx.strokeStyle = `rgba(225,244,255,${.25 + star.depth * .7})`;
      ctx.lineWidth = star.size * (.4 + star.depth);
      ctx.stroke();
    });
  }

  drawRoute(ctx) {
    const sector = this.getSector();
    const horizonY = this.height * .235;
    const bottomY = this.height;
    ctx.beginPath();
    ctx.moveTo(this.width * .455, horizonY);
    ctx.lineTo(this.width * .94, bottomY);
    ctx.lineTo(this.width * .06, bottomY);
    ctx.lineTo(this.width * .545, horizonY);
    ctx.closePath();
    const route = ctx.createLinearGradient(0, horizonY, 0, bottomY);
    route.addColorStop(0, 'rgba(50,54,125,.2)');
    route.addColorStop(1, 'rgba(35,28,91,.72)');
    ctx.fillStyle = route;
    ctx.fill();

    ctx.strokeStyle = `rgba(${sector.route},.25)`;
    ctx.lineWidth = 2;
    [-.5, .5].forEach((divider) => {
      ctx.beginPath();
      ctx.moveTo(this.width / 2 + divider * this.width * .035, horizonY);
      ctx.lineTo(this.width / 2 + divider * this.width * .29, bottomY);
      ctx.stroke();
    });

    const offset = (this.elapsed * (.62 + this.checkpoints * .055)) % .14;
    for (let depth = .08 + offset; depth < 1; depth += .14) {
      const y = horizonY + easeIn(depth) * (bottomY - horizonY);
      const half = this.width * (.045 + easeIn(depth) * .44);
      ctx.strokeStyle = `rgba(141,115,255,${.08 + depth * .18})`;
      ctx.lineWidth = 1 + depth * 2;
      ctx.beginPath();
      ctx.moveTo(this.width / 2 - half, y);
      ctx.lineTo(this.width / 2 + half, y);
      ctx.stroke();
    }
  }

  drawSafeRoute(ctx) {
    if (this.mode !== 'running') return;
    const threats = this.obstacles.filter((obstacle) => !obstacle.hit && !obstacle.tutorialTarget && obstacle.depth > .58 && obstacle.depth < .84);
    if (!threats.length) return;
    const blocked = new Set(threats.map((obstacle) => obstacle.lane));
    if (blocked.size !== 2) return;
    const safeLane = FLIGHT_LANES.find((lane) => !blocked.has(lane));
    const point = this.project(safeLane, .9);
    ctx.save();
    ctx.strokeStyle = 'rgba(87,224,160,.88)';
    ctx.shadowColor = '#57e0a0';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(point.x, point.y - 12, 24 + Math.sin(this.elapsed * 7) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawCheckpoint(ctx) {
    if (this.mode !== 'running') return;
    const remaining = this.nextCheckpoint - this.distance;
    if (remaining > 74) return;
    const depth = clamp(1 - remaining / 74, .04, .96);
    const point = this.project(0, depth);
    const radius = 72 * point.scale;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(this.elapsed * .8);
    ctx.shadowColor = '#5ee8ef';
    ctx.shadowBlur = 22 * point.scale;
    ctx.strokeStyle = 'rgba(94,232,239,.88)';
    ctx.lineWidth = Math.max(2, 7 * point.scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * .76, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(247,203,98,.82)';
    ctx.lineWidth = Math.max(1, 3 * point.scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * .72, radius * .54, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawObstacle(ctx, obstacle) {
    const point = this.project(obstacle.lane, obstacle.depth);
    const base = 48 * point.scale * obstacle.size;
    ctx.save();
    if (obstacle.depth > 1.04) ctx.globalAlpha = clamp((1.24 - obstacle.depth) / .2, 0, 1);
    ctx.translate(point.x, point.y);
    ctx.rotate(obstacle.spin);
    if (obstacle.type === 'planet') this.drawPlanet(ctx, base);
    if (obstacle.type === 'meteor') this.drawMeteor(ctx, base);
    if (obstacle.type === 'star') this.drawHotStar(ctx, base);
    if (obstacle.type === 'ship') this.drawRivalShip(ctx, base);
    ctx.restore();
  }

  drawExplosion(ctx, explosion) {
    const point = this.project(explosion.lane, explosion.depth);
    const progress = explosion.age / (explosion.duration || .7);
    const radius = (24 + progress * 92) * Math.max(.55, point.scale);
    const plasma = explosion.kind === 'plasma';
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha = 1 - progress;
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(.2, plasma ? '#74f7ff' : '#ffe36e');
    glow.addColorStop(.55, plasma ? '#886dff' : '#ff6d7d');
    glow.addColorStop(1, plasma ? 'rgba(94,232,239,0)' : 'rgba(255,70,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = plasma ? '#ffffff' : '#8cf4ff';
    ctx.lineWidth = Math.max(1, 5 * (1 - progress));
    for (let index = 0; index < 10; index += 1) {
      const angle = explosion.seed + index * Math.PI * .2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * .2, Math.sin(angle) * radius * .2);
      ctx.lineTo(Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 1.35);
      ctx.stroke();
    }
    if (plasma) {
      const fragmentColors = {
        planet: ['#ffd97f', '#e8688f', '#6f43ad'],
        meteor: ['#ff9b5f', '#8f5d61', '#4f344b'],
        star: ['#fff3a8', '#ffd75e', '#ff8b58'],
        ship: ['#ec6ca5', '#8cecff', '#8d73ff']
      }[explosion.type] || ['#ffffff', '#5ee8ef', '#8d73ff'];
      ctx.globalAlpha = Math.max(0, 1 - progress * .85);
      for (let index = 0; index < 14; index += 1) {
        const angle = explosion.seed + index * (Math.PI * 2 / 14);
        const travel = radius * (.35 + progress * (1.1 + (index % 3) * .18));
        const shard = Math.max(3, radius * (.1 + (index % 2) * .035) * (1 - progress * .45));
        ctx.save();
        ctx.translate(Math.cos(angle) * travel, Math.sin(angle) * travel);
        ctx.rotate(angle + progress * (index % 2 ? 5 : -5));
        ctx.fillStyle = fragmentColors[index % fragmentColors.length];
        ctx.beginPath();
        ctx.moveTo(shard, 0);
        ctx.lineTo(-shard * .65, shard * .48);
        ctx.lineTo(-shard * .35, -shard * .55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawProjectile(ctx, projectile) {
    const head = this.project(projectile.lane, clamp(projectile.depth, .01, .98));
    const tail = this.project(projectile.lane, clamp(projectile.depth + .115, .02, .98));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.shadowColor = '#5ee8ef';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(94,232,239,.42)';
    ctx.lineWidth = 18 * Math.max(.45, head.scale);
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();
    ctx.shadowColor = '#d896ff';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#d896ff';
    ctx.lineWidth = 8 * Math.max(.45, head.scale);
    ctx.stroke();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * Math.max(.45, head.scale);
    ctx.stroke();
    ctx.restore();
  }

  drawCelebration(ctx) {
    if (!this.celebrationParticles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of this.celebrationParticles) {
      const alpha = clamp(1 - particle.age / particle.duration, 0, 1);
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.spin);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;
      if (particle.star) {
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const angle = -Math.PI / 2 + point * Math.PI / 5;
          const radius = point % 2 ? particle.size * .42 : particle.size;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          point ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-particle.size * .65, -particle.size * .22, particle.size * 1.3, particle.size * .44);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawPlanet(ctx, size) {
    const gradient = ctx.createRadialGradient(-size * .28, -size * .32, size * .05, 0, 0, size);
    gradient.addColorStop(0, '#ffd97f');
    gradient.addColorStop(.42, '#e8688f');
    gradient.addColorStop(1, '#512b80');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,.78)';
    ctx.lineWidth = Math.max(2, size * .16);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.45, size * .35, -.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawMeteor(ctx, size) {
    ctx.shadowColor = '#ff8b58';
    ctx.shadowBlur = size * .5;
    ctx.fillStyle = '#8f5d61';
    ctx.beginPath();
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const radius = size * (.78 + (index % 3) * .11);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#553a56';
    [[-.28,-.2,.2],[.3,.15,.15],[-.05,.38,.12]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x * size, y * size, r * size, 0, Math.PI * 2); ctx.fill(); });
  }

  drawHotStar(ctx, size) {
    ctx.shadowColor = '#ffd24f';
    ctx.shadowBlur = size;
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    for (let index = 0; index < 16; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * index) / 8;
      const radius = index % 2 ? size * .48 : size * 1.18;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2a8';
    ctx.beginPath();
    ctx.arc(0, 0, size * .48, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRivalShip(ctx, size) {
    ctx.shadowColor = '#ff5f9d';
    ctx.shadowBlur = size * .45;
    ctx.fillStyle = '#ec6ca5';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * .82, size * .75);
    ctx.lineTo(0, size * .42);
    ctx.lineTo(-size * .82, size * .75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8cecff';
    ctx.beginPath();
    ctx.ellipse(0, -size * .2, size * .26, size * .38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShip(ctx) {
    const skin = SHIP_SKINS[this.shipSkin] || SHIP_SKINS.nebula;
    const trail = SHIP_TRAILS[this.shipTrail] || SHIP_TRAILS.pulse;
    const x = this.width / 2 + this.lanePosition * this.width * .27;
    const mobileCockpit = this.width <= 850;
    const mobileShipHeight = this.height < 380 ? .55 : this.height < 520 ? .66 : .72;
    const y = this.height * (mobileCockpit ? mobileShipHeight : .82);
    const size = clamp(this.width / 13, 58, 88);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((this.lane - this.lanePosition) * .13);
    if (this.weaponPulse > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${this.weaponPulse})`;
      ctx.shadowColor = skin.glow;
      ctx.shadowBlur = 34;
      ctx.beginPath();
      ctx.arc(0, -size * .74, size * (.12 + this.weaponPulse * .15), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const flame = 20 + Math.sin(this.elapsed * 18) * 6;
    ctx.shadowColor = trail.secondary;
    ctx.shadowBlur = 25;
    const trailGradient = ctx.createLinearGradient(0, size * .42, 0, size * .48 + flame);
    trailGradient.addColorStop(0, trail.primary);
    trailGradient.addColorStop(1, trail.secondary);
    ctx.fillStyle = trailGradient;
    ctx.beginPath();
    ctx.moveTo(-size * .2, size * .48);
    ctx.lineTo(0, size * .48 + flame);
    ctx.lineTo(size * .2, size * .48);
    ctx.closePath();
    ctx.fill();
    for (let spark = 0; spark < 4; spark += 1) {
      const drift = Math.sin(this.elapsed * (8 + spark) + spark * 2.1) * size * .18;
      const fall = size * (.62 + spark * .16 + (this.elapsed * .8 % .16));
      ctx.fillStyle = spark % 2 ? trail.primary : trail.secondary;
      ctx.globalAlpha = .72 - spark * .12;
      ctx.beginPath();
      ctx.arc(drift, fall, Math.max(2, size * (.045 - spark * .006)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 12;
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.moveTo(0, -size * .72);
    ctx.quadraticCurveTo(size * .55, -size * .1, size * .42, size * .55);
    ctx.lineTo(0, size * .38);
    ctx.lineTo(-size * .42, size * .55);
    ctx.quadraticCurveTo(-size * .55, -size * .1, 0, -size * .72);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-size * .38, size * .08);
    ctx.lineTo(-size * .78, size * .46);
    ctx.lineTo(-size * .32, size * .38);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * .38, size * .08);
    ctx.lineTo(size * .78, size * .46);
    ctx.lineTo(size * .32, size * .38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.glass;
    ctx.beginPath();
    ctx.ellipse(0, -size * .18, size * .22, size * .31, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.boundKey);
    this.canvas.removeEventListener('pointerdown', this.boundPointer);
  }
}
