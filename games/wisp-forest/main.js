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

function readThemeToken(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

const PALETTE = {
  skyTop: readThemeToken('--theme-sky-top', '#8fc8e8'),
  skyMid: readThemeToken('--theme-sky-mid', '#b9dff0'),
  skyBottom: readThemeToken('--theme-sky-bottom', '#e3f3f7'),
  cloud: readThemeToken('--theme-cloud', '#f8f4de'),
  meadowLight: readThemeToken('--theme-meadow-light', '#c5dc7d'),
  meadow: readThemeToken('--theme-meadow', '#9cc56a'),
  meadowDeep: readThemeToken('--theme-meadow-deep', '#7ca35d'),
  forest: readThemeToken('--theme-forest', '#355a47'),
  forestDeep: readThemeToken('--theme-forest-deep', '#243f34'),
  wood: readThemeToken('--theme-wood', '#8c6548'),
  woodDeep: readThemeToken('--theme-wood-deep', '#6f4f39'),
  ink: readThemeToken('--theme-ink', '#5c5147'),
  roof: readThemeToken('--theme-roof', '#c97b5a'),
  lantern: readThemeToken('--theme-lantern', '#f3c977'),
  crystal: readThemeToken('--theme-crystal', '#8dd9d0'),
  crystalBlue: readThemeToken('--theme-crystal-blue', '#7cc8f2'),
  moonViolet: readThemeToken('--theme-moon-violet', '#7e6bc4'),
  stone: readThemeToken('--theme-stone', '#b8ae9b'),
  surface: readThemeToken('--theme-surface', 'rgba(252, 248, 234, 0.92)'),
  surfaceStrong: readThemeToken('--theme-surface-strong', 'rgba(245, 238, 218, 0.96)'),
  text: readThemeToken('--theme-text', '#4d433b'),
};

const SCENE_ASSET_PATHS = {
  floatingIsland: '/games/wisp-forest/assets/floating-island.svg',
  shrineGate: '/games/wisp-forest/assets/shrine-gate.svg',
  greatTree: '/games/wisp-forest/assets/great-tree.svg',
  crystalCluster: '/games/wisp-forest/assets/crystal-cluster.svg',
  bgFarForest: '/games/wisp-forest/assets/bg-far-forest.svg',
  bgMidForest: '/games/wisp-forest/assets/bg-mid-forest.svg',
  bgForegroundRoots: '/games/wisp-forest/assets/bg-foreground-roots.svg',
  ropeBridge: '/games/wisp-forest/assets/rope-bridge.svg',
  ruinColumn: '/games/wisp-forest/assets/ruin-column.svg',
  playerWisp: '/games/wisp-forest/assets/player-wisp.svg',
  playerWispAlt: '/games/wisp-forest/assets/player-wisp-alt.svg',
  enemyCrawler: '/games/wisp-forest/assets/enemy-crawler.svg',
  enemyCrawlerAlt: '/games/wisp-forest/assets/enemy-crawler-alt.svg',
  enemyWatcher: '/games/wisp-forest/assets/enemy-watcher.svg',
  enemyWatcherAlt: '/games/wisp-forest/assets/enemy-watcher-alt.svg',
  bossSentinel: '/games/wisp-forest/assets/boss-sentinel.svg',
  bossSentinelAlt: '/games/wisp-forest/assets/boss-sentinel-alt.svg',
};

const sceneAssets = {};

function loadSceneAsset(key, src) {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  sceneAssets[key] = { image, ready: false };
  image.addEventListener('load', () => {
    sceneAssets[key].ready = true;
  });
  image.addEventListener('error', () => {
    sceneAssets[key].ready = false;
  });
}

function primeSceneAssets() {
  Object.entries(SCENE_ASSET_PATHS).forEach(([key, src]) => loadSceneAsset(key, src));
}

function drawSceneAsset(key, x, y, width, height, depth = 1, alpha = 1) {
  const asset = sceneAssets[key];
  if (!asset || !asset.ready) return false;
  const screenX = x - camera.x * depth;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(asset.image, screenX, y, width, height);
  ctx.restore();
  return true;
}

function drawSceneAssetTransformed(key, x, y, width, height, options = {}) {
  const asset = sceneAssets[key];
  if (!asset || !asset.ready) return false;
  const {
    depth = 1,
    alpha = 1,
    rotation = 0,
    scaleX = 1,
    scaleY = 1,
    anchorX = 0.5,
    anchorY = 0.5,
    flipX = false,
  } = options;
  const screenX = x - camera.x * depth;
  const pivotX = screenX + width * anchorX;
  const pivotY = y + height * anchorY;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rotation);
  ctx.scale(flipX ? -scaleX : scaleX, scaleY);
  ctx.drawImage(asset.image, -width * anchorX, -height * anchorY, width, height);
  ctx.restore();
  return true;
}

function drawRepeatingAsset(key, y, width, height, depth = 1, alpha = 1) {
  const asset = sceneAssets[key];
  if (!asset || !asset.ready) return false;
  const offset = (camera.x * depth) % width;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let x = -offset - width; x < canvas.width + width; x += width) {
    ctx.drawImage(asset.image, x, y, width, height);
  }
  ctx.restore();
  return true;
}

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
  for (let i = 0; i < count; i += 1) state.particles.push({ x, y, vx: (Math.random() - 0.5) * 4 * force, vy: ((Math.random() - 0.5) * 4 - 1.4) * force, life: 28 + Math.random() * 30, maxLife: 58, color, size: 2 + Math.random() * 3, type: 'spark' });
}

function trailBurst(x, y, color, direction = 1, count = 6) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: -direction * (1.8 + Math.random() * 2.8),
      vy: (Math.random() - 0.5) * 1.4,
      life: 12 + Math.random() * 10,
      maxLife: 22,
      color,
      size: 4 + Math.random() * 4,
      type: 'streak',
    });
  }
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
  if (player.dashing > 0) {
    trailBurst(player.x + player.w / 2, player.y + player.h / 2, PALETTE.crystal, player.facing, 3);
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
  if (drawRepeatingAsset('bgFarForest', 0, 1600, 540, 0.06, 1)) {
    drawCloudBank(120, 98, 1.1, 0.1);
    drawCloudBank(500, 162, 0.86, 0.14);
    drawCloudBank(910, 120, 1.24, 0.08);
    drawDistantIsland(980, 138, 0.08, 0.9);
    drawDistantIsland(1580, 112, 0.12, 0.68);
    drawDistantShrine(2560, 186, 0.2, 0.75);
    if (!drawRepeatingAsset('bgMidForest', 158, 1600, 382, 0.18, 0.9)) {
      for (let i = 0; i < 4; i += 1) {
        const depth = 0.18 + i * 0.16;
        const off = camera.x * depth;
        ctx.fillStyle = [PALETTE.meadowLight, PALETTE.meadow, PALETTE.forest, PALETTE.forestDeep][i];
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
    return;
  }

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.5, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sun = ctx.createRadialGradient(canvas.width * 0.76, 96, 10, canvas.width * 0.76, 96, 110);
  sun.addColorStop(0, 'rgba(248, 244, 222, 0.95)');
  sun.addColorStop(0.36, 'rgba(243, 201, 119, 0.34)');
  sun.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.76, 96, 110, 0, Math.PI * 2);
  ctx.fill();

  drawCloudBank(120, 98, 1.1, 0.1);
  drawCloudBank(500, 162, 0.86, 0.14);
  drawCloudBank(910, 120, 1.24, 0.08);

  for (let i = 0; i < 4; i += 1) {
    const depth = 0.18 + i * 0.16;
    const off = camera.x * depth;
    ctx.fillStyle = [PALETTE.meadowLight, PALETTE.meadow, PALETTE.forest, PALETTE.forestDeep][i];
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

  drawDistantIsland(980, 138, 0.08, 0.9);
  drawDistantIsland(1580, 112, 0.12, 0.68);
  drawDistantShrine(2560, 186, 0.2, 0.75);
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

function drawCloudBank(worldX, y, scale, depth) {
  const x = worldX - camera.x * depth;
  const w = 132 * scale;
  const h = 36 * scale;
  ctx.fillStyle = PALETTE.cloud;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();

  const puffs = [
    [w * 0.18, -h * 0.48, h * 0.72],
    [w * 0.48, -h * 0.66, h * 0.94],
    [w * 0.76, -h * 0.42, h * 0.62],
  ];
  puffs.forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy + h * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(197, 219, 234, 0.74)';
  ctx.beginPath();
  ctx.roundRect(x + 10 * scale, y + h * 0.55, w - 20 * scale, h * 0.2, h);
  ctx.fill();
}

function drawDistantIsland(worldX, y, depth, scale) {
  if (drawSceneAsset('floatingIsland', worldX - 88 * scale, y - 62 * scale, 176 * scale, 132 * scale, depth, 0.82)) return;
  const x = worldX - camera.x * depth;
  const width = 180 * scale;
  const height = 62 * scale;
  ctx.fillStyle = PALETTE.meadowLight;
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.44, height * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.wood;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.28, y + 6 * scale);
  ctx.lineTo(x + width * 0.24, y + 6 * scale);
  ctx.lineTo(x + width * 0.1, y + height);
  ctx.lineTo(x - width * 0.12, y + height * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.forest;
  ctx.fillRect(x - 10 * scale, y - 30 * scale, 16 * scale, 32 * scale);
  ctx.beginPath();
  ctx.arc(x - 2 * scale, y - 38 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawDistantShrine(worldX, y, depth, scale) {
  if (drawSceneAsset('shrineGate', worldX - 74 * scale, y - 74 * scale, 148 * scale, 138 * scale, depth, 0.7)) return;
  const x = worldX - camera.x * depth;
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(x - 46 * scale, y, 92 * scale, 16 * scale);
  ctx.fillRect(x - 28 * scale, y - 34 * scale, 12 * scale, 34 * scale);
  ctx.fillRect(x + 16 * scale, y - 34 * scale, 12 * scale, 34 * scale);
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.beginPath();
  ctx.moveTo(x - 40 * scale, y - 18 * scale);
  ctx.lineTo(x, y - 54 * scale);
  ctx.lineTo(x + 40 * scale, y - 18 * scale);
  ctx.closePath();
  ctx.fill();
  glow(worldX, y - 24 * scale, 36 * scale, 'rgba(141, 217, 208, 0.22)');
}

function drawLanternPost(worldX, groundY, scale = 1) {
  const x = worldX - camera.x;
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.fillRect(x, groundY - 58 * scale, 6 * scale, 58 * scale);
  ctx.fillRect(x - 2 * scale, groundY - 58 * scale, 18 * scale, 5 * scale);
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillRect(x + 7 * scale, groundY - 49 * scale, 10 * scale, 14 * scale);
  glow(worldX + 12 * scale, groundY - 42 * scale, 22 * scale, 'rgba(243, 201, 119, 0.34)');
}

function drawCrystalCluster(worldX, groundY, scale = 1, depth = 1) {
  if (drawSceneAsset('crystalCluster', worldX - 54 * scale, groundY - 88 * scale, 108 * scale, 88 * scale, depth, 0.94)) return;
  const x = worldX - camera.x * depth;
  const crystals = [
    { dx: 0, h: 56, w: 22, color: PALETTE.crystalBlue },
    { dx: -18, h: 38, w: 16, color: PALETTE.crystal },
    { dx: 18, h: 44, w: 18, color: PALETTE.crystal },
  ];
  crystals.forEach(crystal => {
    ctx.fillStyle = crystal.color;
    ctx.beginPath();
    ctx.moveTo(x + crystal.dx, groundY - crystal.h * scale);
    ctx.lineTo(x + crystal.dx + crystal.w * scale * 0.5, groundY - crystal.h * scale * 0.34);
    ctx.lineTo(x + crystal.dx + crystal.w * scale * 0.28, groundY);
    ctx.lineTo(x + crystal.dx - crystal.w * scale * 0.28, groundY);
    ctx.lineTo(x + crystal.dx - crystal.w * scale * 0.5, groundY - crystal.h * scale * 0.34);
    ctx.closePath();
    ctx.fill();
  });
  glow(worldX, groundY - 28 * scale, 34 * scale, 'rgba(141, 217, 208, 0.18)');
}

function drawGreatTree(worldX, groundY, scale = 1) {
  if (drawSceneAsset('greatTree', worldX - 74 * scale, groundY - 200 * scale, 160 * scale, 204 * scale, 1, 0.96)) {
    drawLanternPost(worldX + 26 * scale, groundY - 4 * scale, 0.6 * scale);
    return;
  }
  const x = worldX - camera.x;
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.beginPath();
  ctx.moveTo(x - 14 * scale, groundY);
  ctx.quadraticCurveTo(x - 28 * scale, groundY - 64 * scale, x - 8 * scale, groundY - 124 * scale);
  ctx.quadraticCurveTo(x + 10 * scale, groundY - 160 * scale, x + 14 * scale, groundY - 124 * scale);
  ctx.quadraticCurveTo(x + 34 * scale, groundY - 70 * scale, x + 18 * scale, groundY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PALETTE.forest;
  [
    [x - 34 * scale, groundY - 146 * scale, 42 * scale],
    [x + 18 * scale, groundY - 154 * scale, 48 * scale],
    [x - 4 * scale, groundY - 178 * scale, 54 * scale],
    [x + 42 * scale, groundY - 126 * scale, 34 * scale],
  ].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  drawLanternPost(worldX + 26 * scale, groundY - 4 * scale, 0.6 * scale);
}

function drawShrineArch(worldX, groundY, scale = 1) {
  const x = worldX - camera.x;
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(x - 58 * scale, groundY - 84 * scale, 20 * scale, 84 * scale);
  ctx.fillRect(x + 38 * scale, groundY - 84 * scale, 20 * scale, 84 * scale);
  ctx.fillRect(x - 66 * scale, groundY - 102 * scale, 132 * scale, 18 * scale);
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.beginPath();
  ctx.moveTo(x - 74 * scale, groundY - 94 * scale);
  ctx.lineTo(x, groundY - 142 * scale);
  ctx.lineTo(x + 74 * scale, groundY - 94 * scale);
  ctx.closePath();
  ctx.fill();
  drawCrystalCluster(worldX - 44 * scale, groundY, 0.8 * scale);
  drawCrystalCluster(worldX + 46 * scale, groundY, 0.72 * scale);
}

function drawWorldProps() {
  drawGreatTree(214, 470, 0.92);
  drawLanternPost(548, 468, 0.8);
  drawCrystalCluster(932, 470, 1);
  drawShrineArch(1548, 470, 0.82);
  drawRopeBridge(1578, 334, 210, 0.78);
  drawGreatTree(1836, 470, 0.78);
  drawLanternPost(2268, 468, 0.74);
  drawCrystalCluster(2694, 470, 1.12);
  drawShrineArch(3338, 470, 0.96);
  drawBossArenaDecor();
}

function drawForegroundCanopy() {
  for (let i = -40; i < canvas.width + 80; i += 150) {
    const wobble = Math.sin((state.time + i) / 44) * 4;
    ctx.fillStyle = PALETTE.forest;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.quadraticCurveTo(i + 46, 18 + wobble, i + 84, 0);
    ctx.quadraticCurveTo(i + 110, 34 + wobble, i + 146, 0);
    ctx.lineTo(i + 146, -40);
    ctx.lineTo(i, -40);
    ctx.closePath();
    ctx.fill();
  }
}

function drawRopeBridge(worldX, y, width, sag = 0.7) {
  if (drawSceneAsset('ropeBridge', worldX - 8, y - 22, width + 16, 64, 1, 0.96)) return;
  const x = worldX - camera.x;
  ctx.strokeStyle = PALETTE.woodDeep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + width * 0.5, y + 22 * sag, x + width, y - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.quadraticCurveTo(x + width * 0.5, y + 10 * sag, x + width, y - 20);
  ctx.stroke();
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    const px = x + width * t;
    const py = y + Math.sin(t * Math.PI) * 18 * sag;
    ctx.strokeStyle = PALETTE.woodDeep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - 14);
    ctx.lineTo(px, py + 3);
    ctx.stroke();
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(px - 8, py + 1, 16, 4);
  }
}

function drawFireflyField(depth = 0.22) {
  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 196) - camera.x * depth + (state.time * 0.35 * (i % 2 === 0 ? 1 : -1))) % (canvas.width + 140);
    const y = 170 + (i % 5) * 56 + Math.sin((state.time + i * 14) / 24) * 8;
    const px = (x + canvas.width + 140) % (canvas.width + 140) - 70;
    const glowField = ctx.createRadialGradient(px, y, 0, px, y, 12);
    glowField.addColorStop(0, 'rgba(243, 201, 119, 0.65)');
    glowField.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowField;
    ctx.beginPath();
    ctx.arc(px, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cloud;
    ctx.beginPath();
    ctx.arc(px, y, 2 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBossArenaDecor() {
  if (camera.x > WORLD.bossGateX - canvas.width && (state.gateOpen || level.boss.awakened || level.boss.defeated)) {
    drawCrystalCluster(3650, 470, 1.36);
    drawCrystalCluster(3898, 470, 1.12);
    drawLanternPost(3732, 468, 0.86);
    drawLanternPost(4018, 468, 0.86);
    drawRuinColumn(3604, 470, 1.1);
    drawRuinColumn(4048, 470, 1.1);
  }
}

function drawRuinColumn(worldX, groundY, scale = 1) {
  if (drawSceneAsset('ruinColumn', worldX - 32 * scale, groundY - 118 * scale, 64 * scale, 118 * scale, 1, 0.96)) return;
  const x = worldX - camera.x;
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(x - 14 * scale, groundY - 106 * scale, 28 * scale, 106 * scale);
  ctx.fillRect(x - 22 * scale, groundY - 116 * scale, 44 * scale, 12 * scale);
  ctx.fillRect(x - 20 * scale, groundY - 12 * scale, 40 * scale, 12 * scale);
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.fillRect(x - 6 * scale, groundY - 96 * scale, 12 * scale, 88 * scale);
  glow(worldX, groundY - 68 * scale, 24 * scale, 'rgba(141, 217, 208, 0.14)');
}

function drawPlatform(p) {
  const x = p.x - camera.x;
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.fillRect(x, p.y, p.w, p.h);
  ctx.fillStyle = PALETTE.forest;
  ctx.fillRect(x, p.y, p.w, 10);
  ctx.fillStyle = PALETTE.stone;
  for (let i = 12; i < p.w; i += 48) {
    ctx.fillRect(x + i, p.y + 20, 14, 8);
  }
  for (let i = 0; i < p.w; i += 26) {
    ctx.fillStyle = 'rgba(197, 220, 125, 0.34)';
    ctx.beginPath();
    ctx.arc(x + i + 8, p.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 18; i < p.w - 10; i += 74) {
    ctx.strokeStyle = PALETTE.forest;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + i, p.y + p.h * 0.3);
    ctx.quadraticCurveTo(x + i + 8, p.y + p.h * 0.56, x + i - 4, p.y + p.h * 0.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + i - 4, p.y + p.h * 0.82, 3, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.meadowLight;
    ctx.fill();
  }
}

function drawHazard(h) {
  const x = h.x - camera.x;
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.fillRect(x, h.y + 18, h.w, h.h - 18);
  ctx.fillStyle = PALETTE.roof;
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
  ctx.strokeStyle = cp.active ? PALETTE.lantern : 'rgba(141, 217, 208, 0.56)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, cp.y);
  ctx.lineTo(x, cp.y - 72);
  ctx.stroke();
  glow(cp.x + 4, cp.y - 68, 26, cp.active ? 'rgba(243, 201, 119, 0.82)' : 'rgba(141, 217, 208, 0.52)');
}

function drawWisp(w) {
  if (w.found) return;
  const x = w.x - camera.x;
  const pulse = 12 + Math.sin((state.time + w.x) / 18) * 2;
  const g = ctx.createRadialGradient(x, w.y, 0, x, w.y, 26);
  g.addColorStop(0, 'rgba(243, 201, 119, 0.94)');
  g.addColorStop(0.45, 'rgba(141, 217, 208, 0.52)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, w.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cloud;
  ctx.beginPath();
  ctx.arc(x, w.y, pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  const enemyFrameAlt = enemy.type === 'watcher'
    ? Math.floor((state.time + enemy.x) / 10) % 2 === 0
    : Math.floor((state.time + enemy.x) / 14) % 2 === 0;
  const enemyAssetKey = enemy.type === 'watcher'
    ? (enemyFrameAlt ? 'enemyWatcherAlt' : 'enemyWatcher')
    : (enemyFrameAlt ? 'enemyCrawlerAlt' : 'enemyCrawler');
  const hoverBob = enemy.type === 'watcher' ? Math.sin((state.time + enemy.x) / 10) * 2 : 0;
  const tilt = enemy.type === 'watcher' ? Math.sin((state.time + enemy.x) / 22) * 0.05 : enemy.dir * 0.06;
  const scaleY = enemy.type === 'crawler' ? 1 + Math.sin((state.time + enemy.x) / 16) * 0.03 : 1;
  if (drawSceneAssetTransformed(enemyAssetKey, enemy.x - enemy.w * 0.72, enemy.y - enemy.h * 0.78 + hoverBob, enemy.w * 2.2, enemy.h * 2.2, { rotation: tilt, scaleY, flipX: enemy.dir < 0 })) {
    glow(enemy.x + enemy.w / 2, enemy.y + 14, 26, enemy.type === 'watcher' ? 'rgba(243, 201, 119, 0.34)' : 'rgba(169, 138, 209, 0.28)');
    return;
  }
  const x = enemy.x - camera.x;
  glow(enemy.x + enemy.w / 2, enemy.y + 14, 26, enemy.type === 'watcher' ? 'rgba(243, 201, 119, 0.34)' : 'rgba(169, 138, 209, 0.28)');
  ctx.fillStyle = enemy.type === 'watcher' ? PALETTE.surfaceStrong : PALETTE.stone;
  ctx.beginPath();
  ctx.ellipse(x + enemy.w / 2, enemy.y + 18, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.type === 'watcher' ? PALETTE.wood : PALETTE.moonViolet;
  ctx.beginPath();
  ctx.moveTo(x + 8, enemy.y + 14);
  ctx.lineTo(x + enemy.w / 2, enemy.y + enemy.h);
  ctx.lineTo(x + enemy.w - 8, enemy.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(x + enemy.w * 0.34, enemy.y + 12, 4, 4);
  ctx.fillRect(x + enemy.w * 0.54, enemy.y + 12, 4, 4);
}

function drawBoss() {
  const boss = level.boss;
  if ((!boss.active && !boss.defeated) || boss.hp <= 0) return;
  const pulse = 1 + Math.sin(state.time / 14) * 0.025;
  const rotation = Math.sin(state.time / 20) * 0.03 + (boss.dash > 0 ? boss.vx * 0.015 : 0);
  const bossAssetKey = boss.phase === 2 || Math.floor(state.time / 12) % 2 === 0 ? 'bossSentinelAlt' : 'bossSentinel';
  if (drawSceneAssetTransformed(bossAssetKey, boss.x - 44, boss.y - 36, 172, 172, { rotation, scaleX: pulse, scaleY: pulse })) {
    glow(boss.x + boss.w / 2, boss.y + boss.h / 2, 82, boss.phase === 2 ? 'rgba(243, 201, 119, 0.42)' : 'rgba(141, 217, 208, 0.28)');
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillRect(24, 24, 220, 10);
    ctx.fillStyle = PALETTE.woodDeep;
    ctx.fillRect(24 + (boss.hp / boss.maxHp) * 220, 24, 220 - (boss.hp / boss.maxHp) * 220, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(24, 24, 220, 10);
    return;
  }
  const x = boss.x - camera.x;
  glow(boss.x + boss.w / 2, boss.y + boss.h / 2, 82, boss.phase === 2 ? 'rgba(243, 201, 119, 0.42)' : 'rgba(141, 217, 208, 0.28)');
  ctx.fillStyle = PALETTE.surface;
  ctx.beginPath();
  ctx.ellipse(x + boss.w / 2, boss.y + 38, 28, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = boss.phase === 2 ? PALETTE.lantern : PALETTE.crystal;
  ctx.beginPath();
  ctx.arc(x + boss.w / 2, boss.y + 32, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(x + 28, boss.y + 26, 5, 5);
  ctx.fillRect(x + 51, boss.y + 26, 5, 5);
  ctx.strokeStyle = PALETTE.woodDeep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 20, boss.y + 62);
  ctx.quadraticCurveTo(x + boss.w / 2, boss.y + 86, x + boss.w - 20, boss.y + 62);
  ctx.stroke();
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillRect(24, 24, 220, 10);
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.fillRect(24 + (boss.hp / boss.maxHp) * 220, 24, 220 - (boss.hp / boss.maxHp) * 220, 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeRect(24, 24, 220, 10);
}

function drawShrine() {
  if (drawSceneAsset('shrineGate', level.shrine.x - 44, level.shrine.y - 10, 198, 186, 1, 0.98)) {
    drawLanternPost(level.shrine.x - 34, level.shrine.y + level.shrine.h + 20, 0.72);
    drawLanternPost(level.shrine.x + level.shrine.w + 18, level.shrine.y + level.shrine.h + 20, 0.72);
    return;
  }
  const x = level.shrine.x - camera.x;
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(x, level.shrine.y + 24, level.shrine.w, level.shrine.h);
  ctx.fillStyle = PALETTE.woodDeep;
  ctx.beginPath();
  ctx.moveTo(x - 8, level.shrine.y + 40);
  ctx.lineTo(x + level.shrine.w / 2, level.shrine.y - 6);
  ctx.lineTo(x + level.shrine.w + 8, level.shrine.y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = level.boss.defeated ? PALETTE.lantern : (state.gateOpen ? PALETTE.crystal : PALETTE.forest);
  ctx.fillRect(x + 18, level.shrine.y + 40, level.shrine.w - 36, level.shrine.h - 26);
  drawLanternPost(level.shrine.x - 34, level.shrine.y + level.shrine.h + 20, 0.72);
  drawLanternPost(level.shrine.x + level.shrine.w + 18, level.shrine.y + level.shrine.h + 20, 0.72);
}

function drawShots(collection) {
  collection.forEach(shot => {
    const x = shot.x - camera.x;
    const color = shot.color ?? PALETTE.lantern;
    const outer = shot.color ? `${shot.color}cc` : 'rgba(243, 201, 119, 0.84)';
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
    ctx.strokeStyle = PALETTE.cloud;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 9, shot.y);
    ctx.lineTo(x - 2, shot.y - 2);
    ctx.stroke();
  });
}

function drawPlayer() {
  const airborne = !player.onGround;
  const tilt = Math.max(-0.25, Math.min(0.28, player.vx * 0.05 + player.vy * 0.012));
  const bob = airborne ? Math.sin(state.time / 8) * 1.5 : Math.sin((state.time + player.x) / 14) * 0.8;
  const squashY = player.dashing > 0 ? 0.88 : (airborne ? 1.04 : 1);
  const squashX = player.dashing > 0 ? 1.14 : 1;
  const playerAssetKey = airborne || Math.abs(player.vx) > 1.4 || player.dashing > 0 || Math.floor((state.time + player.x) / 10) % 2 === 0 ? 'playerWispAlt' : 'playerWisp';
  if (drawSceneAssetTransformed(playerAssetKey, player.x - 18, player.y - 18 + bob, 76, 76, { alpha: player.invuln > 0 && Math.floor(player.invuln / 5) % 2 === 0 ? 0.45 : 1, rotation: tilt, scaleX: squashX, scaleY: squashY, flipX: player.facing < 0 })) {
    glow(player.x + 14, player.y + 12, 34, 'rgba(248, 244, 222, 0.76)');
    return;
  }
  const x = player.x - camera.x;
  const y = player.y;
  const alpha = player.invuln > 0 && Math.floor(player.invuln / 5) % 2 === 0 ? 0.45 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x + 14, y + 12, 6, x + 14, y + 12, 34);
  g.addColorStop(0, 'rgba(248, 244, 222, 0.76)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x + 14, y + 12, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.surface;
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 18, 10, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 7, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.crystal;
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
    if (p.type === 'streak') {
      ctx.beginPath();
      ctx.ellipse(x, p.y, p.size * 1.8, p.size * 0.6, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function drawForeground() {
  if (drawRepeatingAsset('bgForegroundRoots', 310, 1600, 230, 0.32, 0.94)) {
    drawFireflyField(0.28);
    drawForegroundCanopy();
    return;
  }
  ctx.fillStyle = PALETTE.forestDeep;
  ctx.fillRect(0, 505, canvas.width, 35);
  for (let i = 0; i < canvas.width; i += 54) {
    ctx.fillStyle = 'rgba(53, 90, 71, 0.88)';
    ctx.beginPath();
    ctx.moveTo(i, canvas.height);
    ctx.quadraticCurveTo(i + 10, 470, i + 22, canvas.height);
    ctx.fill();
  }
  drawForegroundCanopy();
  drawFireflyField(0.28);
}

function drawHint() {
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '600 18px Outfit';
  let text = 'Collect 6 wisps to awaken the shrine';
  if (state.phase === 'boss') text = 'Break the Shrine Sentinel core';
  if (level.boss.defeated) text = 'Climb to the shrine and end the run';
  ctx.fillText(text, 28, 510);
}

function drawAtmosphereOverlay() {
  const mist = ctx.createLinearGradient(0, 120, 0, canvas.height);
  mist.addColorStop(0, 'rgba(248, 244, 222, 0)');
  mist.addColorStop(0.45, 'rgba(248, 244, 222, 0.08)');
  mist.addColorStop(1, 'rgba(92, 81, 71, 0.08)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vignette = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.35, 120, canvas.width * 0.5, canvas.height * 0.55, canvas.width * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(53, 90, 71, 0.10)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
  bg();
  cameraBegin();
  glow(330, 320, 150, 'rgba(141, 217, 208, 0.18)');
  glow(1360, 290, 180, 'rgba(243, 201, 119, 0.16)');
  glow(2450, 260, 180, 'rgba(141, 217, 208, 0.16)');
  glow(3410, 240, 210, 'rgba(124, 200, 242, 0.16)');
  glow(3970, 210, 240, level.boss.active ? 'rgba(243, 201, 119, 0.20)' : 'rgba(141, 217, 208, 0.12)');
  drawWorldProps();
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
  drawAtmosphereOverlay();
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

primeSceneAssets();
resetRun(true);
loop();
