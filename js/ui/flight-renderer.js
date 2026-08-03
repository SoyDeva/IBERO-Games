import { FLIGHT_LANES } from '../core/flight-simulation.js?v=23';
import { clamp, easeIn } from '../core/flight-geometry.js?v=23';
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

}

export function createFlightRenderer(flight) {
  return new FlightRenderer(flight);
}
