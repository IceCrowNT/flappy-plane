const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ui = {
  wisps: document.getElementById('wispCount'),
  health: document.getElementById('healthValue'),
  checkpoint: document.getElementById('checkpointLabel'),
  message: document.getElementById('messageBox'),
};

const WORLD = {
  width: 3600,
  height: 540,
  gravity: 0.7,
  floorY: 470,
  requiredWisps: 5,
};

const keys = new Set();

const camera = {
  x: 0,
  y: 0,
};

const level = {
  platforms: [
    { x: 0, y: 470, w: 520, h: 80, moss: true },
    { x: 210, y: 390, w: 170, h: 18, moss: true },
    { x: 480, y: 470, w: 260, h: 80, moss: true },
    { x: 660, y: 330, w: 150, h: 18, moss: true },
    { x: 840, y: 260, w: 120, h: 18, moss: true },
    { x: 1040, y: 470, w: 260, h: 80, moss: true },
    { x: 1180, y: 360, w: 140, h: 18, moss: true },
    { x: 1380, y: 300, w: 140, h: 18, moss: true },
    { x: 1560, y: 470, w: 380, h: 80, moss: true },
    { x: 1760, y: 390, w: 170, h: 18, moss: true },
    { x: 2010, y: 325, w: 150, h: 18, moss: true },
    { x: 2240, y: 470, w: 300, h: 80, moss: true },
    { x: 2460, y: 365, w: 150, h: 18, moss: true },
    { x: 2680, y: 315, w: 110, h: 18, moss: true },
    { x: 2860, y: 470, w: 250, h: 80, moss: true },
    { x: 3020, y: 390, w: 180, h: 18, moss: true },
    { x: 3250, y: 320, w: 180, h: 18, moss: true },
    { x: 3340, y: 470, w: 260, h: 80, moss: true },
  ],
  walls: [
    { x: 1510, y: 250, w: 28, h: 220 },
    { x: 2815, y: 260, w: 30, h: 210 },
  ],
  hazards: [
    { x: 760, y: 470, w: 220, h: 80, type: 'thorns' },
    { x: 1290, y: 470, w: 180, h: 80, type: 'thorns' },
    { x: 1940, y: 470, w: 170, h: 80, type: 'thorns' },
    { x: 2540, y: 470, w: 180, h: 80, type: 'thorns' },
    { x: 3110, y: 470, w: 160, h: 80, type: 'thorns' },
  ],
  checkpoints: [
    { x: 120, y: 426, name: 'Awakening Pool', active: true },
    { x: 1660, y: 426, name: 'Lantern Hollow', active: false },
    { x: 3380, y: 426, name: 'Forest Shrine', active: false },
  ],
  wisps: [
    { x: 290, y: 340, r: 12, found: false },
    { x: 735, y: 280, r: 12, found: false },
    { x: 1450, y: 250, r: 12, found: false },
    { x: 2080, y: 275, r: 12, found: false },
    { x: 2740, y: 265, r: 12, found: false },
    { x: 3170, y: 340, r: 12, found: false },
  ],
  enemies: [
    { x: 1130, y: 432, w: 42, h: 38, minX: 1060, maxX: 1250, speed: 1.2, dir: 1, hp: 3, cooldown: 0 },
    { x: 2310, y: 432, w: 42, h: 38, minX: 2280, maxX: 2480, speed: 1.4, dir: -1, hp: 3, cooldown: 0 },
    { x: 3400, y: 432, w: 44, h: 40, minX: 3360, maxX: 3520, speed: 1.6, dir: -1, hp: 4, cooldown: 0 },
  ],
  shrine: { x: 3470, y: 260, w: 80, h: 170 },
};

const player = {
  x: 110,
  y: 370,
  w: 28,
  h: 42,
  vx: 0,
  vy: 0,
  facing: 1,
  speed: 0.76,
  maxSpeed: 5.6,
  airControl: 0.55,
  friction: 0.82,
  jumpPower: 12.8,
  jumpCut: 0.5,
  jumpsLeft: 2,
  coyoteFrames: 0,
  jumpBuffer: 0,
  onGround: false,
  onWall: false,
  wallDir: 0,
  dashing: 0,
  dashCooldown: 0,
  invuln: 0,
  fireCooldown: 0,
  health: 4,
  maxHealth: 4,
  spawnX: 110,
  spawnY: 370,
  checkpointName: 'Awakening Pool',
};

const state = {
  wispsCollected: 0,
  gateOpen: false,
  win: false,
  time: 0,
  particles: [],
  shots: [],
  message: '',
  messageTimer: 0,
};

function setMessage(text, duration = 240) {
  state.message = text;
  state.messageTimer = duration;
  ui.message.textContent = text;
}

function syncHud() {
  ui.wisps.textContent = `${state.wispsCollected} / ${WORLD.requiredWisps}`;
  ui.health.textContent = `${player.health}`;
  ui.checkpoint.textContent = player.checkpointName;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(circle, rect) {
  const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function spawnBurst(x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 1.4,
      life: 30 + Math.random() * 24,
      maxLife: 54,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function respawn() {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.jumpsLeft = 2;
  player.dashing = 0;
  player.dashCooldown = 0;
  player.invuln = 70;
  player.health = player.maxHealth;
  state.shots.length = 0;
  setMessage(`Respawn at ${player.checkpointName}`, 150);
  syncHud();
}

function resetRun() {
  level.wisps.forEach(wisp => { wisp.found = false; });
  level.checkpoints.forEach((checkpoint, index) => {
    checkpoint.active = index === 0;
  });
  level.enemies = [
    { x: 1130, y: 432, w: 42, h: 38, minX: 1060, maxX: 1250, speed: 1.2, dir: 1, hp: 3, cooldown: 0 },
    { x: 2310, y: 432, w: 42, h: 38, minX: 2280, maxX: 2480, speed: 1.4, dir: -1, hp: 3, cooldown: 0 },
    { x: 3400, y: 432, w: 44, h: 40, minX: 3360, maxX: 3520, speed: 1.6, dir: -1, hp: 4, cooldown: 0 },
  ];
  state.wispsCollected = 0;
  state.gateOpen = false;
  state.win = false;
  player.spawnX = 110;
  player.spawnY = 370;
  player.checkpointName = 'Awakening Pool';
  respawn();
  setMessage('The forest wakes again. Follow the wisps.', 220);
}

function takeDamage(sourceX) {
  if (player.invuln > 0 || state.win) return;

  player.health -= 1;
  player.invuln = 90;
  player.vx = sourceX < player.x ? 5 : -5;
  player.vy = -7;
  spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#bfffea', 18);
  syncHud();

  if (player.health <= 0) {
    respawn();
  } else {
    setMessage('Spirit hit. Keep moving.', 100);
  }
}

function activateCheckpoint(checkpoint) {
  if (checkpoint.active) return;
  level.checkpoints.forEach(entry => { entry.active = false; });
  checkpoint.active = true;
  player.spawnX = checkpoint.x;
  player.spawnY = checkpoint.y - 38;
  player.checkpointName = checkpoint.name;
  spawnBurst(checkpoint.x + 20, checkpoint.y - 16, '#fff0a3', 16);
  setMessage(`Checkpoint reached: ${checkpoint.name}`, 170);
  syncHud();
}

function fireShot() {
  if (player.fireCooldown > 0 || state.win) return;
  player.fireCooldown = 18;
  state.shots.push({
    x: player.x + player.w / 2,
    y: player.y + 18,
    vx: player.facing * 9,
    life: 70,
    r: 5,
  });
  spawnBurst(player.x + player.facing * 16, player.y + 18, '#e7ffd2', 8);
}

function startDash() {
  if (player.dashCooldown > 0 || player.dashing > 0 || state.win) return;
  player.dashing = 12;
  player.dashCooldown = 68;
  player.vx = player.facing * 11;
  player.vy = 0;
  spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#8af2de', 18);
}

function jump() {
  const canGroundJump = player.onGround || player.coyoteFrames > 0;
  const canAirJump = player.jumpsLeft > 0;
  const canWallJump = player.onWall && !player.onGround;

  if (canWallJump) {
    player.vy = -11.5;
    player.vx = -player.wallDir * 6.5;
    player.jumpsLeft = 1;
    player.onWall = false;
    player.coyoteFrames = 0;
    spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#9ef7e4', 12);
    return;
  }

  if (!canGroundJump && !canAirJump) return;

  player.vy = -player.jumpPower;
  if (!canGroundJump) player.jumpsLeft -= 1;
  else player.jumpsLeft = 1;
  player.onGround = false;
  player.coyoteFrames = 0;
  spawnBurst(player.x + player.w / 2, player.y + player.h, '#d2ffef', 10);
}

function controlDown(code) {
  return keys.has(code);
}

function updatePlayer() {
  player.coyoteFrames = Math.max(0, player.coyoteFrames - 1);
  player.jumpBuffer = Math.max(0, player.jumpBuffer - 1);
  player.dashCooldown = Math.max(0, player.dashCooldown - 1);
  player.fireCooldown = Math.max(0, player.fireCooldown - 1);
  player.invuln = Math.max(0, player.invuln - 1);

  const moveLeft = controlDown('ArrowLeft') || controlDown('KeyA');
  const moveRight = controlDown('ArrowRight') || controlDown('KeyD');
  const moveAxis = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);

  if (moveAxis !== 0) player.facing = moveAxis;

  if (player.dashing > 0) {
    player.dashing -= 1;
    player.vy = 0;
  } else {
    const accel = player.onGround ? player.speed : player.speed * player.airControl;
    player.vx += moveAxis * accel;

    if (moveAxis === 0) {
      player.vx *= player.onGround ? player.friction : 0.96;
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));
    player.vy += WORLD.gravity;
  }

  const previousX = player.x;
  const previousY = player.y;

  player.onGround = false;
  player.onWall = false;
  player.wallDir = 0;

  player.x += player.vx;

  const solidRects = [...level.platforms, ...level.walls];
  solidRects.forEach(platform => {
    if (!rectsOverlap(player, platform)) return;

    if (previousX + player.w <= platform.x) {
      player.x = platform.x - player.w;
      player.vx = 0;
      player.onWall = true;
      player.wallDir = 1;
    } else if (previousX >= platform.x + platform.w) {
      player.x = platform.x + platform.w;
      player.vx = 0;
      player.onWall = true;
      player.wallDir = -1;
    }
  });

  player.y += player.vy;

  solidRects.forEach(platform => {
    if (!rectsOverlap(player, platform)) return;

    if (previousY + player.h <= platform.y) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.coyoteFrames = 8;
      player.jumpsLeft = 1;
    } else if (previousY >= platform.y + platform.h) {
      player.y = platform.y + platform.h;
      player.vy = Math.max(0, player.vy);
    }
  });

  if (player.onWall && !player.onGround && player.vy > 1.2) {
    player.vy = Math.min(player.vy, 2.3);
  }

  if (player.jumpBuffer > 0) {
    jump();
    player.jumpBuffer = 0;
  }

  if (player.y > WORLD.height + 80) {
    respawn();
  }

  level.hazards.forEach(hazard => {
    if (rectsOverlap(player, hazard)) takeDamage(hazard.x + hazard.w / 2);
  });

  level.checkpoints.forEach(checkpoint => {
    const trigger = { x: checkpoint.x - 16, y: checkpoint.y - 72, w: 56, h: 96 };
    if (rectsOverlap(player, trigger)) activateCheckpoint(checkpoint);
  });

  level.wisps.forEach(wisp => {
    if (wisp.found) return;
    if (circleRectOverlap(wisp, player)) {
      wisp.found = true;
      state.wispsCollected += 1;
      spawnBurst(wisp.x, wisp.y, '#fff6b5', 18);
      syncHud();
      if (state.wispsCollected >= WORLD.requiredWisps && !state.gateOpen) {
        state.gateOpen = true;
        setMessage('Forest Shrine is open. Reach the lantern gate.', 260);
      } else {
        setMessage(`Wisp recovered ${state.wispsCollected}/${WORLD.requiredWisps}`, 120);
      }
    }
  });

  level.enemies.forEach(enemy => {
    if (enemy.hp <= 0) return;
    enemy.x += enemy.speed * enemy.dir;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) enemy.dir *= -1;
    enemy.cooldown = Math.max(0, enemy.cooldown - 1);

    if (rectsOverlap(player, enemy)) takeDamage(enemy.x + enemy.w / 2);
  });

  if (state.gateOpen) {
    const shrineTrigger = { x: level.shrine.x - 10, y: level.shrine.y, w: level.shrine.w + 20, h: level.shrine.h + 60 };
    if (rectsOverlap(player, shrineTrigger)) {
      state.win = true;
      setMessage('The shrine answers. Vertical slice complete.', 999999);
    }
  }

  player.x = Math.max(0, Math.min(WORLD.width - player.w, player.x));
}

function updateShots() {
  state.shots = state.shots.filter(shot => {
    shot.x += shot.vx;
    shot.life -= 1;

    const hitEnemy = level.enemies.find(enemy => enemy.hp > 0 && rectsOverlap(
      { x: shot.x - shot.r, y: shot.y - shot.r, w: shot.r * 2, h: shot.r * 2 },
      enemy,
    ));

    if (hitEnemy) {
      hitEnemy.hp -= 1;
      hitEnemy.dir *= -1;
      spawnBurst(shot.x, shot.y, '#fff8c8', 10);
      if (hitEnemy.hp <= 0) {
        spawnBurst(hitEnemy.x + hitEnemy.w / 2, hitEnemy.y + hitEnemy.h / 2, '#8af2de', 24);
      }
      return false;
    }

    return shot.life > 0 && shot.x > 0 && shot.x < WORLD.width;
  });
}

function updateParticles() {
  state.particles = state.particles.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.04;
    particle.life -= 1;
    return particle.life > 0;
  });
}

function updateCamera() {
  const targetX = player.x - canvas.width * 0.36;
  camera.x += (targetX - camera.x) * 0.08;
  camera.x = Math.max(0, Math.min(WORLD.width - canvas.width, camera.x));
}

function update() {
  state.time += 1;
  if (!state.win) updatePlayer();
  updateShots();
  updateParticles();
  updateCamera();

  if (state.messageTimer > 0 && state.messageTimer !== 999999) {
    state.messageTimer -= 1;
    if (state.messageTimer <= 0) ui.message.textContent = '';
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#122637');
  sky.addColorStop(0.48, '#173246');
  sky.addColorStop(1, '#08131d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3; i += 1) {
    const depth = 0.22 + i * 0.18;
    const offset = camera.x * depth;
    ctx.fillStyle = ['#11232d', '#10232b', '#0a1822'][i];
    ctx.beginPath();
    ctx.moveTo(-200 - offset, canvas.height);
    for (let x = -200; x <= canvas.width + 300; x += 140) {
      const peak = 250 + i * 55 + Math.sin((x + offset + i * 90) / 120) * (22 + i * 10);
      ctx.quadraticCurveTo(x + 50, peak, x + 140, canvas.height);
    }
    ctx.lineTo(canvas.width + 400, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 22; i += 1) {
    const x = ((i * 163) - camera.x * 0.18) % (canvas.width + 160);
    const y = 60 + (i % 5) * 48 + Math.sin((state.time + i * 20) / 40) * 12;
    const r = 2 + (i % 3);
    ctx.fillStyle = 'rgba(187, 255, 233, 0.68)';
    ctx.beginPath();
    ctx.arc((x + canvas.width + 160) % (canvas.width + 160) - 80, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorldGlow() {
  const glowPoints = [
    { x: 330, y: 320, r: 140, color: 'rgba(126, 255, 217, 0.18)' },
    { x: 1200, y: 300, r: 160, color: 'rgba(255, 238, 158, 0.16)' },
    { x: 2280, y: 270, r: 180, color: 'rgba(126, 255, 217, 0.16)' },
    { x: 3360, y: 250, r: 200, color: 'rgba(255, 245, 180, 0.20)' },
  ];

  glowPoints.forEach(glow => {
    const x = glow.x - camera.x;
    const gradient = ctx.createRadialGradient(x, glow.y, 10, x, glow.y, glow.r);
    gradient.addColorStop(0, glow.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, glow.y, glow.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlatform(platform) {
  const x = platform.x - camera.x;
  ctx.fillStyle = '#183426';
  ctx.fillRect(x, platform.y, platform.w, platform.h);
  ctx.fillStyle = '#2f5d3f';
  ctx.fillRect(x, platform.y, platform.w, 10);

  for (let i = 0; i < platform.w; i += 26) {
    ctx.fillStyle = 'rgba(145, 255, 193, 0.28)';
    ctx.beginPath();
    ctx.arc(x + i + 8, platform.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHazard(hazard) {
  const x = hazard.x - camera.x;
  ctx.fillStyle = '#431d26';
  ctx.fillRect(x, hazard.y + 18, hazard.w, hazard.h - 18);
  ctx.fillStyle = '#b94f72';
  for (let i = 0; i < hazard.w; i += 18) {
    ctx.beginPath();
    ctx.moveTo(x + i, hazard.y + hazard.h);
    ctx.lineTo(x + i + 9, hazard.y + 10);
    ctx.lineTo(x + i + 18, hazard.y + hazard.h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCheckpoint(checkpoint) {
  const x = checkpoint.x - camera.x;
  ctx.strokeStyle = checkpoint.active ? '#fff4ad' : 'rgba(190, 243, 224, 0.46)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, checkpoint.y);
  ctx.lineTo(x, checkpoint.y - 72);
  ctx.stroke();

  const glow = ctx.createRadialGradient(x + 4, checkpoint.y - 68, 4, x + 4, checkpoint.y - 68, 26);
  glow.addColorStop(0, checkpoint.active ? 'rgba(255, 244, 173, 0.88)' : 'rgba(154, 244, 226, 0.56)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 4, checkpoint.y - 68, 26, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisp(wisp) {
  if (wisp.found) return;
  const pulse = 12 + Math.sin((state.time + wisp.x) / 18) * 2;
  const x = wisp.x - camera.x;
  const glow = ctx.createRadialGradient(x, wisp.y, 0, x, wisp.y, 26);
  glow.addColorStop(0, 'rgba(255, 246, 181, 0.94)');
  glow.addColorStop(0.45, 'rgba(156, 255, 224, 0.52)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, wisp.y, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5ffcf';
  ctx.beginPath();
  ctx.arc(x, wisp.y, pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(enemy) {
  if (enemy.hp <= 0) return;
  const x = enemy.x - camera.x;
  const glow = ctx.createRadialGradient(x + enemy.w / 2, enemy.y + 14, 0, x + enemy.w / 2, enemy.y + 14, 26);
  glow.addColorStop(0, 'rgba(255, 173, 196, 0.40)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + enemy.w / 2, enemy.y + 14, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#dbe6f2';
  ctx.beginPath();
  ctx.ellipse(x + enemy.w / 2, enemy.y + 18, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6f2741';
  ctx.beginPath();
  ctx.moveTo(x + 8, enemy.y + 14);
  ctx.lineTo(x + enemy.w / 2, enemy.y + enemy.h);
  ctx.lineTo(x + enemy.w - 8, enemy.y + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff0f5';
  ctx.fillRect(x + 12, enemy.y + 12, 5, 5);
  ctx.fillRect(x + enemy.w - 17, enemy.y + 12, 5, 5);
}

function drawShrine() {
  const x = level.shrine.x - camera.x;
  ctx.fillStyle = '#243841';
  ctx.fillRect(x, level.shrine.y + 24, level.shrine.w, level.shrine.h);
  ctx.fillStyle = state.gateOpen ? '#fff0a3' : '#2f515e';
  ctx.fillRect(x + 18, level.shrine.y + 40, level.shrine.w - 36, level.shrine.h - 26);

  const glow = ctx.createRadialGradient(
    x + level.shrine.w / 2,
    level.shrine.y + 80,
    10,
    x + level.shrine.w / 2,
    level.shrine.y + 80,
    90,
  );
  glow.addColorStop(0, state.gateOpen ? 'rgba(255, 240, 163, 0.42)' : 'rgba(138, 242, 222, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + level.shrine.w / 2, level.shrine.y + 80, 90, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const x = player.x - camera.x;
  const y = player.y;
  const alpha = player.invuln > 0 && Math.floor(player.invuln / 5) % 2 === 0 ? 0.45 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;

  const glow = ctx.createRadialGradient(x + 14, y + 12, 6, x + 14, y + 12, 34);
  glow.addColorStop(0, 'rgba(241, 255, 246, 0.72)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 14, y + 12, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5fff9';
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 18, 10, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + 14, y + 7, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cffff0';
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 8);
  ctx.quadraticCurveTo(x + 2, y - 10, x - 6, y + 6);
  ctx.quadraticCurveTo(x + 5, y + 4, x + 14, y + 8);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 14, y + 8);
  ctx.quadraticCurveTo(x + 26, y - 10, x + 34, y + 6);
  ctx.quadraticCurveTo(x + 23, y + 4, x + 14, y + 8);
  ctx.fill();

  ctx.fillStyle = '#103645';
  const eyeX = player.facing === 1 ? x + 16 : x + 10;
  ctx.fillRect(eyeX, y + 7, 3, 3);
  ctx.restore();
}

function drawShots() {
  state.shots.forEach(shot => {
    const x = shot.x - camera.x;
    const glow = ctx.createRadialGradient(x, shot.y, 0, x, shot.y, 18);
    glow.addColorStop(0, 'rgba(255, 247, 186, 0.84)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, shot.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff9c7';
    ctx.beginPath();
    ctx.arc(x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawParticles() {
  state.particles.forEach(particle => {
    const x = particle.x - camera.x;
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawForeground() {
  ctx.fillStyle = '#091119';
  ctx.fillRect(0, 505, canvas.width, 35);

  for (let i = 0; i < canvas.width; i += 54) {
    ctx.fillStyle = 'rgba(31, 66, 55, 0.9)';
    ctx.beginPath();
    ctx.moveTo(i, canvas.height);
    ctx.quadraticCurveTo(i + 10, 470, i + 22, canvas.height);
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  drawWorldGlow();
  level.platforms.forEach(drawPlatform);
  level.walls.forEach(drawPlatform);
  level.hazards.forEach(drawHazard);
  level.checkpoints.forEach(drawCheckpoint);
  level.wisps.forEach(drawWisp);
  level.enemies.forEach(drawEnemy);
  drawShrine();
  drawShots();
  drawPlayer();
  drawParticles();
  drawForeground();

  if (!state.gateOpen) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '600 18px Outfit';
    ctx.fillText('Collect 5 wisps to open the shrine', 28, 510);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', event => {
  keys.add(event.code);

  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    player.jumpBuffer = 10;
  }

  if (['ShiftLeft', 'ShiftRight', 'KeyK'].includes(event.code)) {
    event.preventDefault();
    startDash();
  }

  if (['KeyJ', 'KeyZ'].includes(event.code)) {
    event.preventDefault();
    fireShot();
  }

  if (event.code === 'KeyR') {
    event.preventDefault();
    resetRun();
  }
});

document.addEventListener('keyup', event => {
  keys.delete(event.code);

  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code) && player.vy < 0) {
    player.vy *= player.jumpCut;
  }
});

resetRun();
loop();
