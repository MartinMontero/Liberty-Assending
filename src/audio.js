// Procedural WebAudio — ambience beds per zone + UI/torch sfx. No audio files.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bed = null;          // current ambience nodes
    this.muted = false;
    this.enabled = false;
  }

  init() {
    if (this.ctx || typeof AudioContext === 'undefined') return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.enabled = true;
    } catch { /* audio unavailable — play silent */ }
  }

  toggleMute() {
    if (!this.ctx) return true;
    this.muted = !this.muted;
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime + 0.2);
    return this.muted;
  }

  _noiseBuffer(seconds = 2) {
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;        // brownish
      d[i] = last * 3.2;
    }
    return buf;
  }

  // ---- ambience beds -------------------------------------------------
  setZoneAmbience(spec) {
    if (!this.ctx) return;
    if (this.bed) {
      const old = this.bed;
      old.gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      setTimeout(() => old.stop(), 1500);
      this.bed = null;
    }
    if (!spec) return;

    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(this.master);
    gain.gain.linearRampToValueAtTime(spec.level ?? 0.5, ctx.currentTime + 2);

    const stops = [];

    // filtered noise floor
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(3);
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = spec.noiseHz ?? 400;
    const ng = ctx.createGain();
    ng.gain.value = spec.noise ?? 0.4;
    noise.connect(nf).connect(ng).connect(gain);
    noise.start();
    stops.push(() => noise.stop());

    // drone chord
    for (const [freq, lvl, type] of spec.drones ?? []) {
      const o = ctx.createOscillator();
      o.type = type || 'sine';
      o.frequency.value = freq;
      const og = ctx.createGain();
      og.gain.value = lvl;
      // slow shimmer
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.1;
      const lg = ctx.createGain();
      lg.gain.value = lvl * 0.5;
      lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(gain);
      o.start(); lfo.start();
      stops.push(() => { o.stop(); lfo.stop(); });
    }

    // sparse random blips (chirps / clanks / birds)
    let blipTimer = null;
    if (spec.blip) {
      const fire = () => {
        if (!this.bed || this.bed.gain !== gain) return;
        this._blip(gain, spec.blip);
        blipTimer = setTimeout(fire, (spec.blip.every ?? 4) * 1000 * (0.4 + Math.random() * 1.2));
      };
      blipTimer = setTimeout(fire, 1200);
    }

    this.bed = {
      gain,
      stop: () => { stops.forEach(f => { try { f(); } catch { } }); clearTimeout(blipTimer); gain.disconnect(); },
    };
  }

  _blip(out, b) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = b.type || 'sine';
    const f0 = b.freq[0] + Math.random() * (b.freq[1] - b.freq[0]);
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    if (b.bend) o.frequency.exponentialRampToValueAtTime(Math.max(20, f0 * b.bend), ctx.currentTime + (b.len ?? 0.3));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(b.level ?? 0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (b.len ?? 0.3));
    o.connect(g).connect(out);
    o.start();
    o.stop(ctx.currentTime + (b.len ?? 0.3) + 0.05);
  }

  // ---- one-shot sfx ---------------------------------------------------
  sfx(kind) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(this.master);
    const tone = (f0, f1, dur, type = 'sine', lvl = 0.18, dly = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t + dly);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dly + dur);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t + dly);
      og.gain.exponentialRampToValueAtTime(lvl, t + dly + 0.02);
      og.gain.exponentialRampToValueAtTime(0.0001, t + dly + dur);
      o.connect(og).connect(g);
      o.start(t + dly); o.stop(t + dly + dur + 0.05);
    };
    const whoosh = (dur = 0.5, hz = 900, lvl = 0.3) => {
      const n = ctx.createBufferSource();
      n.buffer = this._noiseBuffer(1);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(hz * 0.4, t);
      f.frequency.exponentialRampToValueAtTime(hz, t + dur * 0.4);
      f.frequency.exponentialRampToValueAtTime(hz * 0.3, t + dur);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(lvl, t + dur * 0.25);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f).connect(ng).connect(g);
      n.start(t); n.stop(t + dur + 0.05);
    };
    switch (kind) {
      case 'pickup':
        tone(392, 392, .18, 'triangle', .15);
        tone(587, 587, .22, 'triangle', .15, .12);
        tone(784, 784, .5, 'triangle', .18, .24);
        whoosh(.7, 1200, .12);
        break;
      case 'flare':
        whoosh(.55, 1500, .3);
        tone(180, 60, .5, 'sawtooth', .05);
        break;
      case 'travel':
        whoosh(1.4, 700, .25);
        tone(220, 880, 1.2, 'sine', .07);
        break;
      case 'ui':
        tone(660, 660, .07, 'square', .05);
        break;
      case 'deny':
        tone(220, 180, .18, 'square', .06);
        break;
      case 'lore':
        tone(523, 523, .3, 'sine', .1);
        tone(659, 659, .4, 'sine', .08, .1);
        break;
      case 'plant':
        tone(330, 392, .3, 'triangle', .12);
        tone(494, 659, .6, 'sine', .1, .25);
        break;
      case 'finale':
        [262, 330, 392, 523].forEach((f, i) => tone(f, f, 1.6, 'sine', .09, i * .3));
        break;
      case 'sever':
        tone(2400, 220, .14, 'sawtooth', .12);
        whoosh(.2, 2600, .14);
        break;
      case 'dox':
        tone(880, 110, .5, 'square', .1);
        tone(932, 117, .5, 'square', .08, .05);
        break;
      case 'free':
        tone(523, 1046, .7, 'sine', .1);
        tone(659, 1318, .9, 'sine', .07, .15);
        break;
      case 'dialup':
        tone(1200, 1200, .18, 'sine', .09);
        tone(1800, 1800, .18, 'sine', .09, .22);
        tone(400, 2400, .8, 'sawtooth', .04, .45);
        whoosh(1, 2000, .12);
        break;
    }
  }
}

// Per-zone ambience definitions.
export const AMBIENCE = {
  factory: {
    level: .5, noise: .5, noiseHz: 240,
    drones: [[55, .06, 'sawtooth'], [58, .04, 'sawtooth'], [110, .02, 'square']],
    blip: { freq: [90, 220], bend: .4, len: .25, type: 'square', level: .05, every: 5 },
  },
  versailles: {
    level: .4, noise: .12, noiseHz: 900,
    drones: [[262, .03], [330, .025], [392, .02], [524, .012]],
    blip: { freq: [800, 1600], bend: 1.4, len: .12, type: 'sine', level: .04, every: 2.5 },
  },
  gulag: {
    level: .45, noise: .2, noiseHz: 500,
    drones: [[98, .05, 'sawtooth'], [196, .02, 'square']],
    blip: { freq: [600, 2200], bend: .8, len: .08, type: 'square', level: .05, every: 1.6 },
  },
  necropolis: {
    level: .45, noise: .25, noiseHz: 160,
    drones: [[65, .05], [98, .04], [130, .03], [196, .015]],
    blip: { freq: [320, 520], bend: .9, len: 1.6, type: 'sine', level: .03, every: 7 },
  },
  carceri: {
    level: .45, noise: .15, noiseHz: 320,
    drones: [[110, .04], [113, .04], [220, .02], [227, .02]],
    blip: { freq: [1200, 3200], bend: .5, len: .2, type: 'triangle', level: .04, every: 3.5 },
  },
  beta: {
    level: .45, noise: .35, noiseHz: 1400,
    drones: [[120, .03, 'square'], [240, .02, 'square']],
    blip: { freq: [1000, 2600], bend: 1.8, len: .15, type: 'square', level: .05, every: 2.2 },
  },
  garden: {
    level: .4, noise: .18, noiseHz: 700,
    drones: [[196, .02], [294, .015], [392, .01]],
    blip: { freq: [1800, 3400], bend: 1.3, len: .18, type: 'sine', level: .05, every: 2.8 },
  },
};
