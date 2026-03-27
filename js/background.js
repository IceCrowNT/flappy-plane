// ============================
//  FLAPPY PLANE — Background
// ============================

import { CONFIG, COLORS } from './config.js';

function randBetween(a, b) {
  return Math.random() * (b - a) + a;
}

export class Background {
  constructor() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    this.stars = Array.from({ length: CONFIG.STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: randBetween(0.3, 1.8),
      twinkle: Math.random() * Math.PI * 2,
      speed: randBetween(0.1, 0.4),
    }));

    this.clouds = Array.from({ length: CONFIG.CLOUD_COUNT }, () => ({
      x: Math.random() * W,
      y: randBetween(30, H * 0.6),
      scale: randBetween(0.4, 1.0),
      speed: randBetween(0.2, 0.6),
      alpha: randBetween(0.1, 0.35),
    }));
  }

  update(isPlaying) {
    const W = CONFIG.WIDTH;

    // Stars slowly drift
    this.stars.forEach(s => {
      s.twinkle += 0.04;
      s.x -= s.speed * 0.3;
      if (s.x < 0) s.x = W;
    });

    // Clouds move only when playing
    if (isPlaying) {
      this.clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -150) c.x = W + 100;
      });
    }
  }

  draw(ctx) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, COLORS.sky0);
    sky.addColorStop(0.5, COLORS.sky1);
    sky.addColorStop(1, COLORS.sky2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    this.stars.forEach(s => {
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Clouds
    this.clouds.forEach(c => {
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.fillStyle = COLORS.cloud;
      [
        [-30, 0, 40], [0, -10, 30], [30, 0, 35],
        [-10, 5, 25], [20, 5, 22],
      ].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Ground
    const gGrad = ctx.createLinearGradient(0, H - CONFIG.GROUND_H, 0, H);
    gGrad.addColorStop(0, COLORS.ground0);
    gGrad.addColorStop(1, COLORS.ground1);
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, H - CONFIG.GROUND_H, W, CONFIG.GROUND_H);
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(0, H - CONFIG.GROUND_H - 2, W, 4);
  }
}
