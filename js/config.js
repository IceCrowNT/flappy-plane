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
  sky0: '#f8d8a5',
  sky1: '#f2b37c',
  sky2: '#87a7bf',
  sky3: '#4d6987',
  sun: '#fff1bf',
  haze: '#fff7e5',
  hill0: '#93ab74',
  hill1: '#759060',
  hill2: '#587151',
  ground0: '#617b51',
  ground1: '#41563a',
  groundLine: '#f8e6b066',
  pipe0: '#6c8f58',
  pipe1: '#88ab71',
  pipe2: '#4d6742',
  pipeCap: '#a5bc86',
  accent: '#c78357',
  gold: '#ffe7a2',
  teal: '#6da0a5',
  cloud: '#fffaf0',
};
