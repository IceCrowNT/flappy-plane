// ============================
//  FLAPPY PLANE - Particles
// ============================

import { COLORS, PLAYER_THEMES } from './config.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnFlap(x, y) {
    const palette = [PLAYER_THEMES.p1.trail, PLAYER_THEMES.p2.trail, COLORS.cloud];
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: -Math.random() * 2.6 - 0.8,
        vy: (Math.random() - 0.5) * 2.4,
        life: 1,
        color: palette[i % palette.length],
        type: 'flap',
      });
    }
  }

  spawnExplosion(x, y) {
    const palette = [COLORS.houseRoof, COLORS.houseWindow, COLORS.crystal, COLORS.stoneLight];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: palette[i % palette.length],
        type: 'explosion',
      });
    }
  }

  spawnScore(x, y) {
    const palette = [COLORS.houseWindow, COLORS.crystal, COLORS.cloud];
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: palette[i % palette.length],
        type: 'score',
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.04;
    });
  }

  draw(ctx) {
    this.particles.forEach(p => {
      if (p.life <= 0) return;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      const size = Math.max(0, Math.round(4 * p.life));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(2, size), Math.max(2, size));
    });
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
