const STORAGE_KEY = 'flappy-plane-audio-muted';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.bgmAudio = null;
    this.bgmLoaded = false;
    this.fallbackMusicTimer = null;
    this.fallbackStep = 0;
    this.unlocked = false;
    this.muted = localStorage.getItem(STORAGE_KEY) === '1';
    this.currentMode = 'idle';

    this._initBgmElement();
  }

  _initBgmElement() {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = 1;

    ['assets/audio/sky-journey.ogg', 'assets/audio/sky-journey.mp3', 'assets/audio/sky-journey.wav']
      .forEach(src => {
        const sourceEl = document.createElement('source');
        sourceEl.src = src;
        audio.appendChild(sourceEl);
      });

    audio.addEventListener('canplaythrough', () => {
      this.bgmLoaded = true;
      if (this.currentMode === 'playing' && !this.muted) this.startBgm();
    });

    audio.addEventListener('error', () => {
      this.bgmLoaded = false;
    });

    audio.load();
    this.bgmAudio = audio;
  }

  _ensureContext() {
    if (this.ctx) return this.ctx;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.effectsGain = this.ctx.createGain();

    this.masterGain.gain.value = this.muted ? 0 : 0.9;
    this.musicGain.gain.value = 0.34;
    this.effectsGain.gain.value = 0.72;

    this.musicGain.connect(this.masterGain);
    this.effectsGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    if (this.bgmAudio) {
      const source = this.ctx.createMediaElementSource(this.bgmAudio);
      source.connect(this.musicGain);
    }

    return this.ctx;
  }

  async unlock() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    this.unlocked = true;
    this._applyMute();
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0');
    this._applyMute();
    return this.muted;
  }

  _applyMute() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }

    if (this.muted) {
      if (this.bgmAudio && !this.bgmAudio.paused) this.bgmAudio.pause();
      this._stopFallbackBgm();
      return;
    }

    if (this.currentMode === 'playing') this.startBgm();
  }

  setMode(mode) {
    this.currentMode = mode;

    if (mode === 'playing') {
      this.restoreBgm();
      this.startBgm();
      return;
    }

    if (mode === 'dead') {
      this.duckBgm();
      return;
    }

    this.stopBgm();
  }

  async startBgm() {
    if (this.muted) return;
    await this.unlock();

    if (this.bgmLoaded && this.bgmAudio) {
      try {
        this.bgmAudio.currentTime = clamp(this.bgmAudio.currentTime, 0, this.bgmAudio.duration || 0);
        await this.bgmAudio.play();
        return;
      } catch {
        this.bgmLoaded = false;
      }
    }

    this._startFallbackBgm();
  }

  stopBgm() {
    if (this.bgmAudio && !this.bgmAudio.paused) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
    this._stopFallbackBgm();
  }

  duckBgm() {
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.14, this.ctx.currentTime, 0.08);
    }
    if (this.bgmAudio && !this.bgmAudio.paused) this.bgmAudio.playbackRate = 0.97;
  }

  restoreBgm() {
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.34, this.ctx.currentTime, 0.08);
    }
    if (this.bgmAudio) this.bgmAudio.playbackRate = 1;
  }

  playStart() {
    this._playToneStack([
      { freq: 392, duration: 0.15, type: 'triangle', volume: 0.16 },
      { freq: 523.25, duration: 0.2, type: 'sine', volume: 0.12, delay: 0.04 },
    ]);
  }

  playFlap(playerId) {
    const base = playerId === 'p1' ? 480 : 620;
    this._playToneStack([
      { freq: base, duration: 0.05, type: 'triangle', volume: 0.11 },
      { freq: base * 0.6, duration: 0.09, type: 'sine', volume: 0.05, delay: 0.01 },
    ]);
  }

  playScore(playerId) {
    const base = playerId === 'p1' ? 660 : 820;
    this._playToneStack([
      { freq: base, duration: 0.11, type: 'triangle', volume: 0.14 },
      { freq: base * 1.25, duration: 0.14, type: 'sine', volume: 0.09, delay: 0.05 },
    ]);
  }

  playCrash(playerId) {
    const base = playerId === 'p1' ? 180 : 150;
    this._playToneStack([
      { freq: base, duration: 0.22, type: 'sawtooth', volume: 0.12 },
      { freq: base * 0.7, duration: 0.3, type: 'triangle', volume: 0.08, delay: 0.02 },
    ]);
  }

  _playToneStack(parts) {
    const ctx = this._ensureContext();
    if (!ctx || !this.unlocked || this.muted) return;

    parts.forEach(part => {
      const start = ctx.currentTime + (part.delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = part.type || 'sine';
      osc.frequency.setValueAtTime(part.freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(part.volume || 0.1, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + part.duration);
      osc.connect(gain);
      gain.connect(this.effectsGain);
      osc.start(start);
      osc.stop(start + part.duration + 0.02);
    });
  }

  _startFallbackBgm() {
    const ctx = this._ensureContext();
    if (!ctx || this.fallbackMusicTimer || this.muted) return;

    const melody = [261.63, 329.63, 392.0, 329.63, 440.0, 392.0, 329.63, 293.66];
    const bass = [130.81, 146.83, 174.61, 146.83];

    const playStep = () => {
      const step = this.fallbackStep;
      this._playMusicNote(melody[step % melody.length], 0.34, 0.12, 'triangle');
      this._playMusicNote(bass[step % bass.length], 0.55, 0.07, 'sine');
      this.fallbackStep++;
    };

    playStep();
    this.fallbackMusicTimer = window.setInterval(playStep, 360);
  }

  _stopFallbackBgm() {
    if (this.fallbackMusicTimer) {
      window.clearInterval(this.fallbackMusicTimer);
      this.fallbackMusicTimer = null;
    }
  }

  _playMusicNote(freq, duration, volume, type) {
    const ctx = this._ensureContext();
    if (!ctx || !this.unlocked || this.muted) return;

    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(start);
    osc.stop(start + duration + 0.04);
  }
}
