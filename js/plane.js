// ============================
//  FLAPPY PLANE - Plane
// ============================

import { CONFIG, COLORS } from './config.js';

export class Plane {
  constructor(options = {}) {
    this.x = options.x ?? CONFIG.PLANE_X;
    this.w = CONFIG.PLANE_W;
    this.h = CONFIG.PLANE_H;
    this.theme = {
      stripe: options.stripeColor ?? COLORS.houseRoof,
      wing: options.wingColor ?? COLORS.planeBodyShadow,
      wingInner: options.wingInnerColor ?? COLORS.planeBody,
      tail: options.tailColor ?? COLORS.hudFrameDeep,
      stabilizer: options.stabilizerColor ?? COLORS.crystal,
      trail: options.trailColor ?? COLORS.lanternGlow,
    };
    this.reset();
  }

  reset() {
    this.y = CONFIG.HEIGHT / 2;
    this.vy = 0;
    this.tilt = 0;
    this.wobble = 0;
    this.trail = [];
  }

  flap() {
    this.vy = CONFIG.FLAP_POWER;
    this.wobble = 1;
  }

  update(frame, isPlaying) {
    if (isPlaying) {
      this.vy += CONFIG.GRAVITY;
      this.vy = Math.min(this.vy, CONFIG.MAX_FALL_SPEED);
      this.y += this.vy;
      this.tilt = Math.max(-28, Math.min(70, this.vy * 3.5));
    }
    this.wobble *= 0.85;

    this.trail.unshift({
      x: this.x - 10,
      y: this.y + this.h / 2,
      life: 1,
    });
    if (this.trail.length > CONFIG.TRAIL_LENGTH) this.trail.pop();
    this.trail.forEach(t => {
      t.life -= 0.08;
    });
  }

  draw(ctx, frame) {
    this.trail.forEach((t, i) => {
      if (t.life <= 0) return;
      const radius = (1 - i / this.trail.length) * 5 * t.life;
      ctx.save();
      ctx.globalAlpha = t.life * 0.7;
      ctx.fillStyle = this.theme.trail;
      ctx.fillRect(Math.round(t.x - i * 1.5), Math.round(t.y - radius / 2), Math.max(2, radius), Math.max(2, radius));
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate((this.tilt * Math.PI) / 180);
    ctx.translate(Math.sin(frame * 0.3) * 1.2 * this.wobble, 0);
    const scale = 1 + this.wobble * 0.04;
    ctx.scale(scale, scale);
    this._drawShape(ctx, -this.w / 2, -this.h / 2, this.w, this.h, frame);
    ctx.restore();
  }

  _drawShape(ctx, x, y, w, h, frame) {
    const bodyX = x + 4;
    const bodyY = y + 7;
    const bodyW = w - 6;
    const bodyH = h - 10;
    const noseX = x + w - 2;
    const bodyMidY = y + h / 2;

    ctx.fillStyle = COLORS.planeBodyShadow;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY + 3, bodyW - 4, bodyH - 2, 10);
    ctx.fill();

    ctx.fillStyle = COLORS.planeBody;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyW - 4, bodyH - 3, 10);
    ctx.fill();

    ctx.fillStyle = this.theme.stripe;
    ctx.fillRect(bodyX + 8, bodyY + bodyH - 10, bodyW - 20, 6);
    ctx.fillStyle = this.theme.wing;
    ctx.fillRect(bodyX + 16, bodyY + 5, 14, 4);

    ctx.fillStyle = COLORS.planeBody;
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW - 10, bodyY + 2);
    ctx.lineTo(noseX, bodyMidY);
    ctx.lineTo(bodyX + bodyW - 10, bodyY + bodyH - 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyW - 4, bodyH - 3, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW - 10, bodyY + 2);
    ctx.lineTo(noseX, bodyMidY);
    ctx.lineTo(bodyX + bodyW - 10, bodyY + bodyH - 4);
    ctx.stroke();

    ctx.fillStyle = this.theme.tail;
    ctx.beginPath();
    ctx.moveTo(bodyX + 6, bodyY + 3);
    ctx.lineTo(bodyX - 4, bodyY - 7);
    ctx.lineTo(bodyX + 8, bodyY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bodyX + 5, bodyY + bodyH - 8);
    ctx.lineTo(bodyX - 6, bodyY + bodyH + 3);
    ctx.lineTo(bodyX + 8, bodyY + bodyH - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.theme.stabilizer;
    ctx.beginPath();
    ctx.moveTo(bodyX + 14, bodyY + bodyH - 2);
    ctx.lineTo(bodyX + 26, bodyY + bodyH + 6);
    ctx.lineTo(bodyX + 34, bodyY + bodyH - 2);
    ctx.lineTo(bodyX + 22, bodyY + bodyH - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    ctx.fillStyle = this.theme.wingInner;
    ctx.beginPath();
    ctx.moveTo(bodyX + 15, bodyMidY);
    ctx.lineTo(bodyX + 24, bodyMidY - 10);
    ctx.lineTo(bodyX + 38, bodyMidY - 6);
    ctx.lineTo(bodyX + 28, bodyMidY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    ctx.fillStyle = COLORS.planeWindow;
    ctx.fillRect(bodyX + 14, bodyY + 6, 10, 8);
    ctx.fillRect(bodyX + 26, bodyY + 6, 10, 8);
    ctx.fillStyle = COLORS.planeWindowShine;
    ctx.fillRect(bodyX + 15, bodyY + 7, 3, 2);
    ctx.fillRect(bodyX + 27, bodyY + 7, 3, 2);
    ctx.strokeStyle = COLORS.ink;
    ctx.strokeRect(bodyX + 14, bodyY + 6, 10, 8);
    ctx.strokeRect(bodyX + 26, bodyY + 6, 10, 8);

    ctx.fillStyle = COLORS.houseWindow;
    ctx.fillRect(bodyX + 7, bodyY + 9, 4, 4);

    const propX = noseX + 2;
    const propY = bodyMidY;
    const spin = frame * 0.35;
    ctx.strokeStyle = COLORS.stoneDark;
    ctx.lineWidth = 2;
    [0, Math.PI / 2].forEach(offset => {
      ctx.save();
      ctx.translate(propX, propY);
      ctx.rotate(spin + offset);
      ctx.beginPath();
      ctx.moveTo(-1, -8);
      ctx.lineTo(1, -8);
      ctx.lineTo(2, 8);
      ctx.lineTo(-2, 8);
      ctx.closePath();
      ctx.fillStyle = offset === 0 ? COLORS.houseRoof : COLORS.houseWindow;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    ctx.fillStyle = COLORS.stoneDark;
    ctx.beginPath();
    ctx.arc(propX, propY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  hitbox() {
    return {
      x: this.x + 6,
      y: this.y + 4,
      w: this.w - 12,
      h: this.h - 8,
    };
  }
}
