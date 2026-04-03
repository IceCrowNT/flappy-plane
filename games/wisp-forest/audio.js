const STORAGE_KEY_WF = 'wisp-forest-audio-muted';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmHighpass = null;
    this.bgmFilter = null;
    this.bgmCompressor = null;
    this.unlocked = false;
    this.muted = localStorage.getItem(STORAGE_KEY_WF) === '1';

    this._bgmNodes = [];
    this._bgmRunning = false;
    this._bgmWanted = false;
    this._bgmBossMode = false;
    this._bgmTimer = null;
    this._shimmerTimer = null;
    this._bossLayer = null;
  }

  _ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;

    this.ctx = new AudioCtor();
    this.masterGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.bgmHighpass = this.ctx.createBiquadFilter();
    this.bgmFilter = this.ctx.createBiquadFilter();
    this.bgmCompressor = this.ctx.createDynamicsCompressor();

    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.sfxGain.gain.value = 0.76;
    this.bgmGain.gain.value = 0.17;
    this.bgmHighpass.type = 'highpass';
    this.bgmHighpass.frequency.value = 170;
    this.bgmHighpass.Q.value = 0.3;
    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.value = 2100;
    this.bgmFilter.Q.value = 0.2;
    this.bgmCompressor.threshold.value = -22;
    this.bgmCompressor.knee.value = 18;
    this.bgmCompressor.ratio.value = 2.5;
    this.bgmCompressor.attack.value = 0.03;
    this.bgmCompressor.release.value = 0.28;

    this.sfxGain.connect(this.masterGain);
    this.bgmGain.connect(this.bgmHighpass);
    this.bgmHighpass.connect(this.bgmFilter);
    this.bgmFilter.connect(this.bgmCompressor);
    this.bgmCompressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    return this.ctx;
  }

  async unlock() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    this.unlocked = true;
    this._applyMute();
    if (this._bgmWanted && !this.muted && !this._bgmRunning) this._startBgmInternal();
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(STORAGE_KEY_WF, this.muted ? '1' : '0');
    this._applyMute();
    if (!this.muted && this.unlocked && this._bgmWanted && !this._bgmRunning) this._startBgmInternal();
    return this.muted;
  }

  _applyMute() {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.04);
  }

  _playToneStack(parts) {
    const ctx = this._ensureContext();
    if (!ctx || !this.unlocked || this.muted) return;

    parts.forEach(part => {
      const t0 = ctx.currentTime + (part.delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = part.type || 'sine';
      osc.frequency.setValueAtTime(part.freq, t0);
      if (part.freqEnd) osc.frequency.exponentialRampToValueAtTime(part.freqEnd, t0 + part.duration);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(part.volume || 0.1, t0 + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + part.duration + 0.015);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t0);
      osc.stop(t0 + part.duration + 0.03);
    });
  }

  _playNoise(duration, volume, filterFreq = 800, filterType = 'bandpass') {
    const ctx = this._ensureContext();
    if (!ctx || !this.unlocked || this.muted) return;

    const bufferLength = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;

    for (let i = 0; i < bufferLength; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }

    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    src.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start();
    src.stop(ctx.currentTime + duration);
  }

  playJump() {
    this._playToneStack([
      { freq: 280, freqEnd: 520, duration: 0.14, type: 'sine', volume: 0.14 },
      { freq: 560, freqEnd: 840, duration: 0.1, type: 'triangle', volume: 0.07, delay: 0.01 },
    ]);
  }

  playDoubleJump() {
    this._playToneStack([
      { freq: 520, freqEnd: 760, duration: 0.12, type: 'sine', volume: 0.13 },
      { freq: 780, freqEnd: 980, duration: 0.1, type: 'triangle', volume: 0.09, delay: 0.05 },
      { freq: 1040, duration: 0.07, type: 'sine', volume: 0.05, delay: 0.09 },
    ]);
  }

  playWallJump() {
    this._playToneStack([
      { freq: 600, freqEnd: 380, duration: 0.07, type: 'triangle', volume: 0.13 },
      { freq: 380, freqEnd: 640, duration: 0.12, type: 'sine', volume: 0.1, delay: 0.06 },
    ]);
  }

  playDash() {
    this._playNoise(0.18, 0.55, 900, 'highpass');
    this._playToneStack([
      { freq: 180, freqEnd: 80, duration: 0.14, type: 'sine', volume: 0.12 },
    ]);
  }

  playShoot() {
    this._playToneStack([
      { freq: 1200, freqEnd: 600, duration: 0.08, type: 'triangle', volume: 0.1 },
      { freq: 600, freqEnd: 300, duration: 0.06, type: 'sine', volume: 0.05, delay: 0.04 },
    ]);
  }

  playHit() {
    this._playNoise(0.12, 0.45, 400, 'lowpass');
    this._playToneStack([
      { freq: 140, freqEnd: 60, duration: 0.2, type: 'sawtooth', volume: 0.11 },
    ]);
  }

  playDie() {
    [440, 370, 310, 220, 150].forEach((freq, index) => {
      this._playToneStack([
        { freq, duration: 0.18, type: 'sine', volume: 0.1, delay: index * 0.09 },
      ]);
    });
  }

  playWispCollect() {
    this._playToneStack([
      { freq: 1318.5, duration: 0.3, type: 'sine', volume: 0.14 },
      { freq: 1760, duration: 0.22, type: 'triangle', volume: 0.07, delay: 0.02 },
      { freq: 2093, duration: 0.16, type: 'sine', volume: 0.04, delay: 0.05 },
    ]);
  }

  playWispAllCollected() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this._playToneStack([
        { freq, duration: 0.22, type: 'triangle', volume: 0.13, delay: index * 0.11 },
        { freq: freq * 1.5, duration: 0.16, type: 'sine', volume: 0.06, delay: index * 0.11 + 0.02 },
      ]);
    });
  }

  playCheckpoint() {
    this._playToneStack([
      { freq: 392, duration: 0.2, type: 'sine', volume: 0.12 },
      { freq: 523.25, duration: 0.2, type: 'sine', volume: 0.11, delay: 0.1 },
      { freq: 659.25, duration: 0.28, type: 'triangle', volume: 0.1, delay: 0.2 },
    ]);
  }

  playEnemyHit() {
    this._playToneStack([
      { freq: 320, freqEnd: 180, duration: 0.1, type: 'sawtooth', volume: 0.09 },
    ]);
    this._playNoise(0.07, 0.28, 600, 'bandpass');
  }

  playEnemyDie() {
    this._playNoise(0.1, 0.32, 800, 'bandpass');
    this._playToneStack([
      { freq: 880, freqEnd: 1320, duration: 0.12, type: 'triangle', volume: 0.1 },
      { freq: 1320, freqEnd: 1760, duration: 0.1, type: 'sine', volume: 0.06, delay: 0.06 },
    ]);
  }

  playBossAwaken() {
    this._playNoise(0.5, 0.7, 80, 'lowpass');
    this._playToneStack([
      { freq: 55, duration: 0.8, type: 'sawtooth', volume: 0.16 },
      { freq: 82, duration: 0.6, type: 'sine', volume: 0.12, delay: 0.1 },
      { freq: 110, freqEnd: 55, duration: 0.5, type: 'square', volume: 0.08, delay: 0.2 },
    ]);
  }

  playBossHit() {
    this._playNoise(0.14, 0.5, 200, 'lowpass');
    this._playToneStack([
      { freq: 200, freqEnd: 90, duration: 0.18, type: 'sawtooth', volume: 0.14 },
    ]);
  }

  playBossDefeated() {
    [
      [330, 0], [415, 0.09], [523, 0.18], [659, 0.27],
      [830, 0.38], [1046, 0.5], [1318, 0.62], [1760, 0.76],
    ].forEach(([freq, delay]) => {
      this._playToneStack([
        { freq, duration: 0.4, type: 'sine', volume: 0.12, delay },
        { freq: freq * 1.5, duration: 0.28, type: 'triangle', volume: 0.05, delay: delay + 0.02 },
      ]);
    });
    this._playNoise(0.6, 0.3, 2000, 'highpass');
  }

  playWin() {
    [
      [523.25, 0, 0.22], [659.25, 0.14, 0.22], [783.99, 0.28, 0.22],
      [1046.5, 0.44, 0.36], [880, 0.6, 0.18], [1046.5, 0.74, 0.18],
      [1318.5, 0.88, 0.4], [1568, 1.1, 0.6],
    ].forEach(([freq, delay, duration]) => {
      this._playToneStack([
        { freq, duration, type: 'triangle', volume: 0.14, delay },
        { freq: freq * 0.5, duration: duration * 0.8, type: 'sine', volume: 0.06, delay },
      ]);
    });
  }

  startBgm() {
    this._bgmWanted = true;
    if (this._bgmRunning || this.muted) return;
    this._startBgmInternal();
  }

  _startBgmInternal() {
    const ctx = this._ensureContext();
    if (!ctx || !this.unlocked || this.muted || this._bgmRunning) return;

    this._bgmRunning = true;
    this._bgmNodes = [];
    this._clearTimers();
    this._createPadNode(293.66, 'sine', 0.014, -4);
    this._createPadNode(440, 'sine', 0.01, 3);
    this._setBossLayer(false);
    this._scheduleForestPhrase();
    this._scheduleShimmerNotes();
  }

  _createPadNode(freq, type, volume, detune = 0) {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.value = this._bgmBossMode ? 1300 : 1700;
    filter.Q.value = 0.6;
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 3.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start();
    this._bgmNodes.push({ osc, gain, filter, baseVolume: volume });
  }

  _scheduleForestPhrase() {
    if (!this._bgmRunning || this.muted) return;

    const phrases = this._bgmBossMode
      ? [
          { root: 164.81, notes: [220, 246.94, 329.63, 392], step: 0.4, volume: 0.031 },
          { root: 174.61, notes: [220, 261.63, 349.23, 440], step: 0.38, volume: 0.032 },
        ]
      : [
          { root: 220, notes: [293.66, 329.63, 440, 493.88], step: 0.68, volume: 0.024 },
          { root: 196, notes: [293.66, 329.63, 392, 440], step: 0.64, volume: 0.022 },
          { root: 246.94, notes: [329.63, 392, 493.88, 587.33], step: 0.7, volume: 0.023 },
        ];

    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    phrase.notes.forEach((freq, index) => {
      this._playBgmBell(freq, 0.92, phrase.volume + index * 0.0035, index * phrase.step, 'sine');
    });
    this._playBgmBell(phrase.root, 1.8, this._bgmBossMode ? 0.011 : 0.008, 0.08, 'sine');

    const delay = this._bgmBossMode ? 1600 + Math.random() * 500 : 2600 + Math.random() * 1100;
    this._bgmTimer = setTimeout(() => this._scheduleForestPhrase(), delay);
  }

  _scheduleShimmerNotes() {
    if (!this._bgmRunning || this.muted) return;

    const scale = this._bgmBossMode
      ? [329.63, 369.99, 440, 493.88, 554.37]
      : [329.63, 369.99, 415.3, 493.88, 554.37, 659.25, 739.99, 880];
    const freq = scale[Math.floor(Math.random() * scale.length)];
    const volume = this._bgmBossMode ? 0.016 : 0.012;
    this._playBgmBell(freq, 1.7, volume, 0, 'sine');

    const delay = this._bgmBossMode ? 850 + Math.random() * 650 : 1800 + Math.random() * 1800;
    this._shimmerTimer = setTimeout(() => this._scheduleShimmerNotes(), delay);
  }

  _playBgmBell(freq, duration, volume, delay = 0, type = 'sine') {
    const ctx = this._ensureContext();
    if (!ctx || !this.unlocked || this.muted) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.45), start + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + 0.08);
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(1900, Math.max(700, freq * 1.6));
    filter.Q.value = 0.18;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(start);
    osc.stop(start + duration + 0.08);
  }

  _setBossLayer(active) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGain) return;

    if (active) {
      if (this._bossLayer) return;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 98;
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      gain.gain.value = 0.0001;
      gain.gain.setTargetAtTime(0.008, ctx.currentTime, 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      this._bossLayer = { osc, gain, filter };
      return;
    }

    if (!this._bossLayer) return;
    this._bossLayer.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
    try {
      this._bossLayer.osc.stop(ctx.currentTime + 1.1);
    } catch (_) {
    }
    this._bossLayer = null;
  }

  stopBgm() {
    this._bgmWanted = false;
    this._bgmRunning = false;
    this._clearTimers();

    const ctx = this.ctx;
    if (!ctx) return;

    this._bgmNodes.forEach(({ osc, gain }) => {
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
      try {
        osc.stop(ctx.currentTime + 1.1);
      } catch (_) {
      }
    });
    this._bgmNodes = [];
    this._setBossLayer(false);
  }

  setBossMode(active) {
    if (this._bgmBossMode === active) return;
    this._bgmBossMode = active;

    if (!this.ctx || !this.bgmGain) return;

    const target = active ? 0.19 : 0.17;
    this.bgmGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.45);
    this._bgmNodes.forEach(node => {
      if (!node.filter || !node.gain) return;
      node.filter.frequency.setTargetAtTime(active ? 1200 : 1700, this.ctx.currentTime, 0.6);
      node.gain.gain.setTargetAtTime(active ? node.baseVolume * 0.75 : node.baseVolume, this.ctx.currentTime, 0.8);
    });
    this._setBossLayer(active);
  }

  pauseBgm() {
    if (!this.ctx || !this.bgmGain) return;
    this.bgmGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.12);
  }

  resumeBgm() {
    if (!this.ctx || !this.bgmGain) return;
    const target = this._bgmBossMode ? 0.19 : 0.17;
    this.bgmGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.16);
  }

  _clearTimers() {
    clearTimeout(this._bgmTimer);
    clearTimeout(this._shimmerTimer);
    this._bgmTimer = null;
    this._shimmerTimer = null;
  }
}

export const audio = new AudioEngine();
