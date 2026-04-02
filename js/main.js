// ============================
//  FLAPPY PLANE - Main Game
// ============================

import { CONFIG, COLORS, PLAYER_THEMES } from './config.js';
import { Plane } from './plane.js';
import { PipeManager } from './pipes.js';
import { Background } from './background.js';
import { ParticleSystem } from './particles.js';
import { Overlay } from './overlay.js';
import { AudioManager } from './audio.js';

// ---- DOM ----
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEls = {
  p1: document.getElementById('scoreValP1'),
  p2: document.getElementById('scoreValP2'),
};
const scoreCards = {
  p1: document.getElementById('scoreP1'),
  p2: document.getElementById('scoreP2'),
};
const gameOverUi = document.getElementById('gameOverUi');
const btnRestart = document.getElementById('btnRestart');
const btnAudio = document.getElementById('btnAudio');

// ---- STATE ----
let state = 'idle';   // 'idle' | 'playing' | 'dead'
let frame = 0;

// ---- SYSTEMS ----
const bg = new Background();
const pipes = new PipeManager();
const particles = new ParticleSystem();
const overlay = new Overlay();
const audio = new AudioManager();
const players = [
  {
    id: 'p1',
    label: 'P1',
    controls: ['KeyW'],
    score: 0,
    bestScore: 0,
    alive: true,
    plane: new Plane({
      x: 90,
      stripeColor: PLAYER_THEMES.p1.stripe,
      wingColor: PLAYER_THEMES.p1.stripeSoft,
      wingInnerColor: COLORS.planeBody,
      tailColor: PLAYER_THEMES.p1.tail,
      stabilizerColor: COLORS.houseRoof,
      trailColor: PLAYER_THEMES.p1.trail,
    }),
  },
  {
    id: 'p2',
    label: 'P2',
    controls: ['ArrowUp'],
    score: 0,
    bestScore: 0,
    alive: true,
    plane: new Plane({
      x: 150,
      stripeColor: PLAYER_THEMES.p2.stripe,
      wingColor: PLAYER_THEMES.p2.stripeSoft,
      wingInnerColor: COLORS.planeBody,
      tailColor: PLAYER_THEMES.p2.tail,
      stabilizerColor: COLORS.crystal,
      trailColor: PLAYER_THEMES.p2.trail,
    }),
  },
];

// ---- HELPERS ----
function setPlayerScore(player, nextScore) {
  player.score = nextScore;
  scoreEls[player.id].textContent = nextScore;
  scoreCards[player.id].classList.remove('bump');
  void scoreCards[player.id].offsetWidth; // reflow
  scoreCards[player.id].classList.add('bump');
  setTimeout(() => scoreCards[player.id].classList.remove('bump'), 150);
}

function syncAudioButton() {
  const muted = audio.isMuted();
  btnAudio.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
  btnAudio.classList.toggle('is-muted', muted);
}

function resetPlayers() {
  players.forEach(player => {
    player.alive = true;
    player.plane.reset();
    setPlayerScore(player, 0);
  });
}

function livingPlayers() {
  return players.filter(player => player.alive);
}

function flapPlayers(targetPlayers) {
  targetPlayers.forEach(player => {
    if (!player.alive) return;
    player.plane.flap();
    particles.spawnFlap(player.plane.x + 10, player.plane.y + player.plane.h / 2);
    audio.playFlap(player.id);
  });
}

function startGame() {
  audio.unlock();
  gameOverUi.style.display = 'none';
  pipes.reset();
  particles.clear();
  resetPlayers();
  state = 'playing';
  audio.setMode('playing');
  audio.restoreBgm();
  audio.playStart();
  flapPlayers(players);
}

function handleSharedInput() {
  if (state === 'idle' || state === 'dead') startGame();
}

// ---- INPUT ----
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleSharedInput();
    return;
  }

  const player = players.find(entry => entry.controls.includes(e.code));
  if (!player) return;

  e.preventDefault();

  if (state === 'idle') {
    startGame();
    return;
  }

  if (state !== 'playing' || !player.alive) return;
  flapPlayers([player]);
});

btnRestart.addEventListener('click', e => {
  e.stopPropagation();
  startGame();
});

btnAudio.addEventListener('click', async e => {
  e.stopPropagation();
  await audio.unlock();
  audio.toggleMute();
  syncAudioButton();
});

canvas.addEventListener('click', handleSharedInput);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  handleSharedInput();
}, { passive: false });

document.addEventListener('pointerdown', () => {
  audio.unlock();
}, { once: true });

// ---- COLLISION (ground / ceiling) ----
function checkBounds(hb) {
  return hb.y + hb.h >= CONFIG.HEIGHT - CONFIG.GROUND_H || hb.y < 0;
}

// ---- GAME LOOP ----
function loop() {
  frame++;

  // Update
  bg.update(state === 'playing');
  particles.update();
  players.forEach(player => {
    player.plane.update(frame, state === 'playing' && player.alive);
  });

  if (state === 'playing') {
    pipes.update();

    const scoreMap = pipes.checkScoring(players);
    players.forEach(player => {
      const earned = scoreMap[player.id];
      if (earned > 0) {
        const nextScore = player.score + earned;
        if (nextScore > player.bestScore) player.bestScore = nextScore;
        setPlayerScore(player, nextScore);
        particles.spawnScore(player.plane.x + player.plane.w, player.plane.y + player.plane.h / 2);
        audio.playScore(player.id);
      }

      if (!player.alive) return;
      const hb = player.plane.hitbox();
      if (checkBounds(hb) || pipes.checkCollision(hb)) {
        player.alive = false;
        particles.spawnExplosion(player.plane.x + player.plane.w / 2, player.plane.y + player.plane.h / 2);
        audio.playCrash(player.id);
      }
    });

    if (livingPlayers().length === 0) {
      state = 'dead';
      gameOverUi.style.display = 'flex';
      audio.setMode('dead');
    }
  }

  // Draw
  bg.draw(ctx);
  pipes.draw(ctx);
  particles.draw(ctx);
  players.forEach(player => player.plane.draw(ctx, frame));

  if (state === 'idle') overlay.drawIdle(ctx, frame, players);
  if (state === 'dead') overlay.drawDead(ctx, players);

  requestAnimationFrame(loop);
}

syncAudioButton();
loop();
