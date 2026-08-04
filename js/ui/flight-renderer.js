import { FLIGHT_LANES } from '../core/flight-simulation.js?v=23';
import { clamp, easeIn, projectFlightPoint } from '../core/flight-geometry.js?v=23';
import { SHIP_SKINS, SHIP_TRAILS } from '../config/ship-catalog.js?v=23';

class FlightRenderer {
  constructor(flight) {
    if (!flight?.context) throw new TypeError('Se requiere una sesión de vuelo con contexto Canvas.');
    this.flight = flight;
    return new Proxy(this, {
      get(target, property, receiver) {
        if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
        const value = flight[property];
        return typeof value === 'function' ? value.bind(flight) : value;
      },
      set(target, property, value, receiver) {
        if (Reflect.has(target, property)) return Reflect.set(target, property, value, receiver);
        flight[property] = value;
        return true;
      }
    });
  }

  project(lane, depth) {
    return projectFlightPoint({
      width: this.width,
      height: this.height,
      lane,
      depth
    });
  }

  visualSpeed() {
    const activeBoost = this.mode === 'running' ? .18 : 0;
    return clamp(.38 + activeBoost + this.checkpoints * .025, .38, 1);
  }

  draw() {
    const ctx = this.context;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - .5) * 14 * this.shake, (Math.random() - .5) * 10 * this.shake);
    this.drawSpace(ctx);
    this.drawSpeedBands(ctx);
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
    this.drawVignette(ctx);
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
    gradient.addColorStop(.42, sector.middle);
    gradient.addColorStop(1, sector.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const nebula = ctx.createRadialGradient(this.width * .16, this.height * .3, 0, this.width * .16, this.height * .3, this.width * .48);
    nebula.addColorStop(0, `rgba(${sector.glow},.28)`);
    nebula.addColorStop(.42, `rgba(${sector.glow},.1)`);
    nebula.addColorStop(1, `rgba(${sector.glow},0)`);
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, this.width, this.height);

    const secondaryNebula = ctx.createRadialGradient(this.width * .86, this.height * .18, 0, this.width * .86, this.height * .18, this.width * .38);
    secondaryNebula.addColorStop(0, 'rgba(216,108,255,.17)');
    secondaryNebula.addColorStop(.48, 'rgba(82,103,255,.07)');
    secondaryNebula.addColorStop(1, 'rgba(82,103,255,0)');
    ctx.fillStyle = secondaryNebula;
    ctx.fillRect(0, 0, this.width, this.height);

    const horizonGlow = ctx.createRadialGradient(this.width * .5, this.height * .235, 0, this.width * .5, this.height * .235, this.width * .28);
    horizonGlow.addColorStop(0, `rgba(${sector.route},.22)`);
    horizonGlow.addColorStop(.35, `rgba(${sector.route},.08)`);
    horizonGlow.addColorStop(1, `rgba(${sector.route},0)`);
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, this.width, this.height * .62);

    this.drawDistantBody(ctx, sector);

    const centerX = this.width / 2;
    const centerY = this.height * .235;
    const speed = this.visualSpeed();
    this.stars.forEach((star) => {
      const radius = star.radius * Math.max(this.width, this.height) * easeIn(star.depth);
      const x = centerX + Math.cos(star.angle) * radius;
      const y = centerY + Math.sin(star.angle) * radius * .7;
      const tail = 3 + star.depth * (13 + speed * 18);
      const alpha = .24 + star.depth * .72;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(star.angle) * tail, y - Math.sin(star.angle) * tail * .7);
      ctx.strokeStyle = `rgba(225,244,255,${alpha})`;
      ctx.lineWidth = star.size * (.42 + star.depth * (1 + speed * .3));
      ctx.stroke();
      if (star.size > 1.55 && star.depth > .42) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * .72})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(.7, star.size * star.depth), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  drawDistantBody(ctx, sector) {
    const radius = clamp(this.width * .055, 24, 58);
    const x = this.width * .82;
    const y = this.height * .17;
    ctx.save();
    ctx.globalAlpha = .76;
    ctx.shadowColor = `rgba(${sector.glow},.55)`;
    ctx.shadowBlur = radius * .75;
    const body = ctx.createRadialGradient(x - radius * .34, y - radius * .4, radius * .05, x, y, radius);
    body.addColorStop(0, 'rgba(255,255,255,.92)');
    body.addColorStop(.18, `rgba(${sector.route},.78)`);
    body.addColorStop(.72, 'rgba(70,45,135,.58)');
    body.addColorStop(1, 'rgba(12,7,35,.08)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = Math.max(1, radius * .035);
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.38, radius * .32, -.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawSpeedBands(ctx) {
    const speed = this.visualSpeed();
    const horizonY = this.height * .235;
    const phase = (this.elapsed * (.42 + speed * .58)) % 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let index = 0; index < 12; index += 1) {
      const progress = (phase + index / 12) % 1;
      const eased = easeIn(progress);
      const side = index % 2 ? 1 : -1;
      const spread = this.width * (.08 + eased * .46);
      const x = this.width / 2 + side * spread;
      const y = horizonY + eased * (this.height - horizonY);
      const length = 8 + eased * (28 + speed * 42);
      ctx.strokeStyle = `rgba(86,231,255,${.025 + eased * .11 * speed})`;
      ctx.lineWidth = .6 + eased * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * length * .42, y + length);
      ctx.stroke();
    }
    ctx.restore();
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
    route.addColorStop(0, 'rgba(50,54,125,.16)');
    route.addColorStop(.58, 'rgba(35,28,91,.58)');
    route.addColorStop(1, 'rgba(15,10,52,.9)');
    ctx.fillStyle = route;
    ctx.fill();

    const edgeGradient = ctx.createLinearGradient(0, horizonY, 0, bottomY);
    edgeGradient.addColorStop(0, `rgba(${sector.route},.08)`);
    edgeGradient.addColorStop(1, `rgba(${sector.route},.62)`);
    ctx.save();
    ctx.strokeStyle = edgeGradient;
    ctx.shadowColor = `rgba(${sector.route},.72)`;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.5;
    [[.455, .94], [.545, .06]].forEach(([top, bottom]) => {
      ctx.beginPath();
      ctx.moveTo(this.width * top, horizonY);
      ctx.lineTo(this.width * bottom, bottomY);
      ctx.stroke();
    });
    ctx.restore();

    ctx.strokeStyle = `rgba(${sector.route},.32)`;
    ctx.lineWidth = 2;
    [-.5, .5].forEach((divider) => {
      ctx.beginPath();
      ctx.moveTo(this.width / 2 + divider * this.width * .035, horizonY);
      ctx.lineTo(this.width / 2 + divider * this.width * .29, bottomY);
      ctx.stroke();
    });

    const speed = this.visualSpeed();
    const offset = (this.elapsed * (.62 + this.checkpoints * .055)) % .14;
    for (let depth = .08 + offset; depth < 1; depth += .14) {
      const y = horizonY + easeIn(depth) * (bottomY - horizonY);
      const half = this.width * (.045 + easeIn(depth) * .44);
      ctx.strokeStyle = `rgba(141,115,255,${.08 + depth * (.18 + speed * .08)})`;
      ctx.lineWidth = 1 + depth * 2.4;
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
    const pulse = 1 + Math.sin(this.elapsed * 4.6) * .045;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalCompositeOperation = 'lighter';

    const aura = ctx.createRadialGradient(0, 0, radius * .08, 0, 0, radius * 1.7);
    aura.addColorStop(0, 'rgba(255,255,255,.72)');
    aura.addColorStop(.18, 'rgba(86,231,255,.28)');
    aura.addColorStop(.58, 'rgba(216,108,255,.13)');
    aura.addColorStop(1, 'rgba(86,231,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(this.elapsed * .82);
    ctx.shadowColor = '#56e7ff';
    ctx.shadowBlur = 26 * point.scale;
    ctx.strokeStyle = 'rgba(86,231,255,.94)';
    ctx.lineWidth = Math.max(2, 7 * point.scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * pulse, radius * .76 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([Math.max(4, radius * .16), Math.max(5, radius * .11)]);
    ctx.lineDashOffset = -this.elapsed * 22;
    ctx.strokeStyle = 'rgba(255,200,87,.92)';
    ctx.lineWidth = Math.max(1, 3 * point.scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * .76, radius * .56, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-this.elapsed * 1.18);
    ctx.strokeStyle = 'rgba(216,108,255,.72)';
    ctx.lineWidth = Math.max(1, 2.2 * point.scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.22, radius * .42, .46, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 8; index += 1) {
      const angle = index * Math.PI / 4;
      const x = Math.cos(angle) * radius * 1.08;
      const y = Math.sin(angle) * radius * .82;
      ctx.fillStyle = index % 2 ? '#ffc857' : '#56e7ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10 * point.scale;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, radius * .035), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * .62);
    core.addColorStop(0, 'rgba(255,255,255,.92)');
    core.addColorStop(.16, 'rgba(86,231,255,.52)');
    core.addColorStop(.52, 'rgba(82,103,255,.2)');
    core.addColorStop(1, 'rgba(11,7,27,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * .62, radius * .45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawObstacle(ctx, obstacle) {
    const point = this.project(obstacle.lane, obstacle.depth);
    const base = 48 * point.scale * obstacle.size;
    ctx.save();
    if (obstacle.depth > 1.04) ctx.globalAlpha = clamp((1.24 - obstacle.depth) / .2, 0, 1);
    ctx.translate(point.x, point.y);
    this.drawObstacleAura(ctx, obstacle, base);
    ctx.rotate(obstacle.spin);
    if (obstacle.type === 'planet') this.drawPlanet(ctx, base);
    if (obstacle.type === 'meteor') this.drawMeteor(ctx, base);
    if (obstacle.type === 'star') this.drawHotStar(ctx, base);
    if (obstacle.type === 'ship') this.drawRivalShip(ctx, base);
    ctx.restore();
  }

  drawObstacleAura(ctx, obstacle, size) {
    if (obstacle.hit || obstacle.depth < .55) return;
    const danger = clamp((obstacle.depth - .55) / .52, 0, 1);
    ctx.save();
    ctx.rotate(-obstacle.spin);
    ctx.strokeStyle = `rgba(255,114,133,${.08 + danger * .28})`;
    ctx.shadowColor = '#ff7285';
    ctx.shadowBlur = 10 + danger * 18;
    ctx.lineWidth = Math.max(1, size * .035);
    ctx.setLineDash([Math.max(3, size * .16), Math.max(4, size * .12)]);
    ctx.lineDashOffset = -this.elapsed * 18;
    ctx.beginPath();
    ctx.arc(0, 0, size * (1.35 + danger * .16), 0, Math.PI * 2);
    ctx.stroke();
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
    ctx.save();
    ctx.shadowColor = '#d86cff';
    ctx.shadowBlur = size * .46;
    const gradient = ctx.createRadialGradient(-size * .32, -size * .38, size * .04, 0, 0, size);
    gradient.addColorStop(0, '#fff3ba');
    gradient.addColorStop(.24, '#ffd97f');
    gradient.addColorStop(.58, '#e8688f');
    gradient.addColorStop(1, '#512b80');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, size * .98, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,226,190,.24)';
    ctx.lineWidth = Math.max(1, size * .09);
    [-.38, -.08, .27].forEach((offset, index) => {
      ctx.beginPath();
      ctx.ellipse(size * .08, size * offset, size * 1.05, size * (.18 + index * .025), -.12, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(57,25,98,.24)';
    [[-.32,-.18,.15],[.28,.12,.11],[-.05,.42,.09]].forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x * size, y * size, radius * size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,220,150,.88)';
    ctx.lineWidth = Math.max(2, size * .16);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.45, size * .35, -.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.26)';
    ctx.lineWidth = Math.max(1, size * .04);
    ctx.beginPath();
    ctx.arc(-size * .14, -size * .12, size * .78, Math.PI * 1.08, Math.PI * 1.72);
    ctx.stroke();
    ctx.restore();
  }

  drawMeteor(ctx, size) {
    ctx.save();
    ctx.shadowColor = '#ff8b58';
    ctx.shadowBlur = size * .62;
    const glow = ctx.createRadialGradient(-size * .25, -size * .3, size * .06, 0, 0, size);
    glow.addColorStop(0, '#d6a09a');
    glow.addColorStop(.34, '#9c6769');
    glow.addColorStop(1, '#4f344b');
    ctx.fillStyle = glow;
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
    [[-.28,-.2,.2],[.3,.15,.15],[-.05,.38,.12]].forEach(([x,y,r]) => {
      ctx.beginPath();
      ctx.arc(x * size, y * size, r * size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,193,140,.48)';
    ctx.lineWidth = Math.max(1, size * .045);
    [[-.12,-.62,.18,-.12],[.2,-.22,.52,.18],[-.5,.15,-.08,.36]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1 * size, y1 * size);
      ctx.lineTo(x2 * size, y2 * size);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawHotStar(ctx, size) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const corona = ctx.createRadialGradient(0, 0, size * .18, 0, 0, size * 1.55);
    corona.addColorStop(0, 'rgba(255,255,230,.95)');
    corona.addColorStop(.35, 'rgba(255,215,94,.52)');
    corona.addColorStop(1, 'rgba(255,139,88,0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ffd24f';
    ctx.shadowBlur = size * 1.1;
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
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.beginPath();
    ctx.arc(-size * .14, -size * .15, size * .14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRivalShip(ctx, size) {
    ctx.save();
    ctx.shadowColor = '#ff5f9d';
    ctx.shadowBlur = size * .55;
    const body = ctx.createLinearGradient(0, -size, 0, size * .8);
    body.addColorStop(0, '#ffb0d0');
    body.addColorStop(.35, '#ec6ca5');
    body.addColorStop(1, '#74306f');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * .82, size * .75);
    ctx.lineTo(0, size * .42);
    ctx.lineTo(-size * .82, size * .75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.36)';
    ctx.lineWidth = Math.max(1, size * .045);
    ctx.stroke();
    ctx.fillStyle = '#8cecff';
    ctx.shadowColor = '#56e7ff';
    ctx.shadowBlur = size * .34;
    ctx.beginPath();
    ctx.ellipse(0, -size * .2, size * .26, size * .38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffc857';
    [-.34, .34].forEach((side) => {
      ctx.beginPath();
      ctx.arc(size * side, size * .54, size * .08, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(216,108,255,.58)';
    ctx.lineWidth = Math.max(1, size * .055);
    ctx.beginPath();
    ctx.moveTo(-size * .52, size * .48);
    ctx.lineTo(0, size * .14);
    ctx.lineTo(size * .52, size * .48);
    ctx.stroke();
    ctx.restore();
  }

  drawShip(ctx) {
    const skin = SHIP_SKINS[this.shipSkin] || SHIP_SKINS.nebula;
    const trail = SHIP_TRAILS[this.shipTrail] || SHIP_TRAILS.pulse;
    const x = this.width / 2 + this.lanePosition * this.width * .27;
    const mobileCockpit = this.width <= 850;
    const mobileShipHeight = this.height < 380 ? .55 : this.height < 520 ? .66 : .72;
    const y = this.height * (mobileCockpit ? mobileShipHeight : .82);
    const size = clamp(this.width / 13, 58, 88);
    const bank = (this.lane - this.lanePosition) * .13;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank);
    this.drawShipWake(ctx, size, trail);
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

    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 17;
    const body = ctx.createLinearGradient(-size * .35, -size * .72, size * .34, size * .55);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(.18, skin.body);
    body.addColorStop(1, skin.wing);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -size * .72);
    ctx.quadraticCurveTo(size * .55, -size * .1, size * .42, size * .55);
    ctx.lineTo(0, size * .38);
    ctx.lineTo(-size * .42, size * .55);
    ctx.quadraticCurveTo(-size * .55, -size * .1, 0, -size * .72);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.58)';
    ctx.lineWidth = Math.max(1.5, size * .026);
    ctx.stroke();

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

    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = Math.max(1, size * .02);
    ctx.beginPath();
    ctx.moveTo(-size * .62, size * .4);
    ctx.lineTo(-size * .22, size * .18);
    ctx.moveTo(size * .62, size * .4);
    ctx.lineTo(size * .22, size * .18);
    ctx.stroke();

    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = skin.glass;
    ctx.beginPath();
    ctx.ellipse(0, -size * .18, size * .22, size * .31, 0, 0, Math.PI * 2);
    ctx.fill();
    const canopy = ctx.createRadialGradient(-size * .08, -size * .3, 0, 0, -size * .18, size * .28);
    canopy.addColorStop(0, 'rgba(255,255,255,.86)');
    canopy.addColorStop(.28, 'rgba(255,255,255,.24)');
    canopy.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = canopy;
    ctx.beginPath();
    ctx.ellipse(0, -size * .18, size * .2, size * .28, 0, 0, Math.PI * 2);
    ctx.fill();

    [-.2, .2].forEach((side) => {
      ctx.fillStyle = '#f7f8ff';
      ctx.shadowColor = trail.primary;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(size * side, size * .42, size * .055, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawShipWake(ctx, size, trail) {
    const speed = this.visualSpeed();
    const flame = 22 + speed * 15 + Math.sin(this.elapsed * 18) * 6;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = trail.secondary;
    ctx.shadowBlur = 30;

    const outer = ctx.createLinearGradient(0, size * .36, 0, size * .56 + flame * 1.45);
    outer.addColorStop(0, trail.primary);
    outer.addColorStop(.36, trail.secondary);
    outer.addColorStop(1, 'rgba(86,231,255,0)');
    ctx.fillStyle = outer;
    ctx.globalAlpha = .45;
    ctx.beginPath();
    ctx.moveTo(-size * .3, size * .42);
    ctx.quadraticCurveTo(0, size * .72 + flame * .55, 0, size * .56 + flame * 1.45);
    ctx.quadraticCurveTo(0, size * .72 + flame * .55, size * .3, size * .42);
    ctx.closePath();
    ctx.fill();

    const core = ctx.createLinearGradient(0, size * .4, 0, size * .48 + flame);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(.2, trail.primary);
    core.addColorStop(1, trail.secondary);
    ctx.fillStyle = core;
    ctx.globalAlpha = .95;
    ctx.beginPath();
    ctx.moveTo(-size * .17, size * .46);
    ctx.lineTo(0, size * .48 + flame);
    ctx.lineTo(size * .17, size * .46);
    ctx.closePath();
    ctx.fill();

    for (let spark = 0; spark < 6; spark += 1) {
      const drift = Math.sin(this.elapsed * (8 + spark) + spark * 2.1) * size * (.12 + spark * .015);
      const fall = size * (.64 + spark * .14 + (this.elapsed * (.7 + speed * .25) % .14));
      ctx.fillStyle = spark % 2 ? trail.primary : trail.secondary;
      ctx.globalAlpha = .78 - spark * .1;
      ctx.beginPath();
      ctx.arc(drift, fall, Math.max(1.4, size * (.045 - spark * .0045)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawVignette(ctx) {
    ctx.save();
    const vignette = ctx.createRadialGradient(this.width * .5, this.height * .48, this.width * .18, this.width * .5, this.height * .5, this.width * .72);
    vignette.addColorStop(0, 'rgba(5,2,20,0)');
    vignette.addColorStop(.68, 'rgba(5,2,20,.05)');
    vignette.addColorStop(1, 'rgba(5,2,20,.48)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
    const cockpitShade = ctx.createLinearGradient(0, this.height * .7, 0, this.height);
    cockpitShade.addColorStop(0, 'rgba(5,2,20,0)');
    cockpitShade.addColorStop(1, 'rgba(5,2,20,.22)');
    ctx.fillStyle = cockpitShade;
    ctx.fillRect(0, this.height * .7, this.width, this.height * .3);
    ctx.restore();
  }
}

export function createFlightRenderer(flight) {
  return new FlightRenderer(flight);
}
