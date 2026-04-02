const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ui = {
  wisps: document.getElementById('wispCount'),
  health: document.getElementById('healthValue'),
  energy: document.getElementById('energyValue'),
  checkpoint: document.getElementById('checkpointLabel'),
  phase: document.getElementById('phaseLabel'),
  message: document.getElementById('messageBox'),
  overlay: document.getElementById('centerOverlay'),
  overlayEyebrow: document.getElementById('overlayEyebrow'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayText: document.getElementById('overlayText'),
  startButton: document.getElementById('startButton'),
  resumeButton: document.getElementById('resumeButton'),
};

const WORLD = {
  width: 4200,
  height: 540,
  gravity: 0.7,
  requiredWisps: 6,
  bossGateX: 3280,
  shrineX: 3960,
};

const keys = new Set();
const camera = { x: 0, shake: 0 };

function makeEnemy(type, x, y, minX, maxX, speed, hp) {
  return { type, x, y, baseY: y, w: type === 'watcher' ? 36 : 44, h: type === 'watcher' ? 36 : 40, minX, maxX, speed, hp, maxHp: hp, dir: 1, cooldown: 0, alive: true };
}

function makeLevel() {
  return {
    platforms: [
      { x: 0, y: 470, w: 520, h: 80 }, { x: 210, y: 390, w: 170, h: 18 }, { x: 480, y: 470, w: 210, h: 80 },
      { x: 680, y: 340, w: 170, h: 18 }, { x: 905, y: 270, w: 140, h: 18 }, { x: 1120, y: 470, w: 240, h: 80 },
      { x: 1280, y: 370, w: 150, h: 18 }, { x: 1500, y: 300, w: 150, h: 18 }, { x: 1680, y: 470, w: 290, h: 80 },
      { x: 1860, y: 390, w: 180, h: 18 }, { x: 2120, y: 330, w: 170, h: 18 }, { x: 2360, y: 470, w: 280, h: 80 },
      { x: 2580, y: 360, w: 150, h: 18 }, { x: 2790, y: 300, w: 120, h: 18 }, { x: 2960, y: 470, w: 260, h: 80 },
      { x: 3180, y: 395, w: 200, h: 18 }, { x: 3380, y: 470, w: 240, h: 80 }, { x: 3630, y: 470, w: 580, h: 80 },
      { x: 3530, y: 290, w: 150, h: 18 }, { x: 3850, y: 235, w: 140, h: 18 },
    ],
    walls: [
      { x: 1628, y: 250, w: 28, h: 220 }, { x: 3070, y: 245, w: 30, h: 225 }, { x: 3582, y: 180, w: 28, h: 290 },
    ],
    hazards: [
      { x: 710, y: 470, w: 250, h: 80 }, { x: 1370, y: 470, w: 210, h: 80 }, { x: 2020, y: 470, w: 180, h: 80 },
      { x: 2660, y: 470, w: 170, h: 80 }, { x: 3410, y: 470, w: 110, h: 80 },
    ],
    checkpoints: [
      { x: 120, y: 426, name: 'Awakening Pool', active: true },
      { x: 1760, y: 426, name: 'Lantern Hollow', active: false },
      { x: 3420, y: 426, name: 'Sanctum Verge', active: false },
    ],
    wisps: [
      { x: 292, y: 340, r: 12, found: false }, { x: 760, y: 286, r: 12, found: false }, { x: 1588, y: 248, r: 12, found: false },
      { x: 2165, y: 278, r: 12, found: false }, { x: 2860, y: 260, r: 12, found: false }, { x: 3470, y: 244, r: 12, found: false },
    ],
    enemies: [
      makeEnemy('crawler', 1200, 430, 1140, 1320, 1.3, 3),
      makeEnemy('crawler', 1920, 432, 1740, 1948, 1.35, 3),
      makeEnemy('watcher', 2470, 292, 2380, 2720, 1.05, 2),
      makeEnemy('crawler', 3170, 430, 3000, 3210, 1.55, 4),
      makeEnemy('watcher', 3340, 330, 3180, 3520, 1.15, 3),
    ],
    shrine: { x: 3960, y: 190, w: 110, h: 210 },
    boss: { active: false, awakened: false, defeated: false, x: 3850, y: 170, w: 84, h: 84, vx: 0, vy: 0, hp: 18, maxHp: 18, phase: 1, cooldown: 0, dash: 0 },
  };
}

let level = makeLevel();

const player = {
  x: 110, y: 370, w: 28, h: 42, vx: 0, vy: 0, facing: 1, speed: 0.78, maxSpeed: 5.8, airControl: 0.55, friction: 0.82,
  jumpPower: 12.8, jumpCut: 0.5, jumpsLeft: 2, coyote: 0, jumpBuffer: 0, onGround: false, onWall: false, wallDir: 0,
  dashing: 0, dashCooldown: 0, fireCooldown: 0, invuln: 0, health: 4, maxHealth: 4, energy: 100, maxEnergy: 100,
  spawnX: 110, spawnY: 370, checkpointName: 'Awakening Pool',
};

const state = {
  phase: 'intro',
  time: 0,
  wisps: 0,
  gateOpen: false,
  particles: [],
  shots: [],
  enemyShots: [],
  bossLock: false,
  messagePinned: false,
  messageTimer: 0,
};

function syncHud() {
  ui.wisps.textContent = `${state.wisps} / ${WORLD.requiredWisps}`;
  ui.health.textContent = `${player.health}`;
  ui.energy.textContent = `${Math.round(player.energy)}`;
  ui.checkpoint.textContent = player.checkpointName;
  ui.phase.textContent = ({
    intro: 'Dormant',
    playing: state.gateOpen ? 'Shrine Open' : 'Exploring',
    paused: 'Paused',
    boss: `Sentinel ${level.boss.hp}/${level.boss.maxHp}`,
    won: 'Restored',
  })[state.phase];
}

function overlay(eyebrow, title, text, start, resume) {
  ui.overlay.classList.remove('hidden');
  ui.overlayEyebrow.textContent = eyebrow;
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.startButton.style.display = start ? 'inline-flex' : 'none';
  ui.resumeButton.style.display = resume ? 'inline-flex' : 'none';
}

function hideOverlay() {
  ui.overlay.classList.add('hidden');
}

function say(text, duration = 180, pinned = false) {
  ui.message.textContent = text;
  state.messageTimer = duration;
  state.messagePinned = pinned;
}

function solids() {
  return [...level.platforms, ...level.walls];
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(c, r) {
  const cx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(c.y, r.y + r.h));
  const dx = c.x - cx;
  const dy = c.y - cy;
  return dx * dx + dy * dy < c.r * c.r;
}

function burst(x, y, color, count = 10, force = 1) {
  for (let i = 0; i < count; i += 1) state.particles.push({ x, y, vx: (Math.random() - 0.5) * 4 * force, vy: ((Math.random() - 0.5) * 4 - 1.4) * force, life: 28 + Math.random() * 30, maxLife: 58, color, size: 2 + Math.random() * 3 });
}

function resetActor() {
  Object.assign(player, { x: player.spawnX, y: player.spawnY, vx: 0, vy: 0, jumpsLeft: 2, dashing: 0, dashCooldown: 0, fireCooldown: 0, invuln: 70, health: player.maxHealth, energy: player.maxEnergy });
  state.shots = [];
  state.enemyShots = [];
}

function resetRun(intro = true) {
  level = makeLevel();
  Object.assign(player, { spawnX: 110, spawnY: 370, checkpointName: 'Awakening Pool' });
  Object.assign(state, { phase: intro ? 'intro' : 'playing', time: 0, wisps: 0, gateOpen: false, particles: [], shots: [], enemyShots: [], bossLock: false, messagePinned: false, messageTimer: 0 });
  camera.x = 0;
  camera.shake = 0;
  resetActor();
  syncHud();
  if (intro) {
    overlay('Wisp Forest', 'Awaken the forest', 'Collect wisps, manage energy, survive spirit patrols, then break the shrine sentinel in a final arena.', true, false);
    say('Press Start Run to begin.', 999999, true);
  } else {
    hideOverlay();
    say('The forest wakes again. Follow the wisps.', 220);
  }
}

function startRun() {
  ui.startButton.textContent = 'Start Run';
  resetRun(false);
}

function pauseGame() {
  if (state.phase !== 'playing' && state.phase !== 'boss') return;
  state.phase = 'paused';
  overlay('Run paused', 'Hold the light', 'Dash and spirit bolts both consume energy. Resume when you are ready.', false, true);
  syncHud();
}

function resumeGame() {
  if (state.phase !== 'paused') return;
  hideOverlay();
  state.phase = level.boss.active && !level.boss.defeated ? 'boss' : 'playing';
  say(level.boss.active ? 'The sentinel is still hunting.' : 'Back into the canopy.', 90);
  syncHud();
}

function winGame() {
  state.phase = 'won';
  overlay('Shrine restored', 'Sanctum reclaimed', 'You cleared the stronger Ori-lite build: traversal, pressure, and a boss finale in one compact run.', true, false);
  ui.startButton.textContent = 'Play Again';
  say('The shrine answers. Run complete.', 999999, true);
  syncHud();
}

function respawn() {
  resetActor();
  player.invuln = 96;
  say(`Respawn at ${player.checkpointName}`, 140);
  syncHud();
}

function hurt(sourceX, amount = 1) {
  if (player.invuln > 0 || state.phase === 'intro' || state.phase === 'won') return;
  player.health -= amount;
  player.invuln = 90;
  player.vx = sourceX < player.x ? 5 : -5;
  player.vy = -7;
  camera.shake = 12;
  burst(player.x + player.w / 2, player.y + player.h / 2, '#bfffea', 18, 1.1);
  if (player.health <= 0) respawn();
  else say('Spirit hit. Recover your rhythm.', 80);
  syncHud();
}

function activateCheckpoint(checkpoint) {
  if (checkpoint.active) return;
  level.checkpoints.forEach(entry => { entry.active = false; });
  checkpoint.active = true;
  player.spawnX = checkpoint.x;
  player.spawnY = checkpoint.y - 38;
  player.checkpointName = checkpoint.name;
  burst(checkpoint.x + 20, checkpoint.y - 16, '#fff0a3', 16);
  say(`Checkpoint reached: ${checkpoint.name}`, 160);
  syncHud();
}

function spendEnergy(cost) {
  if (player.energy < cost) {
    say('Not enough energy.', 60);
    return false;
  }
  player.energy -= cost;
  syncHud();
  return true;
}

function fireShot() {
  if (player.fireCooldown > 0 || ['intro', 'paused', 'won'].includes(state.phase) || !spendEnergy(14)) return;
  player.fireCooldown = 14;
  state.shots.push({ x: player.x + player.w / 2, y: player.y + 18, vx: player.facing * 10, life: 78, r: 5, dmg: 1 });
  burst(player.x + player.facing * 16, player.y + 18, '#e7ffd2', 8);
}

function dash() {
  if (player.dashCooldown > 0 || player.dashing > 0 || ['intro', 'paused', 'won'].includes(state.phase) || !spendEnergy(20)) return;
  player.dashing = 12;
  player.dashCooldown = 54;
  player.vx = player.facing * 11.8;
  player.vy = 0;
  player.invuln = Math.max(player.invuln, 12);
  burst(player.x + player.w / 2, player.y + player.h / 2, '#8af2de', 18, 1.2);
}

function jump() {
  const ground = player.onGround || player.coyote > 0;
  const wall = player.onWall && !player.onGround;
  if (wall) {
    player.vy = -11.5;
    player.vx = -player.wallDir * 6.5;
    player.jumpsLeft = 1;
    player.onWall = false;
    player.coyote = 0;
    burst(player.x + player.w / 2, player.y + player.h / 2, '#9ef7e4', 12);
    return;
  }
  if (!ground && player.jumpsLeft <= 0) return;
  player.vy = -player.jumpPower;
  player.jumpsLeft = ground ? 1 : player.jumpsLeft - 1;
  player.onGround = false;
  player.coyote = 0;
  burst(player.x + player.w / 2, player.y + player.h, '#d2ffef', 10);
}

function updatePlayer() {
  player.coyote = Math.max(0, player.coyote - 1);
  player.jumpBuffer = Math.max(0, player.jumpBuffer - 1);
  player.dashCooldown = Math.max(0, player.dashCooldown - 1);
  player.fireCooldown = Math.max(0, player.fireCooldown - 1);
  player.invuln = Math.max(0, player.invuln - 1);
  player.energy = Math.min(player.maxEnergy, player.energy + (player.onGround ? 0.34 : 0.18));

  const moveAxis = ((keys.has('ArrowRight') || keys.has('KeyD')) ? 1 : 0) - ((keys.has('ArrowLeft') || keys.has('KeyA')) ? 1 : 0);
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

  const px = player.x;
  const py = player.y;
  player.onGround = false;
  player.onWall = false;
  player.wallDir = 0;

  player.x += player.vx;
  solids().forEach(solid => {
    if (!rectsOverlap(player, solid)) return;
    if (px + player.w <= solid.x) {
      player.x = solid.x - player.w;
      player.vx = 0;
      player.onWall = true;
      player.wallDir = 1;
    } else if (px >= solid.x + solid.w) {
      player.x = solid.x + solid.w;
      player.vx = 0;
      player.onWall = true;
      player.wallDir = -1;
    }
  });

  player.y += player.vy;
  solids().forEach(solid => {
    if (!rectsOverlap(player, solid)) return;
    if (py + player.h <= solid.y) {
      player.y = solid.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.coyote = 8;
      player.jumpsLeft = 1;
    } else if (py >= solid.y + solid.h) {
      player.y = solid.y + solid.h;
      player.vy = Math.max(0, player.vy);
    }
  });

  if (player.onWall && !player.onGround && player.vy > 1.2) player.vy = Math.min(player.vy, 2.3);
  if (player.jumpBuffer > 0) {
    jump();
    player.jumpBuffer = 0;
  }
  if (player.y > WORLD.height + 80) respawn();

  level.hazards.forEach(hazard => { if (rectsOverlap(player, hazard)) hurt(hazard.x + hazard.w / 2); });
  level.checkpoints.forEach(checkpoint => { if (rectsOverlap(player, { x: checkpoint.x - 16, y: checkpoint.y - 72, w: 56, h: 96 })) activateCheckpoint(checkpoint); });
  level.wisps.forEach(wisp => {
    if (wisp.found || !circleRectOverlap(wisp, player)) return;
    wisp.found = true;
    state.wisps += 1;
    player.energy = Math.min(player.maxEnergy, player.energy + 28);
    burst(wisp.x, wisp.y, '#fff6b5', 18, 1.2);
    if (state.wisps >= WORLD.requiredWisps && !state.gateOpen) {
      state.gateOpen = true;
      say('Shrine Gate is open. Cross the sanctum verge.', 240);
    } else {
      say(`Wisp recovered ${state.wisps}/${WORLD.requiredWisps}`, 110);
    }
    syncHud();
  });

  if (state.gateOpen && !level.boss.awakened && player.x > WORLD.bossGateX) {
    level.boss.awakened = true;
    level.boss.active = true;
    state.phase = 'boss';
    state.bossLock = true;
    player.spawnX = 3420;
    player.spawnY = 388;
    player.checkpointName = 'Sanctum Verge';
    level.checkpoints.forEach(cp => { cp.active = cp.name === 'Sanctum Verge'; });
    camera.shake = 18;
    say('Shrine Sentinel awakened. Break the core.', 260);
    syncHud();
  }

  if (state.bossLock) player.x = Math.max(WORLD.bossGateX - 40, player.x);
  player.x = Math.max(0, Math.min(WORLD.width - player.w, player.x));
}

function enemyShot(x, y, tx, ty, speed, color) {
  const dx = tx - x;
  const dy = ty - y;
  const d = Math.max(1, Math.hypot(dx, dy));
  state.enemyShots.push({ x, y, vx: (dx / d) * speed, vy: (dy / d) * speed, r: 5, life: 150, color });
}

function updateEnemies() {
  level.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    enemy.cooldown = Math.max(0, enemy.cooldown - 1);
    enemy.x += enemy.speed * enemy.dir;
    if (enemy.type === 'watcher') enemy.y = enemy.baseY + Math.sin((state.time + enemy.x) / 20) * 18;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) enemy.dir *= -1;
    if (enemy.type === 'watcher' && enemy.cooldown === 0 && Math.abs(player.x - enemy.x) < 360) {
      enemy.cooldown = 96;
      enemyShot(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, player.x + 10, player.y + 14, 4.4, '#ffd1e4');
      burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffd9eb', 8);
    }
    if (rectsOverlap(player, enemy)) hurt(enemy.x + enemy.w / 2);
  });
}

function updateBoss() {
  const boss = level.boss;
  if (!boss.active || boss.defeated) return;
  boss.cooldown = Math.max(0, boss.cooldown - 1);
  boss.phase = boss.hp <= boss.maxHp / 2 ? 2 : 1;
  const tx = Math.max(WORLD.bossGateX + 90, Math.min(WORLD.width - 120, player.x + (player.x < boss.x ? 120 : -120)));
  const ty = 130 + Math.sin(state.time / 24) * 24;
  boss.vx += (tx - boss.x) * 0.005;
  boss.vy += (ty - boss.y) * 0.005;
  boss.vx *= 0.92;
  boss.vy *= 0.92;
  boss.x += boss.vx;
  boss.y += boss.vy;
  if (boss.dash > 0) {
    boss.dash -= 1;
    boss.x += boss.vx * 1.8;
    boss.y += boss.vy * 1.2;
  }
  if (boss.cooldown === 0) {
    if (boss.phase === 1) {
      boss.cooldown = 78;
      for (let i = -1; i <= 1; i += 1) enemyShot(boss.x + boss.w / 2, boss.y + boss.h / 2, player.x + i * 32, player.y + 16, 5, '#ffe8a9');
    } else if (Math.random() > 0.45) {
      boss.cooldown = 56;
      boss.dash = 16;
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      boss.vx = (dx / d) * 8;
      boss.vy = (dy / d) * 4;
      camera.shake = 10;
      burst(boss.x + boss.w / 2, boss.y + boss.h / 2, '#fff1af', 18, 1.4);
    } else {
      boss.cooldown = 42;
      for (let i = 0; i < 5; i += 1) enemyShot(boss.x + boss.w / 2, boss.y + boss.h / 2, WORLD.bossGateX + 110 + i * 155, 470, 4.6, '#ffdb8f');
    }
  }
  if (rectsOverlap(player, boss)) hurt(boss.x + boss.w / 2);
}

function updateShots() {
  state.shots = state.shots.filter(shot => {
    shot.x += shot.vx;
    shot.life -= 1;
    const rect = { x: shot.x - shot.r, y: shot.y - shot.r, w: shot.r * 2, h: shot.r * 2 };
    const enemy = level.enemies.find(entry => entry.alive && rectsOverlap(rect, entry));
    if (enemy) {
      enemy.hp -= shot.dmg;
      enemy.dir *= -1;
      burst(shot.x, shot.y, '#fff8c8', 10);
      if (enemy.hp <= 0) {
        enemy.alive = false;
        player.energy = Math.min(player.maxEnergy, player.energy + 16);
        burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#8af2de', 24, 1.3);
      }
      return false;
    }
    if (level.boss.active && !level.boss.defeated && rectsOverlap(rect, level.boss)) {
      level.boss.hp -= shot.dmg;
      camera.shake = Math.max(camera.shake, 6);
      burst(shot.x, shot.y, '#fff3b2', 12);
      if (level.boss.hp <= 0) {
        level.boss.hp = 0;
        level.boss.defeated = true;
        level.boss.active = false;
        state.bossLock = false;
        burst(level.boss.x + level.boss.w / 2, level.boss.y + level.boss.h / 2, '#b4ffea', 42, 1.6);
        say('Sentinel broken. Climb to the shrine.', 240);
      }
      syncHud();
      return false;
    }
    return shot.life > 0 && shot.x > 0 && shot.x < WORLD.width;
  });
}

function updateEnemyShots() {
  state.enemyShots = state.enemyShots.filter(shot => {
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.life -= 1;
    if (rectsOverlap({ x: shot.x - shot.r, y: shot.y - shot.r, w: shot.r * 2, h: shot.r * 2 }, player)) {
      hurt(shot.x);
      burst(shot.x, shot.y, shot.color, 8);
      return false;
    }
    return shot.life > 0 && shot.x > 0 && shot.x < WORLD.width && shot.y > -40 && shot.y < WORLD.height + 40;
  });
}

function updateParticles() {
  state.particles = state.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.life -= 1;
    return p.life > 0;
  });
}

function updateCamera() {
  let target = player.x - canvas.width * 0.36;
  if (state.bossLock) target = ((WORLD.bossGateX + WORLD.shrineX) / 2) - canvas.width / 2;
  camera.x += (target - camera.x) * 0.08;
  camera.x = Math.max(0, Math.min(WORLD.width - canvas.width, camera.x));
  camera.shake *= 0.84;
}

function update() {
  state.time += 1;
  if (state.phase === 'playing' || state.phase === 'boss') {
    updatePlayer();
    updateEnemies();
    if (level.boss.active) updateBoss();
    updateShots();
    updateEnemyShots();
    if (level.boss.defeated && rectsOverlap(player, { x: level.shrine.x - 20, y: level.shrine.y, w: level.shrine.w + 40, h: level.shrine.h + 80 })) winGame();
  }
  updateParticles();
  updateCamera();
  if (state.messageTimer > 0 && !state.messagePinned) {
    state.messageTimer -= 1;
    if (state.messageTimer <= 0) ui.message.textContent = '';
  }
  syncHud();
}

function bg() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#122637');
  sky.addColorStop(0.48, '#173246');
  sky.addColorStop(1, '#08131d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 4; i += 1) {
    const depth = 0.18 + i * 0.16;
    const off = camera.x * depth;
    ctx.fillStyle = ['#142a35', '#10232b', '#0d1d27', '#09161f'][i];
    ctx.beginPath();
    ctx.moveTo(-220 - off, canvas.height);
    for (let x = -220; x <= canvas.width + 320; x += 140) {
      const peak = 210 + i * 50 + Math.sin((x + off + i * 80) / 110) * (24 + i * 8);
      ctx.quadraticCurveTo(x + 50, peak, x + 140, canvas.height);
    }
    ctx.lineTo(canvas.width + 400, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
}

function cameraBegin() {
  ctx.save();
  ctx.translate((Math.random() - 0.5) * camera.shake, (Math.random() - 0.5) * camera.shake * 0.6);
}

function cameraEnd() {
  ctx.restore();
}

function glow(x, y, r, color) {
  const gx = x - camera.x;
  const g = ctx.createRadialGradient(gx, y, 10, gx, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(gx, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(p) {
  const x = p.x - camera.x;
  ctx.fillStyle = '#183426';
  ctx.fillRect(x, p.y, p.w, p.h);
  ctx.fillStyle = '#2f5d3f';
  ctx.fillRect(x, p.y, p.w, 10);
  for (let i = 0; i < p.w; i += 26) {
    ctx.fillStyle = 'rgba(145,255,193,0.28)';
    ctx.beginPath();
    ctx.arc(x + i + 8, p.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHazard(h) {
  const x = h.x - camera.x;
  ctx.fillStyle = '#431d26';
  ctx.fillRect(x, h.y + 18, h.w, h.h - 18);
  ctx.fillStyle = '#b94f72';
  for (let i = 0; i < h.w; i += 18) {
    ctx.beginPath();
    ctx.moveTo(x + i, h.y + h.h);
    ctx.lineTo(x + i + 9, h.y + 10);
    ctx.lineTo(x + i + 18, h.y + h.h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCheckpoint(cp) {
  const x = cp.x - camera.x;
  ctx.strokeStyle = cp.active ? '#fff4ad' : 'rgba(190,243,224,0.46)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, cp.y);
  ctx.lineTo(x, cp.y - 72);
  ctx.stroke();
  glow(cp.x + 4, cp.y - 68, 26, cp.active ? 'rgba(255,244,173,0.88)' : 'rgba(154,244,226,0.56)');
}

function drawWisp(w) {
  if (w.found) return;
  const x = w.x - camera.x;
  const pulse = 12 + Math.sin((state.time + w.x) / 18) * 2;
  const g = ctx.createRadialGradient(x, w.y, 0, x, w.y, 26);
  g.addColorStop(0, 'rgba(255,246,181,0.94)');
  g.addColorStop(0.45, 'rgba(156,255,224,0.52)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, w.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5ffcf';
  ctx.beginPath();
  ctx.arc(x, w.y, pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  const x = enemy.x - camera.x;
  glow(enemy.x + enemy.w / 2, enemy.y + 14, 26, enemy.type === 'watcher' ? 'rgba(255,227,172,0.38)' : 'rgba(255,173,196,0.40)');
  ctx.fillStyle = enemy.type === 'watcher' ? '#fff4d1' : '#dbe6f2';
  ctx.beginPath();
  ctx.ellipse(x + enemy.w / 2, enemy.y + 18, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.type === 'watcher' ? '#845f1c' : '#6f2741';
  ctx.beginPath();
  ctx.moveTo(x + 8, enemy.y + 14);
  ctx.lineTo(x + enemy.w / 2, enemy.y + enemy.h);
  ctx.lineTo(x + enemy.w - 8, enemy.y + 14);
  ctx.closePath();
  ctx.fill();
}

function drawBoss() {
  const boss = level.boss;
  if ((!boss.active && !boss.defeated) || boss.hp <= 0) return;
  const x = boss.x - camera.x;
  glow(boss.x + boss.w / 2, boss.y + boss.h / 2, 82, boss.phase === 2 ? 'rgba(255,222,136,0.42)' : 'rgba(185,255,228,0.28)');
  ctx.fillStyle = '#f4fff8';
  ctx.beginPath();
  ctx.ellipse(x + boss.w / 2, boss.y + 38, 28, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = boss.phase === 2 ? '#ffca68' : '#8af2de';
  ctx.beginPath();
  ctx.arc(x + boss.w / 2, boss.y + 32, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7e3b4';
  ctx.fillRect(24, 24, 220, 10);
  ctx.fillStyle = '#273840';
  ctx.fillRect(24 + (boss.hp / boss.maxHp) * 220, 24, 220 - (boss.hp / boss.maxHp) * 220, 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeRect(24, 24, 220, 10);
}

function drawShrine() {
  const x = level.shrine.x - camera.x;
  ctx.fillStyle = '#243841';
  ctx.fillRect(x, level.shrine.y + 24, level.shrine.w, level.shrine.h);
  ctx.fillStyle = level.boss.defeated ? '#fff0a3' : (state.gateOpen ? '#89f2de' : '#2f515e');
  ctx.fillRect(x + 18, level.shrine.y + 40, level.shrine.w - 36, level.shrine.h - 26);
}

function drawShots(collection) {
  collection.forEach(shot => {
    const x = shot.x - camera.x;
    const color = shot.color ?? '#fff9c7';
    const outer = shot.color ? `${shot.color}cc` : 'rgba(255,247,186,0.84)';
    const g = ctx.createRadialGradient(x, shot.y, 0, x, shot.y, 18);
    g.addColorStop(0, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, shot.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  const x = player.x - camera.x;
  const y = player.y;
  const alpha = player.invuln > 0 && Math.floor(player.invuln / 5) % 2 === 0 ? 0.45 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x + 14, y + 12, 6, x + 14, y + 12, 34);
  g.addColorStop(0, 'rgba(241,255,246,0.72)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
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
  ctx.restore();
}

function drawParticles() {
  state.particles.forEach(p => {
    const x = p.x - camera.x;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawForeground() {
  ctx.fillStyle = '#091119';
  ctx.fillRect(0, 505, canvas.width, 35);
  for (let i = 0; i < canvas.width; i += 54) {
    ctx.fillStyle = 'rgba(31,66,55,0.9)';
    ctx.beginPath();
    ctx.moveTo(i, canvas.height);
    ctx.quadraticCurveTo(i + 10, 470, i + 22, canvas.height);
    ctx.fill();
  }
}

function drawHint() {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = '600 18px Outfit';
  let text = 'Collect 6 wisps to awaken the shrine';
  if (state.phase === 'boss') text = 'Break the Shrine Sentinel core';
  if (level.boss.defeated) text = 'Climb to the shrine and end the run';
  ctx.fillText(text, 28, 510);
}

function render() {
  bg();
  cameraBegin();
  glow(330, 320, 150, 'rgba(126,255,217,0.18)');
  glow(1360, 290, 180, 'rgba(255,238,158,0.16)');
  glow(2450, 260, 180, 'rgba(126,255,217,0.16)');
  glow(3410, 240, 210, 'rgba(255,245,180,0.18)');
  glow(3970, 210, 240, level.boss.active ? 'rgba(255,207,129,0.20)' : 'rgba(138,242,222,0.12)');
  level.platforms.forEach(drawPlatform);
  level.walls.forEach(drawPlatform);
  level.hazards.forEach(drawHazard);
  level.checkpoints.forEach(drawCheckpoint);
  level.wisps.forEach(drawWisp);
  level.enemies.forEach(drawEnemy);
  drawShrine();
  drawBoss();
  drawShots(state.shots);
  drawShots(state.enemyShots);
  drawPlayer();
  drawParticles();
  drawForeground();
  cameraEnd();
  drawHint();
}

function loop() {
  update();
  render();
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
    dash();
  }
  if (['KeyJ', 'KeyZ'].includes(event.code)) {
    event.preventDefault();
    fireShot();
  }
  if (event.code === 'KeyR') {
    event.preventDefault();
    startRun();
  }
  if (event.code === 'Enter' && state.phase === 'intro') {
    event.preventDefault();
    startRun();
  }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    event.preventDefault();
    if (state.phase === 'paused') resumeGame();
    else pauseGame();
  }
});

document.addEventListener('keyup', event => {
  keys.delete(event.code);
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code) && player.vy < 0) player.vy *= player.jumpCut;
});

ui.startButton.addEventListener('click', startRun);
ui.resumeButton.addEventListener('click', resumeGame);

resetRun(true);
loop();
