// ============================
//  FLAPPY PLANE — Particles
// ============================

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnFlap(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x, y,
        vx: -Math.random() * 3 - 1,
        vy: (Math.random() - 0.5) * 3,
        life: 1,
        color: `hsl(${Math.random() * 60 + 180}, 90%, 70%)`,
        type: 'flap',
      });
    }
  }

  spawnExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`,
        type: 'explosion',
      });
    }
  }

  spawnScore(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: `hsl(${Math.random() * 40 + 40}, 100%, 65%)`,
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
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, 4 * p.life), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
