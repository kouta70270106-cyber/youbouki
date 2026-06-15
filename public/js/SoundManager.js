// 妖忘記 — サウンドマネージャー
// Web Audio API で BGM・SE をプログラム合成（音声ファイル不要）
const SE = {
  ctx: null,
  bgmGain: null,
  seGain:  null,
  bgmLoop: null,
  _bgmName: null,

  // ===== 初期化（最初のユーザー操作後に呼ぶ）=====
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.18;
    this.bgmGain.connect(this.ctx.destination);

    this.seGain = this.ctx.createGain();
    this.seGain.gain.value = 0.55;
    this.seGain.connect(this.ctx.destination);
  },

  // ===== BGM =====
  playBGM(name) {
    if (!this.ctx) return;
    if (this._bgmName === name) return;
    this.stopBGM();
    this._bgmName = name;
    if (name === 'title')  this._bgmTitle();
    if (name === 'battle') this._bgmBattle();
  },

  stopBGM() {
    if (this.bgmLoop) {
      try { this.bgmLoop(); } catch(e) {}
      this.bgmLoop = null;
    }
    this._bgmName = null;
  },

  // タイトルBGM：ゆったりした和風アンビエント
  _bgmTitle() {
    const ctx = this.ctx;
    // ペンタトニック音階 (A minor pentatonic): A3 C4 D4 E4 G4 A4
    const notes = [220, 261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66, 261.63];
    const bpm = 72;
    const beat = 60 / bpm;
    let stopped = false;
    let idx = 0;

    const playNote = () => {
      if (stopped) return;
      const freq = notes[idx % notes.length];
      idx++;

      // 尺八っぽい音（サイン波＋フラッター）
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vib = ctx.createOscillator(); // ビブラート
      const vibGain = ctx.createGain();

      vib.frequency.value = 5;
      vibGain.gain.value = freq * 0.015;
      vib.connect(vibGain);
      vibGain.connect(osc.frequency);

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.bgmGain);

      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 0.08);
      gain.gain.setValueAtTime(0.6, t + beat * 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.8);

      osc.start(t);
      vib.start(t);
      osc.stop(t + beat * 1.8);
      vib.stop(t + beat * 1.8);

      // 低音ドローン（持続低音）
      if (idx % 4 === 1) {
        const drone = ctx.createOscillator();
        const dGain = ctx.createGain();
        drone.type = 'triangle';
        drone.frequency.value = 110;
        drone.connect(dGain);
        dGain.connect(this.bgmGain);
        dGain.gain.setValueAtTime(0.15, t);
        dGain.gain.exponentialRampToValueAtTime(0.001, t + beat * 4);
        drone.start(t);
        drone.stop(t + beat * 4);
      }
    };

    const loop = () => {
      if (stopped) return;
      playNote();
      const timer = setTimeout(loop, (beat * 1000) * (0.8 + Math.random() * 0.4));
      this.bgmLoop = () => { stopped = true; clearTimeout(timer); };
    };
    loop();
  },

  // バトルBGM：緊張感のある和風ビート
  _bgmBattle() {
    const ctx = this.ctx;
    const bpm = 118;
    const beat = 60 / bpm;
    let stopped = false;
    let tick = 0;

    // メロディ音列（E minor pentatonic）: E4 G4 A4 B4 D5 E5
    const melody = [329.63, 392, 440, 493.88, 587.33, 659.25, 587.33, 493.88];
    // ベース音列
    const bass   = [82.41, 98, 110, 82.41, 73.42, 82.41, 98, 110];

    const playTick = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      const i = tick % melody.length;

      // メロディ（三角波）
      if (tick % 2 === 0) {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = melody[i];
        osc.connect(g); g.connect(this.bgmGain);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.5);
        osc.start(t); osc.stop(t + beat * 1.5);
      }

      // ベース（矩形波）
      const bosc = ctx.createOscillator();
      const bg   = ctx.createGain();
      bosc.type = 'square';
      bosc.frequency.value = bass[i];
      bosc.connect(bg); bg.connect(this.bgmGain);
      bg.gain.setValueAtTime(0.12, t);
      bg.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
      bosc.start(t); bosc.stop(t + beat * 0.9);

      // 太鼓（ノイズ）
      if (tick % 4 === 0 || tick % 4 === 2) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource();
        const dg  = ctx.createGain();
        const filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = tick % 4 === 0 ? 120 : 300;
        src.buffer = buf;
        src.connect(filt); filt.connect(dg); dg.connect(this.bgmGain);
        dg.gain.setValueAtTime(tick % 4 === 0 ? 0.9 : 0.5, t);
        dg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.start(t); src.stop(t + 0.08);
      }

      tick++;
    };

    const loop = () => {
      if (stopped) return;
      playTick();
      const timer = setTimeout(loop, beat * 1000);
      this.bgmLoop = () => { stopped = true; clearTimeout(timer); };
    };
    loop();
  },

  // ===== SE =====
  playSE(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'summon':  this._seSummon();  break;
      case 'attack':  this._seAttack();  break;
      case 'damage':  this._seDamage();  break;
      case 'death':   this._seDeath();   break;
      case 'victory': this._seVictory(); break;
      case 'defeat':  this._seDefeat();  break;
      case 'click':   this._seClick();   break;
      case 'draw':    this._seDraw();    break;
    }
  },

  // 召喚：霊力が集まる感じ（上昇音）
  _seSummon() {
    const ctx = this.ctx, t = ctx.currentTime;
    [1, 1.5, 2].forEach((mul, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 * mul, t + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(720 * mul, t + 0.35 + i * 0.04);
      osc.connect(g); g.connect(this.seGain);
      g.gain.setValueAtTime(0.3, t + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t + i * 0.04);
      osc.stop(t + 0.55);
    });
  },

  // 攻撃：鋭い斬撃音
  _seAttack() {
    const ctx = this.ctx, t = ctx.currentTime;
    // ノイズバースト
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    filt.type = 'highpass'; filt.frequency.value = 2000;
    src.buffer = buf;
    src.connect(filt); filt.connect(g); g.connect(this.seGain);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.start(t); src.stop(t + 0.12);

    // 金属音
    const osc = ctx.createOscillator();
    const og  = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 880;
    osc.connect(og); og.connect(this.seGain);
    og.gain.setValueAtTime(0.4, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.08);
  },

  // ダメージ：重い衝撃音
  _seDamage() {
    const ctx = this.ctx, t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    osc.connect(g); g.connect(this.seGain);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.25);
  },

  // 撃破：霧散するような音
  _seDeath() {
    const ctx = this.ctx, t = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 - i * 80, t + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.4 + i * 0.05);
      osc.connect(g); g.connect(this.seGain);
      g.gain.setValueAtTime(0.25, t + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.55);
    }
  },

  // 勝利：明るい上昇アルペジオ
  _seVictory() {
    const ctx = this.ctx;
    const freqs = [261.63, 329.63, 392, 523.25, 659.25];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      const t   = ctx.currentTime + i * 0.1;
      osc.type = 'triangle'; osc.frequency.value = f;
      osc.connect(g); g.connect(this.seGain);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t); osc.stop(t + 0.6);
    });
  },

  // 敗北：低く沈む音
  _seDefeat() {
    const ctx = this.ctx;
    const freqs = [261.63, 220, 196, 164.81];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      const t   = ctx.currentTime + i * 0.15;
      osc.type = 'sine'; osc.frequency.value = f;
      osc.connect(g); g.connect(this.seGain);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.start(t); osc.stop(t + 0.75);
    });
  },

  // クリック
  _seClick() {
    const ctx = this.ctx, t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 880;
    osc.connect(g); g.connect(this.seGain);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.start(t); osc.stop(t + 0.06);
  },

  // ドロー
  _seDraw() {
    const ctx = this.ctx, t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(660, t + 0.1);
    osc.connect(g); g.connect(this.seGain);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t); osc.stop(t + 0.15);
  },
};
