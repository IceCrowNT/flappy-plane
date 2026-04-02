// ============================
//  FLAPPY PLANE - Background
// ============================

import { CONFIG, COLORS } from './config.js';

function randBetween(a, b) {
  return Math.random() * (b - a) + a;
}

export class Background {
  constructor() {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    this.sparkles = Array.from({ length: CONFIG.STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * (H * 0.5),
      phase: Math.random() * Math.PI * 2,
      speed: randBetween(0.01, 0.03),
    }));

    this.clouds = Array.from({ length: CONFIG.CLOUD_COUNT }, (_, index) => ({
      x: Math.random() * W,
      y: randBetween(32, H * 0.44),
      scale: randBetween(0.65, 1.2),
      speed: randBetween(0.12, 0.32),
      alpha: randBetween(0.86, 0.98),
      layer: index % 2,
    }));

    this.islands = [
      { x: 300, y: 126, scale: 1.05, speed: 0.2, homeX: 300 },
      { x: 122, y: 164, scale: 0.82, speed: 0.14, homeX: 122 },
    ];
  }

  update(isPlaying) {
    this.sparkles.forEach(s => {
      s.phase += s.speed;
    });

    if (!isPlaying) return;

    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -140) c.x = CONFIG.WIDTH + 80;
    });

    this.islands.forEach((island, index) => {
      island.x -= island.speed;
      if (island.x < -120) island.x = CONFIG.WIDTH + 80 + index * 70;
    });
  }

  draw(ctx) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    this._drawSkyBands(ctx, W, H);
    this._drawSun(ctx, W, H);
    this.clouds.forEach(cloud => this._drawCloud(ctx, cloud));
    this.sparkles.forEach(s => this._drawSparkle(ctx, s));
    this._drawHills(ctx, H);
    this.islands.forEach(island => this._drawIsland(ctx, island));
    this._drawVillage(ctx, H);
    this._drawGround(ctx, W, H);
  }

  _drawSkyBands(ctx, W, H) {
    const bands = [
      [COLORS.sky0, 0, 0.22],
      [COLORS.sky1, 0.22, 0.48],
      [COLORS.sky2, 0.48, 0.74],
      [COLORS.sky3, 0.74, 1],
    ];

    bands.forEach(([color, from, to]) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, H * from, W, H * (to - from) + 1);
    });
  }

  _drawSun(ctx, W, H) {
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(W * 0.75, H * 0.18, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.canvasGlow;
    ctx.beginPath();
    ctx.arc(W * 0.75, H * 0.18, 58, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSparkle(ctx, sparkle) {
    const alpha = 0.35 + Math.sin(sparkle.phase) * 0.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.cloud;
    ctx.fillRect(Math.round(sparkle.x), Math.round(sparkle.y), 2, 2);
    ctx.globalAlpha = 1;
  }

  _drawCloud(ctx, cloud) {
    ctx.save();
    ctx.globalAlpha = cloud.alpha;
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);

    ctx.fillStyle = COLORS.cloudShadow;
    this._pixelCloud(ctx, 2, 2);
    ctx.fillStyle = COLORS.cloud;
    this._pixelCloud(ctx, 0, 0);

    ctx.restore();
  }

  _pixelCloud(ctx, ox, oy) {
    const pixels = [
      [0, 10, 18, 10], [16, 4, 20, 12], [34, 8, 22, 10], [10, 0, 16, 10], [28, 0, 16, 10],
      [6, 18, 44, 8],
    ];
    pixels.forEach(([x, y, w, h]) => {
      ctx.fillRect(x + ox, y + oy, w, h);
    });
  }

  _drawHills(ctx, H) {
    this._drawHillBand(ctx, COLORS.hillBack, H - CONFIG.GROUND_H - 104, [
      [0, 18], [58, 0], [120, 22], [196, 4], [272, 20], [338, 6], [400, 26],
    ]);
    this._drawHillBand(ctx, COLORS.hillMid, H - CONFIG.GROUND_H - 72, [
      [0, 28], [70, 10], [136, 28], [210, 8], [300, 30], [370, 14], [400, 20],
    ]);
    this._drawHillBand(ctx, COLORS.hillFront, H - CONFIG.GROUND_H - 34, [
      [0, 36], [74, 16], [150, 40], [238, 18], [316, 36], [400, 22],
    ]);
  }

  _drawHillBand(ctx, color, baseY, points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.HEIGHT);
    ctx.lineTo(points[0][0], baseY + points[0][1]);
    points.forEach(([x, y], index) => {
      const next = points[index + 1];
      if (!next) return;
      const midX = (x + next[0]) / 2;
      const midY = baseY + (y + next[1]) / 2;
      ctx.quadraticCurveTo(x, baseY + y, midX, midY);
    });
    ctx.lineTo(CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  _drawIsland(ctx, island) {
    ctx.save();
    ctx.translate(island.x, island.y);
    ctx.scale(island.scale, island.scale);

    ctx.fillStyle = COLORS.islandGrass;
    ctx.beginPath();
    ctx.moveTo(-34, -10);
    ctx.quadraticCurveTo(0, -28, 38, -8);
    ctx.lineTo(34, 4);
    ctx.quadraticCurveTo(0, 18, -36, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.islandGrassDeep;
    ctx.fillRect(-34, -2, 68, 8);

    ctx.fillStyle = COLORS.islandDirt;
    ctx.beginPath();
    ctx.moveTo(-28, 6);
    ctx.lineTo(26, 8);
    ctx.lineTo(14, 30);
    ctx.lineTo(-18, 32);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.islandDirtDeep;
    ctx.fillRect(-14, 30, 8, 10);
    ctx.fillRect(6, 28, 7, 10);

    this._drawTinyTree(ctx, -4, -18);
    this._drawStonePillar(ctx, -18, -12, 1);
    this._drawStonePillar(ctx, 18, -12, 0.85);
    this._drawCrystal(ctx, 12, -2, 0.85);

    ctx.restore();
  }

  _drawTinyTree(ctx, x, y) {
    ctx.fillStyle = COLORS.hudFrame;
    ctx.fillRect(x - 3, y + 8, 6, 16);
    ctx.fillStyle = COLORS.hillFront;
    ctx.fillRect(x - 16, y - 4, 12, 10);
    ctx.fillRect(x - 6, y - 10, 14, 12);
    ctx.fillRect(x + 6, y - 4, 12, 10);
  }

  _drawStonePillar(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = COLORS.stoneMid;
    ctx.fillRect(-4, -16, 8, 24);
    ctx.fillStyle = COLORS.stoneLight;
    ctx.fillRect(-6, -20, 12, 6);
    ctx.fillStyle = COLORS.stoneDark;
    ctx.fillRect(-4, 8, 8, 3);
    ctx.restore();
  }

  _drawCrystal(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = COLORS.crystal;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, -2);
    ctx.lineTo(3, 8);
    ctx.lineTo(-3, 8);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.crystalDeep;
    ctx.fillRect(-1, -6, 2, 10);
    ctx.restore();
  }

  _drawVillage(ctx, H) {
    const houses = [
      [74, H - CONFIG.GROUND_H - 40, 0.95],
      [108, H - CONFIG.GROUND_H - 46, 1.18],
      [142, H - CONFIG.GROUND_H - 42, 1.02],
      [180, H - CONFIG.GROUND_H - 48, 0.88],
      [216, H - CONFIG.GROUND_H - 44, 1.08],
    ];

    houses.forEach(([x, y, scale], index) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      this._drawHouse(ctx, index % 2 === 0);
      ctx.restore();
    });
  }

  _drawHouse(ctx, withTower) {
    ctx.fillStyle = COLORS.houseWall;
    ctx.fillRect(-12, 0, 24, 18);
    ctx.fillStyle = COLORS.houseRoof;
    ctx.beginPath();
    ctx.moveTo(-15, 2);
    ctx.lineTo(0, -12);
    ctx.lineTo(15, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.houseWindow;
    ctx.fillRect(-5, 6, 4, 5);
    ctx.fillRect(3, 6, 4, 5);
    ctx.fillStyle = COLORS.hudFrameDeep;
    ctx.fillRect(-1, 12, 2, 6);
    if (withTower) {
      ctx.fillStyle = COLORS.houseWall;
      ctx.fillRect(10, -8, 7, 26);
      ctx.fillStyle = COLORS.houseRoof;
      ctx.fillRect(9, -12, 9, 5);
    }
  }

  _drawGround(ctx, W, H) {
    const gGrad = ctx.createLinearGradient(0, H - CONFIG.GROUND_H, 0, H);
    gGrad.addColorStop(0, COLORS.groundTop);
    gGrad.addColorStop(1, COLORS.groundBottom);
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, H - CONFIG.GROUND_H, W, CONFIG.GROUND_H);
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(0, H - CONFIG.GROUND_H - 2, W, 4);

    ctx.fillStyle = COLORS.hillFront;
    for (let x = 0; x < W; x += 16) {
      ctx.fillRect(x, H - CONFIG.GROUND_H + 10 + ((x / 16) % 2) * 2, 8, 10);
    }
  }
}
