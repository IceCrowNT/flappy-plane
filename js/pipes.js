// ============================
//  FLAPPY PLANE - Pipes
// ============================

import { CONFIG, COLORS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export class PipeManager {
  constructor() {
    this.pipes = [];
    this.timer = 0;
  }

  reset() {
    this.pipes = [];
    this.timer = 0;
  }

  update() {
    this.timer++;
    if (this.timer >= CONFIG.PIPE_INTERVAL) {
      this._spawn();
      this.timer = 0;
    }
    this.pipes.forEach(p => {
      p.x -= CONFIG.PIPE_SPEED;
    });
    this.pipes = this.pipes.filter(p => p.x > -CONFIG.PIPE_WIDTH - 20);
  }

  _spawn() {
    const minY = 80;
    const maxY = CONFIG.HEIGHT - CONFIG.GROUND_H - 80 - CONFIG.PIPE_GAP;
    const topH = Math.random() * (maxY - minY) + minY;
    this.pipes.push({ x: CONFIG.WIDTH + 20, topH, scoredBy: {} });
  }

  checkScoring(players) {
    const scoreMap = Object.fromEntries(players.map(player => [player.id, 0]));

    this.pipes.forEach(pipe => {
      players.forEach(player => {
        if (!player.alive) return;
        if (!pipe.scoredBy[player.id] && pipe.x + CONFIG.PIPE_WIDTH < player.plane.x) {
          pipe.scoredBy[player.id] = true;
          scoreMap[player.id]++;
        }
      });
    });

    return scoreMap;
  }

  checkCollision(hb) {
    for (const p of this.pipes) {
      const inX = hb.x < p.x + CONFIG.PIPE_WIDTH && hb.x + hb.w > p.x;
      if (inX && (hb.y < p.topH - 10 || hb.y + hb.h > p.topH + CONFIG.PIPE_GAP)) {
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    this.pipes.forEach(p => this._drawPipe(ctx, p.x, p.topH));
  }

  _drawPipe(ctx, x, topH) {
    const W = CONFIG.PIPE_WIDTH;
    const G = CONFIG.PIPE_GAP;
    const H = CONFIG.HEIGHT;
    const botY = topH + G;
    const botH = H - botY;

    const tGrad = ctx.createLinearGradient(x, 0, x + W, 0);
    tGrad.addColorStop(0, COLORS.pipe0);
    tGrad.addColorStop(0.5, COLORS.pipe1);
    tGrad.addColorStop(1, COLORS.pipe2);
    ctx.fillStyle = tGrad;
    roundRect(ctx, x, 0, W, topH - 10, 6);
    ctx.fill();

    ctx.fillStyle = COLORS.pipeCap;
    roundRect(ctx, x - 6, topH - 26, W + 12, 26, 8);
    ctx.fill();
    ctx.strokeStyle = COLORS.pipe2;
    ctx.lineWidth = 2;
    roundRect(ctx, x - 6, topH - 26, W + 12, 26, 8);
    ctx.stroke();

    const bGrad = ctx.createLinearGradient(x, 0, x + W, 0);
    bGrad.addColorStop(0, COLORS.pipe0);
    bGrad.addColorStop(0.5, COLORS.pipe1);
    bGrad.addColorStop(1, COLORS.pipe2);
    ctx.fillStyle = bGrad;
    roundRect(ctx, x, botY + 10, W, botH, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.pipeCap;
    roundRect(ctx, x - 6, botY, W + 12, 26, 8);
    ctx.fill();
    ctx.strokeStyle = COLORS.pipe2;
    roundRect(ctx, x - 6, botY, W + 12, 26, 8);
    ctx.stroke();
  }
}
