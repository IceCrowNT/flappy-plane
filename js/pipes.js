// ============================
//  FLAPPY PLANE - Pipes
// ============================

import { CONFIG, COLORS } from './config.js';

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
    this.pipes.forEach(pipe => {
      pipe.x -= CONFIG.PIPE_SPEED;
    });
    this.pipes = this.pipes.filter(pipe => pipe.x > -CONFIG.PIPE_WIDTH - 24);
  }

  _spawn() {
    const minY = 80;
    const maxY = CONFIG.HEIGHT - CONFIG.GROUND_H - 80 - CONFIG.PIPE_GAP;
    const topH = Math.random() * (maxY - minY) + minY;
    const motif = Math.random() > 0.5 ? 'stone' : 'crystal';
    this.pipes.push({ x: CONFIG.WIDTH + 20, topH, scoredBy: {}, motif });
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
    for (const pipe of this.pipes) {
      const inX = hb.x < pipe.x + CONFIG.PIPE_WIDTH && hb.x + hb.w > pipe.x;
      if (inX && (hb.y < pipe.topH - 10 || hb.y + hb.h > pipe.topH + CONFIG.PIPE_GAP)) {
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    this.pipes.forEach(pipe => this._drawGate(ctx, pipe));
  }

  _drawGate(ctx, pipe) {
    const x = pipe.x;
    const topH = pipe.topH;
    const W = CONFIG.PIPE_WIDTH;
    const gap = CONFIG.PIPE_GAP;
    const bottomY = topH + gap;
    const bottomH = CONFIG.HEIGHT - bottomY;

    this._drawColumn(ctx, x, 0, topH - 14, pipe.motif, true);
    this._drawColumn(ctx, x, bottomY + 14, bottomH, pipe.motif, false);
    this._drawArchCap(ctx, x - 6, topH - 24, W + 12);
    this._drawArchCap(ctx, x - 6, bottomY, W + 12);
  }

  _drawColumn(ctx, x, y, h, motif, flipped) {
    const w = CONFIG.PIPE_WIDTH;
    ctx.fillStyle = COLORS.stoneMid;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.stoneLight;
    ctx.fillRect(x + 4, y + 4, 12, h - 8);
    ctx.fillStyle = COLORS.stoneDark;
    ctx.fillRect(x + w - 12, y + 4, 8, h - 8);

    for (let iy = y + 10; iy < y + h - 14; iy += 18) {
      ctx.fillStyle = motif === 'crystal' ? COLORS.crystal : COLORS.houseWindow;
      ctx.fillRect(x + w / 2 - 4, iy, 8, 8);
      ctx.fillStyle = COLORS.ink;
      ctx.strokeRect(x + w / 2 - 4, iy, 8, 8);
    }

    if (motif === 'crystal') {
      this._drawVineCrystal(ctx, x + 9, flipped ? y + h - 18 : y + 10);
      this._drawVineCrystal(ctx, x + w - 16, flipped ? y + h - 30 : y + 22);
    } else {
      this._drawLantern(ctx, x + 10, flipped ? y + h - 18 : y + 12);
      this._drawLantern(ctx, x + w - 10, flipped ? y + h - 32 : y + 26);
    }
  }

  _drawArchCap(ctx, x, y, w) {
    ctx.fillStyle = COLORS.hudFrame;
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = COLORS.stoneLight;
    ctx.fillRect(x + 4, y + 2, w - 8, 4);
    ctx.fillStyle = COLORS.ink;
    ctx.strokeRect(x, y, w, 10);
  }

  _drawLantern(ctx, x, y) {
    ctx.fillStyle = COLORS.lanternGlow;
    ctx.fillRect(x - 4, y - 4, 12, 12);
    ctx.fillStyle = COLORS.houseWindow;
    ctx.fillRect(x - 1, y - 1, 6, 6);
    ctx.fillStyle = COLORS.hudFrameDeep;
    ctx.fillRect(x + 1, y - 5, 2, 4);
  }

  _drawVineCrystal(ctx, x, y) {
    ctx.fillStyle = COLORS.hillFront;
    ctx.fillRect(x, y, 2, 10);
    ctx.fillStyle = COLORS.crystal;
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 6);
    ctx.lineTo(x + 6, y - 1);
    ctx.lineTo(x + 3, y + 4);
    ctx.lineTo(x - 1, y + 2);
    ctx.closePath();
    ctx.fill();
  }
}
