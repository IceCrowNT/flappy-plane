// ============================
//  FLAPPY PLANE — Config
// ============================

export const CONFIG = {
  // Canvas
  WIDTH: 400,
  HEIGHT: 550,

  // Physics
  GRAVITY: 0.45,
  FLAP_POWER: -7.5,
  MAX_FALL_SPEED: 10,

  // Pipes
  PIPE_WIDTH: 58,
  PIPE_GAP: 160,
  PIPE_SPEED: 2.6,
  PIPE_INTERVAL: 90,         // frames between spawns

  // Plane
  PLANE_X: 90,
  PLANE_W: 52,
  PLANE_H: 34,
  TRAIL_LENGTH: 12,

  // Background
  STAR_COUNT: 60,
  CLOUD_COUNT: 5,
  GROUND_H: 60,

  // Particles
  FLAP_PARTICLES: 5,
  EXPLOSION_PARTICLES: 30,
};

export const COLORS = {
  sky0: '#0f0428',
  sky1: '#1a0a3a',
  sky2: '#0d1b2a',
  ground0: '#1a3a2a',
  ground1: '#0a1a10',
  groundLine: '#2cb67d44',
  pipe0: '#2cb67d',
  pipe1: '#3de8a0',
  pipe2: '#1a8a5a',
  accent: '#7f5af0',
  gold: '#ffe066',
  teal: '#2cb67d',
  cloud: '#aaeeff',
};
