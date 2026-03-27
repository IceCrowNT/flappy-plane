// ============================
//  FLAPPY PLANE - Plane
// ============================

import { CONFIG } from './config.js';

export class Plane {
  constructor(options = {}) {
    this.x = options.x ?? CONFIG.PLANE_X;
    this.w = CONFIG.PLANE_W;
    this.h = CONFIG.PLANE_H;
    this.theme = {
      stripe: options.stripeColor ?? '#7f5af0',
      wing: options.wingColor ?? '#c8b8f5',
      wingInner: options.wingInnerColor ?? '#d8ccff',
      tail: options.tailColor ?? '#9b79f0',
      stabilizer: options.stabilizerColor ?? '#b09ee0',
      trailHue: options.trailHue ?? 200,
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
      const r = (1 - i / this.trail.length) * 6 * t.life;
      ctx.save();
      ctx.globalAlpha = t.life * 0.5;
      ctx.fillStyle = `hsl(${this.theme.trailHue + i * 10}, 90%, 70%)`;
      ctx.beginPath();
      ctx.arc(t.x - i * 2, t.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate((this.tilt * Math.PI) / 180);
    const wobX = Math.sin(frame * 0.3) * 1.5 * this.wobble;
    ctx.translate(wobX, 0);
    const scale = 1 + this.wobble * 0.04;
    ctx.scale(scale, scale);
    this._drawShape(ctx, -this.w / 2, -this.h / 2, this.w, this.h, frame);
    ctx.restore();
  }

  _drawShape(ctx, x, y, w, h, frame) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.fillStyle = '#f5f0e8';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy, w * 0.48, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.arc(cx + w * 0.42, cy, h * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.theme.stripe;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.05, w * 0.36, h * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.theme.wing;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy - h * 0.05);
    ctx.bezierCurveTo(cx - w * 0.15, cy - h * 0.55, cx + w * 0.25, cy - h * 0.55, cx + w * 0.22, cy - h * 0.08);
    ctx.bezierCurveTo(cx + w * 0.1, cy + h * 0.18, cx - w * 0.05, cy + h * 0.22, cx - w * 0.1, cy - h * 0.05);
    ctx.fill();
    ctx.fillStyle = this.theme.wingInner;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.05, cy - h * 0.05);
    ctx.bezierCurveTo(cx - w * 0.08, cy - h * 0.38, cx + w * 0.18, cy - h * 0.38, cx + w * 0.15, cy - h * 0.07);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.theme.tail;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, cy - h * 0.05);
    ctx.lineTo(cx - w * 0.52, cy - h * 0.55);
    ctx.lineTo(cx - w * 0.18, cy - h * 0.05);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.theme.stabilizer;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.38, cy + h * 0.05);
    ctx.lineTo(cx - w * 0.52, cy + h * 0.28);
    ctx.lineTo(cx - w * 0.15, cy + h * 0.1);
    ctx.closePath();
    ctx.fill();

    const winX = cx + w * 0.08;
    const winY = cy - h * 0.1;
    ctx.fillStyle = '#aee0ff';
    ctx.beginPath();
    ctx.arc(winX, winY, h * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8f4ff';
    ctx.beginPath();
    ctx.arc(winX - h * 0.05, winY - h * 0.06, h * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a0a2e';
    ctx.beginPath();
    ctx.arc(winX - h * 0.04, winY + h * 0.02, h * 0.04, 0, Math.PI * 2);
    ctx.arc(winX + h * 0.08, winY + h * 0.02, h * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(winX - h * 0.03, winY + h * 0.01, h * 0.015, 0, Math.PI * 2);
    ctx.arc(winX + h * 0.09, winY + h * 0.01, h * 0.015, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1a0a2e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(winX + h * 0.02, winY + h * 0.04, h * 0.05, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const propX = cx + w * 0.46;
    const propAngle = frame * 0.18;
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
      ctx.save();
      ctx.translate(propX, cy);
      ctx.rotate(propAngle + a);
      ctx.fillStyle = a === 0 || a === Math.PI ? '#ffe066' : '#ffb347';
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.22, h * 0.07, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(propX, cy, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(propX, cy, h * 0.05, 0, Math.PI * 2);
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
