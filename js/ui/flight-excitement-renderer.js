import { clamp, projectFlightPoint } from '../core/flight-geometry.js?v=23';
import { NEBULA_RUSH_MAX } from '../core/flight-excitement.js?v=23';

class FlightExcitementRenderer {
  constructor(flight) {
    if (!flight?.context) throw new TypeError('Se requiere una sesión de vuelo para dibujar la emoción de la misión.');
    this.flight = flight;
  }

  detailRatio() {
    return clamp(this.flight.performanceProfile?.detailRatio || 1, .4, 1);
  }

  compactView() {
    return this.flight.width < 620;
  }

  project(lane, depth) {
    return projectFlightPoint({
      width: this.flight.width,
      height: this.flight.height,
      lane,
      depth
    });
  }

  draw() {
    const { context: ctx } = this.flight;
    if (!ctx) return;
    ctx.save();
    if (this.flight.rushTime > 0) this.drawRushField(ctx);
    if (this.compactView()) this.drawMobileClarity(ctx);
    for (const core of this.flight.energyCores || []) this.drawEnergyCore(ctx, core);
    this.drawRushMeter(ctx);
    this.drawChallengeCard(ctx);
    if (this.flight.rushMessageTime > 0) this.drawRushMessage(ctx);
    ctx.restore();
  }

  drawMobileClarity(ctx) {
    const { width, height } = this.flight;
    const horizonY = height * .235;
    ctx.save();

    // Mantiene guías nítidas sin volver a oscurecer la escena ni redibujar la nave.
    // La nave tiene un único renderizador para que su color nunca cambie entre cuadros.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(86,231,255,.58)';
    ctx.lineWidth = 1.6;
    [[.455, .93], [.545, .07]].forEach(([top, bottom]) => {
      ctx.beginPath();
      ctx.moveTo(width * top, horizonY);
      ctx.lineTo(width * bottom, height);
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(137,151,255,.44)';
    ctx.lineWidth = 1.25;
    [-.5, .5].forEach((divider) => {
      ctx.beginPath();
      ctx.moveTo(width / 2 + divider * width * .035, horizonY);
      ctx.lineTo(width / 2 + divider * width * .29, height);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawEnergyCore(ctx, core) {
    const detail = this.detailRatio();
    const compact = this.compactView();
    const point = this.project(core.lane, core.depth);
    const size = Math.max(8, 28 * point.scale);
    const pulse = 1 + Math.sin(this.flight.elapsed * 6 + core.pulse) * .12;
    ctx.save();
    if (core.depth > 1.02) ctx.globalAlpha = clamp((1.14 - core.depth) / .12, 0, 1);
    ctx.translate(point.x, point.y);
    ctx.rotate(core.spin);
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#56e7ff';
    ctx.shadowBlur = size * (compact ? .72 : 1.45) * detail;

    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.7);
    aura.addColorStop(0, 'rgba(255,255,255,.94)');
    aura.addColorStop(.22, 'rgba(86,231,255,.68)');
    aura.addColorStop(.58, 'rgba(216,108,255,.24)');
    aura.addColorStop(1, 'rgba(86,231,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.7 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffc857';
    ctx.lineWidth = Math.max(1.5, size * .11);
    ctx.setLineDash([size * .35, size * .18]);
    ctx.lineDashOffset = -this.flight.elapsed * 18;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.08, size * .48, .45, 0, Math.PI * 2);
    ctx.stroke();

    if (detail > .6) {
      ctx.rotate(-core.spin * 1.7);
      ctx.strokeStyle = '#d86cff';
      ctx.lineWidth = Math.max(1, size * .07);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * .82, size * .82, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * .34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRushMeter(ctx) {
    if (this.flight.mode === 'idle' || this.flight.tutorial) return;
    const detail = this.detailRatio();
    const compact = this.compactView();
    const width = compact ? clamp(this.flight.width * .46, 148, 182) : clamp(this.flight.width * .3, 190, 310);
    const height = compact ? 14 : 20;
    const x = compact ? 12 : (this.flight.width - width) / 2;
    const y = compact ? 20 : 16;
    const active = this.flight.rushTime > 0;
    const ratio = active
      ? clamp(this.flight.rushTime / 6, 0, 1)
      : clamp(this.flight.rushCharge / NEBULA_RUSH_MAX, 0, 1);

    ctx.save();
    ctx.fillStyle = compact ? 'rgba(6,5,22,.9)' : 'rgba(8,5,28,.78)';
    ctx.strokeStyle = active ? 'rgba(255,200,87,.92)' : 'rgba(86,231,255,.68)';
    ctx.lineWidth = compact ? 1.25 : 2;
    this.roundedRect(ctx, x, y, width, height, height / 2);
    ctx.fill();
    ctx.stroke();

    const inset = compact ? 3 : 4;
    const fillWidth = Math.max(0, (width - inset * 2) * ratio);
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(x + inset, 0, x + width - inset, 0);
      gradient.addColorStop(0, active ? '#ffc857' : '#5267ff');
      gradient.addColorStop(.5, '#56e7ff');
      gradient.addColorStop(1, '#d86cff');
      ctx.fillStyle = gradient;
      ctx.shadowColor = active ? '#ffc857' : '#56e7ff';
      ctx.shadowBlur = (compact ? 4 : active ? 20 : 12) * detail;
      this.roundedRect(ctx, x + inset, y + inset, fillWidth, height - inset * 2, height / 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f7f8ff';
    ctx.font = `800 ${compact ? 9 : 12}px system-ui, sans-serif`;
    ctx.textAlign = compact ? 'left' : 'center';
    ctx.textBaseline = 'bottom';
    const label = active
      ? `⚡ IMPULSO · ${this.flight.rushTime.toFixed(1)} s`
      : `✦ IMPULSO · ${Math.round(this.flight.rushCharge)}%`;
    ctx.fillText(label, compact ? x : this.flight.width / 2, y - 3);
    ctx.restore();
  }

  drawChallengeCard(ctx) {
    const challenge = this.flight.sectorChallenge;
    if (!challenge || this.flight.tutorial || this.flight.mode === 'idle') return;

    const detail = this.detailRatio();
    const compact = this.compactView();
    const width = compact ? Math.min(this.flight.width - 112, 208) : 270;
    const height = compact ? 54 : 78;
    const x = 12;
    const y = compact ? 52 : 54;
    const complete = challenge.status === 'completed';
    const failed = challenge.status === 'failed';
    const accent = complete ? '#5ce5a2' : failed ? '#ff7285' : '#56e7ff';
    const pulse = this.flight.challengeMessageTime > 0 ? 1 + Math.sin(this.flight.elapsed * 9) * .01 : 1;

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-width / 2, -height / 2);
    ctx.fillStyle = compact ? 'rgba(6,7,24,.82)' : 'rgba(8,5,28,.84)';
    ctx.strokeStyle = compact ? 'rgba(189,197,225,.3)' : accent;
    ctx.lineWidth = compact ? 1 : complete || failed ? 2.4 : 1.5;
    ctx.shadowColor = accent;
    ctx.shadowBlur = compact ? 0 : (complete ? 18 : failed ? 10 : 8) * detail;
    this.roundedRect(ctx, 0, 0, width, height, compact ? 10 : 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (compact) {
      ctx.fillStyle = accent;
      this.roundedRect(ctx, 0, 0, 3, height, 2);
      ctx.fill();
    }

    const left = compact ? 10 : 13;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = accent;
    ctx.font = `900 ${compact ? 8 : 11}px system-ui, sans-serif`;
    const eyebrow = complete ? '✓ COMPLETADO' : failed ? 'RETO FINALIZADO' : 'DESAFÍO';
    ctx.fillText(eyebrow, left, compact ? 6 : 9);

    ctx.fillStyle = '#f7f8ff';
    ctx.font = `800 ${compact ? 11 : 14}px system-ui, sans-serif`;
    ctx.fillText(this.trimText(`${challenge.icon} ${challenge.title}`, compact ? 25 : 34), left, compact ? 18 : 25);

    ctx.fillStyle = complete ? '#5ce5a2' : failed ? '#ffb2bd' : '#bdc5e1';
    ctx.font = `700 ${compact ? 8.5 : 11}px system-ui, sans-serif`;
    const detailText = complete
      ? `Premio: ${challenge.reward.label}`
      : failed
        ? 'Continúa sin penalización'
        : challenge.instruction;
    ctx.fillText(this.trimText(detailText, compact ? 34 : 44), left, compact ? 33 : 44);

    if (!complete && !failed) {
      const ratio = clamp(challenge.progress / Math.max(1, challenge.target), 0, 1);
      const barY = height - (compact ? 6 : 10);
      ctx.fillStyle = 'rgba(255,255,255,.13)';
      this.roundedRect(ctx, left, barY, width - left * 2, compact ? 3 : 4, 2);
      ctx.fill();
      if (ratio > 0) {
        ctx.fillStyle = accent;
        this.roundedRect(ctx, left, barY, (width - left * 2) * ratio, compact ? 3 : 4, 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  trimText(text, maximum) {
    const value = String(text || '');
    return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
  }

  drawRushField(ctx) {
    const { width, height, elapsed } = this.flight;
    const detail = this.detailRatio();
    const compact = this.compactView();
    const lineCount = Math.max(7, Math.round((compact ? 12 : 18) * detail));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(width * .5, height * .72, 0, width * .5, height * .72, width * .58);
    aura.addColorStop(0, 'rgba(255,200,87,.09)');
    aura.addColorStop(.42, 'rgba(86,231,255,.055)');
    aura.addColorStop(1, 'rgba(216,108,255,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    ctx.lineCap = 'round';
    for (let index = 0; index < lineCount; index += 1) {
      const phase = (elapsed * 1.8 + index / lineCount) % 1;
      const side = index % 2 ? 1 : -1;
      const x = width * .5 + side * width * (.1 + phase * .48);
      const y = height * (.2 + phase * .78);
      const length = 18 + phase * (compact ? 58 : 80);
      ctx.strokeStyle = `rgba(${index % 3 ? '86,231,255' : '255,200,87'},${.06 + phase * (compact ? .2 : .32)})`;
      ctx.lineWidth = .8 + phase * (compact ? 1.8 : 3.2);
      ctx.beginPath();
      ctx.moveTo(x, y - length);
      ctx.lineTo(x + side * length * .22, y + length * .2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRushMessage(ctx) {
    const detail = this.detailRatio();
    const compact = this.compactView();
    const progress = clamp(this.flight.rushMessageTime / 2.2, 0, 1);
    const scale = 1 + (1 - progress) * .18;
    ctx.save();
    ctx.translate(this.flight.width / 2, this.flight.height * (compact ? .3 : .36));
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, progress * 1.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${clamp(this.flight.width * (compact ? .055 : .045), 22, 54)}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#56e7ff';
    ctx.shadowBlur = (compact ? 10 : 28) * detail;
    ctx.fillText('¡MODO NÉBULA!', 0, 0);
    ctx.font = `800 ${clamp(this.flight.width * .018, 11, 20)}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffc857';
    ctx.shadowColor = '#ffc857';
    ctx.shadowBlur = (compact ? 6 : 16) * detail;
    ctx.fillText('MENOR CONSUMO · +1 PLASMA', 0, compact ? 28 : 38);
    ctx.restore();
  }

  roundedRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
  }
}

export function createFlightExcitementRenderer(flight) {
  return new FlightExcitementRenderer(flight);
}
