import { clamp, projectFlightPoint } from '../core/flight-geometry.js?v=23';
import { NEBULA_RUSH_MAX } from '../core/flight-excitement.js?v=23';

class FlightExcitementRenderer {
  constructor(flight) {
    if (!flight?.context) throw new TypeError('Se requiere una sesión de vuelo para dibujar la emoción de la misión.');
    this.flight = flight;
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
    [...(this.flight.energyCores || [])]
      .sort((left, right) => left.depth - right.depth)
      .forEach((core) => this.drawEnergyCore(ctx, core));
    if (this.flight.rushTime > 0) this.drawRushField(ctx);
    this.drawRushMeter(ctx);
    if (this.flight.rushMessageTime > 0) this.drawRushMessage(ctx);
    ctx.restore();
  }

  drawEnergyCore(ctx, core) {
    const point = this.project(core.lane, core.depth);
    const size = Math.max(8, 28 * point.scale);
    const pulse = 1 + Math.sin(this.flight.elapsed * 6 + core.pulse) * .12;
    ctx.save();
    if (core.depth > 1.02) ctx.globalAlpha = clamp((1.14 - core.depth) / .12, 0, 1);
    ctx.translate(point.x, point.y);
    ctx.rotate(core.spin);
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#56e7ff';
    ctx.shadowBlur = size * 1.45;

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

    ctx.rotate(-core.spin * 1.7);
    ctx.strokeStyle = '#d86cff';
    ctx.lineWidth = Math.max(1, size * .07);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * .82, size * .82, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * .34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRushMeter(ctx) {
    if (this.flight.mode === 'idle' || this.flight.tutorial) return;
    const width = clamp(this.flight.width * .3, 190, 310);
    const height = 20;
    const x = (this.flight.width - width) / 2;
    const y = 16;
    const active = this.flight.rushTime > 0;
    const ratio = active
      ? clamp(this.flight.rushTime / 6, 0, 1)
      : clamp(this.flight.rushCharge / NEBULA_RUSH_MAX, 0, 1);

    ctx.save();
    ctx.fillStyle = 'rgba(8,5,28,.78)';
    ctx.strokeStyle = active ? 'rgba(255,200,87,.92)' : 'rgba(86,231,255,.55)';
    ctx.lineWidth = 2;
    this.roundedRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    const inset = 4;
    const fillWidth = Math.max(0, (width - inset * 2) * ratio);
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(x + inset, 0, x + width - inset, 0);
      gradient.addColorStop(0, active ? '#ffc857' : '#5267ff');
      gradient.addColorStop(.5, '#56e7ff');
      gradient.addColorStop(1, '#d86cff');
      ctx.fillStyle = gradient;
      ctx.shadowColor = active ? '#ffc857' : '#56e7ff';
      ctx.shadowBlur = active ? 20 : 12;
      this.roundedRect(ctx, x + inset, y + inset, fillWidth, height - inset * 2, 7);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f7f8ff';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = active
      ? `⚡ MODO IMPULSO · ${this.flight.rushTime.toFixed(1)} s`
      : `✦ IMPULSO NÉBULA · ${Math.round(this.flight.rushCharge)}%`;
    ctx.fillText(label, this.flight.width / 2, y - 4);
    ctx.restore();
  }

  drawRushField(ctx) {
    const { width, height, elapsed } = this.flight;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(width * .5, height * .72, 0, width * .5, height * .72, width * .58);
    aura.addColorStop(0, 'rgba(255,200,87,.11)');
    aura.addColorStop(.42, 'rgba(86,231,255,.07)');
    aura.addColorStop(1, 'rgba(216,108,255,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    ctx.lineCap = 'round';
    for (let index = 0; index < 18; index += 1) {
      const phase = (elapsed * 1.8 + index / 18) % 1;
      const side = index % 2 ? 1 : -1;
      const x = width * .5 + side * width * (.1 + phase * .48);
      const y = height * (.2 + phase * .78);
      const length = 18 + phase * 80;
      ctx.strokeStyle = `rgba(${index % 3 ? '86,231,255' : '255,200,87'},${.08 + phase * .32})`;
      ctx.lineWidth = 1 + phase * 3.2;
      ctx.beginPath();
      ctx.moveTo(x, y - length);
      ctx.lineTo(x + side * length * .22, y + length * .2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRushMessage(ctx) {
    const progress = clamp(this.flight.rushMessageTime / 2.2, 0, 1);
    const scale = 1 + (1 - progress) * .18;
    ctx.save();
    ctx.translate(this.flight.width / 2, this.flight.height * .36);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, progress * 1.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${clamp(this.flight.width * .045, 28, 54)}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#56e7ff';
    ctx.shadowBlur = 28;
    ctx.fillText('¡MODO NÉBULA!', 0, 0);
    ctx.font = `800 ${clamp(this.flight.width * .018, 13, 20)}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffc857';
    ctx.shadowColor = '#ffc857';
    ctx.shadowBlur = 16;
    ctx.fillText('MENOR CONSUMO · +1 PLASMA', 0, 38);
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
