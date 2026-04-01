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
      alpha: randBetween(0.18, 0.4),
    }));

    this.birds = Array.from({ length: 5 }, (_, i) => ({
      x: randBetween(0, W),
      y: randBetween(80, H * 0.42),
      scale: randBetween(0.7, 1.15),
      speed: randBetween(0.35, 0.7),
      flap: Math.random() * Math.PI * 2 + i,
    }));
  }

  update(isPlaying) {
    const W = CONFIG.WIDTH;

    // Floating dust / stars
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

      this.birds.forEach(b => {
        b.x -= b.speed;
        b.flap += 0.12;
        if (b.x < -30) {
          b.x = W + 30;
          b.y = randBetween(80, CONFIG.HEIGHT * 0.42);
        }
      });
    }
  }

  draw(ctx) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, COLORS.sky0);
    sky.addColorStop(0.28, COLORS.sky1);
    sky.addColorStop(0.7, COLORS.sky2);
    sky.addColorStop(1, COLORS.sky3);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Sun glow
    const sun = ctx.createRadialGradient(W * 0.75, H * 0.2, 10, W * 0.75, H * 0.2, 80);
    sun.addColorStop(0, COLORS.sun);
    sun.addColorStop(0.5, '#fff1bf66');
    sun.addColorStop(1, 'transparent');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(W * 0.75, H * 0.2, 82, 0, Math.PI * 2);
    ctx.fill();

    // Haze
    const haze = ctx.createLinearGradient(0, H * 0.15, 0, H * 0.75);
    haze.addColorStop(0, '#fff7e500');
    haze.addColorStop(1, '#fff7e54d');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);

    // Sparkles
    this.stars.forEach(s => {
      const alpha = 0.15 + Math.sin(s.twinkle) * 0.18;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff9ed';
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
        [-34, 4, 42], [0, -12, 30], [34, 2, 36],
        [-10, 6, 24], [22, 8, 23],
      ].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#f2ead9';
      ctx.fillRect(-44, 10, 88, 10);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Birds
    this.birds.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.scale, b.scale);
      ctx.strokeStyle = '#5b4a3d88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(-2, -5 - Math.sin(b.flap) * 2, 4, 0);
      ctx.quadraticCurveTo(10, -5 + Math.sin(b.flap) * 2, 16, 0);
      ctx.stroke();
      ctx.restore();
    });

    // Distant hills
    this._drawHill(ctx, COLORS.hill0, H - CONFIG.GROUND_H - 44, [
      [0, 22], [50, 8], [100, 26], [170, 4], [250, 24], [320, 8], [400, 24],
    ]);
    this._drawHill(ctx, COLORS.hill1, H - CONFIG.GROUND_H - 28, [
      [0, 24], [60, 14], [130, 32], [210, 10], [300, 28], [360, 14], [400, 26],
    ]);
    this._drawHill(ctx, COLORS.hill2, H - CONFIG.GROUND_H - 8, [
      [0, 30], [80, 18], [150, 34], [240, 14], [320, 28], [400, 20],
    ]);

    // Ground
    const gGrad = ctx.createLinearGradient(0, H - CONFIG.GROUND_H, 0, H);
    gGrad.addColorStop(0, COLORS.ground0);
    gGrad.addColorStop(1, COLORS.ground1);
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, H - CONFIG.GROUND_H, W, CONFIG.GROUND_H);
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(0, H - CONFIG.GROUND_H - 2, W, 4);

    // Grass strokes
    ctx.strokeStyle = '#f8efc955';
    ctx.lineWidth = 1.4;
    for (let x = 0; x < W; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, H - CONFIG.GROUND_H + 10);
      ctx.lineTo(x + 2, H - CONFIG.GROUND_H + 3 + Math.sin(x * 0.08) * 2);
      ctx.stroke();
    }
  }

  _drawHill(ctx, color, baseY, points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.HEIGHT);
    ctx.lineTo(points[0][0], baseY + points[0][1]);
    points.forEach(([x, y], i) => {
      const next = points[i + 1];
      if (!next) return;
      const midX = (x + next[0]) / 2;
      const midY = baseY + (y + next[1]) / 2;
      ctx.quadraticCurveTo(x, baseY + y, midX, midY);
    });
    const last = points[points.length - 1];
    ctx.lineTo(last[0], CONFIG.HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
}
