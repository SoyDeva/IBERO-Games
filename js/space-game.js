const LANES = [-1, 0, 1];
const OBSTACLE_TYPES = ['planet', 'meteor', 'star', 'ship'];

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
    this.mode = 'idle';
    this.width = 960;
    this.height = 600;
    this.lane = 0;
    this.lanePosition = 0;
    this.fuel = 62;
    this.hull = 3;
    this.distance = 0;
    this.checkpoints = 0;
    this.nextCheckpoint = 280;
    this.obstacles = [];
    this.explosions = [];
    this.spawnTimer = 1.8;
    this.elapsed = 0;
    this.shake = 0;
    this.flash = 0;
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

  start() {
    this.mode = 'running';
    this.lane = 0;
    this.lanePosition = 0;
    this.fuel = 62;
    this.hull = 3;
    this.distance = 0;
    this.checkpoints = 0;
    this.nextCheckpoint = 280;
    this.obstacles = [];
    this.explosions = [];
    this.spawnTimer = 2.1;
    this.elapsed = 0;
    this.shake = 0;
    this.flash = 0;
    this.emitHud();
  }

  pause() {
    if (this.mode === 'running') this.mode = 'paused';
  }

  resume() {
    if (this.mode === 'paused') this.mode = 'running';
  }

  moveLane(direction) {
    if (this.mode !== 'running') return;
    this.lane = clamp(this.lane + direction, -1, 1);
    this.callbacks.onSteer?.(this.lane);
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
  }

  onPointer(event) {
    if (this.mode !== 'running') return;
    const rect = this.canvas.getBoundingClientRect();
    this.moveLane(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
  }

  answerCorrect() {
    if (this.mode !== 'quiz') return;
    this.checkpoints += 1;
    this.fuel = Math.min(100, this.fuel + 38);
    this.nextCheckpoint += 330 + this.checkpoints * 12;
    this.spawnTimer = 2;
    this.flash = 1;
    this.mode = 'running';
    this.callbacks.onLevelUp?.({ level: this.checkpoints + 1 });
    this.emitHud();
  }

  strand(reason) {
    if (this.mode === 'gameover') return;
    this.mode = 'gameover';
    this.callbacks.onGameOver?.({ reason, distance: Math.round(this.distance), checkpoints: this.checkpoints });
  }

  frame(time) {
    const delta = Math.min((time - this.lastFrame) / 1000, .04);
    this.lastFrame = time;
    this.updateStars(delta, this.mode === 'running' ? 1 : .18);
    if (this.mode === 'running') this.update(delta);
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
    this.elapsed += delta;
    this.lanePosition += (this.lane - this.lanePosition) * Math.min(1, delta * 8);
    const difficulty = this.getDifficulty();
    const distanceRate = 17 + this.checkpoints * 1.8;
    this.distance += distanceRate * delta;
    this.fuel = Math.max(0, this.fuel - delta * (1.05 + this.checkpoints * .035));
    this.flash = Math.max(0, this.flash - delta * 1.8);
    this.shake = Math.max(0, this.shake - delta * 2.5);

    if (this.fuel <= 0) {
      this.strand('Se terminó el combustible antes de llegar al puesto de recarga.');
      return;
    }

    const remaining = this.nextCheckpoint - this.distance;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && remaining > 65) {
      this.spawnWave();
      this.spawnTimer = difficulty.spawnInterval + Math.random() * .32;
    }

    for (const obstacle of this.obstacles) {
      obstacle.depth += delta * difficulty.obstacleSpeed * obstacle.speedFactor;
      obstacle.spin += delta * obstacle.spinSpeed;
      if (!obstacle.hit && obstacle.depth > .86 && obstacle.depth < .99 && Math.abs(obstacle.lane - this.lanePosition) < .4) {
        obstacle.hit = true;
        this.collide(obstacle);
      }
      if (this.mode === 'gameover') break;
    }
    this.explosions.forEach((explosion) => {
      explosion.age += delta;
      explosion.depth += delta * difficulty.obstacleSpeed * .5;
    });
    this.explosions = this.explosions.filter((explosion) => explosion.age < .7);
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.depth < 1.24 && !obstacle.hit);
    if (this.mode !== 'running') {
      this.emitHud();
      return;
    }

    if (this.distance >= this.nextCheckpoint) {
      this.mode = 'quiz';
      this.obstacles = [];
      this.callbacks.onCheckpoint?.({ number: this.checkpoints + 1, fuel: Math.round(this.fuel) });
    }
    this.emitHud();
  }

  getDifficulty() {
    return {
      level: this.checkpoints + 1,
      obstacleSpeed: Math.min(.7, .36 + this.checkpoints * .042),
      spawnInterval: Math.max(.62, 1.42 - this.checkpoints * .085),
      pairChance: Math.min(.82, .12 + this.checkpoints * .115)
    };
  }

  spawnWave() {
    const difficulty = this.getDifficulty();
    const lanes = [...LANES].sort(() => Math.random() - .5);
    const count = Math.random() < difficulty.pairChance ? 2 : 1;
    for (let index = 0; index < count; index += 1) {
      this.obstacles.push({
        type: OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)],
        lane: lanes[index],
        depth: .035 + (index === 1 && this.checkpoints > 4 && Math.random() < .45 ? .1 : 0),
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - .5) * 2.8,
        speedFactor: .92 + Math.random() * .16,
        size: .84 + Math.random() * .32,
        hit: false
      });
    }
  }

  collide(obstacle) {
    this.hull -= 1;
    this.fuel = Math.max(0, this.fuel - 14);
    this.shake = 1;
    this.flash = -.7;
    this.explosions.push({ lane: obstacle.lane, depth: obstacle.depth, age: 0, seed: Math.random() * Math.PI * 2 });
    const names = { planet: 'un planeta', meteor: 'un meteorito', star: 'una estrella ardiente', ship: 'otra nave' };
    this.callbacks.onCollision?.({ name: names[obstacle.type], hull: this.hull });
    if (this.hull <= 0) this.strand('La nave recibió demasiados golpes y quedó varada.');
  }

  emitHud() {
    this.callbacks.onHud?.({
      fuel: Math.round(this.fuel),
      hull: this.hull,
      distance: Math.round(this.distance),
      checkpoint: this.checkpoints + 1,
      remaining: Math.max(0, Math.round(this.nextCheckpoint - this.distance)),
      level: this.checkpoints + 1,
      speed: Math.round(this.getDifficulty().obstacleSpeed * 100)
    });
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
    this.drawCheckpoint(ctx);
    const sorted = [...this.obstacles].sort((a, b) => a.depth - b.depth);
    sorted.filter((obstacle) => obstacle.depth <= .92).forEach((obstacle) => this.drawObstacle(ctx, obstacle));
    this.drawShip(ctx);
    sorted.filter((obstacle) => obstacle.depth > .92).forEach((obstacle) => this.drawObstacle(ctx, obstacle));
    this.explosions.forEach((explosion) => this.drawExplosion(ctx, explosion));
    if (this.flash !== 0) {
      ctx.fillStyle = this.flash > 0 ? `rgba(87,224,160,${this.flash * .22})` : `rgba(255,80,110,${Math.abs(this.flash) * .32})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  drawSpace(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#09041f');
    gradient.addColorStop(.48, '#151044');
    gradient.addColorStop(1, '#08051b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const nebula = ctx.createRadialGradient(this.width * .18, this.height * .34, 0, this.width * .18, this.height * .34, this.width * .42);
    nebula.addColorStop(0, 'rgba(124,78,255,.19)');
    nebula.addColorStop(1, 'rgba(124,78,255,0)');
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

    ctx.strokeStyle = 'rgba(94,232,239,.22)';
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
    const progress = explosion.age / .7;
    const radius = 24 + progress * 86;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha = 1 - progress;
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(.2, '#ffe36e');
    glow.addColorStop(.55, '#ff6d7d');
    glow.addColorStop(1, 'rgba(255,70,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8cf4ff';
    ctx.lineWidth = Math.max(1, 5 * (1 - progress));
    for (let index = 0; index < 10; index += 1) {
      const angle = explosion.seed + index * Math.PI * .2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * .2, Math.sin(angle) * radius * .2);
      ctx.lineTo(Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 1.35);
      ctx.stroke();
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
    const x = this.width / 2 + this.lanePosition * this.width * .27;
    const y = this.height * .82;
    const size = clamp(this.width / 13, 58, 88);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((this.lane - this.lanePosition) * .13);
    const flame = 20 + Math.sin(this.elapsed * 18) * 6;
    ctx.shadowColor = '#5ee8ef';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#5ee8ef';
    ctx.beginPath();
    ctx.moveTo(-size * .2, size * .48);
    ctx.lineTo(0, size * .48 + flame);
    ctx.lineTo(size * .2, size * .48);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#e9efff';
    ctx.beginPath();
    ctx.moveTo(0, -size * .72);
    ctx.quadraticCurveTo(size * .55, -size * .1, size * .42, size * .55);
    ctx.lineTo(0, size * .38);
    ctx.lineTo(-size * .42, size * .55);
    ctx.quadraticCurveTo(-size * .55, -size * .1, 0, -size * .72);
    ctx.fill();
    ctx.fillStyle = '#8d73ff';
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
    ctx.fillStyle = '#54def2';
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
