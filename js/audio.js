/**
 * ==========================================================================
 * さとるくんの冒険 〜日本経済大学 渋谷キャンパスを救え！〜
 * Web Audio API サウンド＆BGMシンセサイザー (js/audio.js)
 * 外部ファイル不要で即時演奏・高品質サウンドを発動！
 * ==========================================================================
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.soundOn = true;
    this.currentBGMInterval = null;
    this.bgmType = null;
    this.masterGain = null;
    this.initialized = false;
  }

  // 初回ユーザーインタラクション時に AudioContext を起動・アンロックする
  init() {
    if (!this.initialized && this.soundOn) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35; // 全体音圧
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      }
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundOn = !this.soundOn;
    if (!this.soundOn) {
      this.stopBGM();
      if (this.masterGain) this.masterGain.gain.value = 0;
    } else {
      this.init();
      if (this.masterGain) this.masterGain.gain.value = 0.35;
      if (this.bgmType) {
        const type = this.bgmType;
        this.bgmType = null;
        if (type === 'title') this.playTitleBGM();
        if (type === 'battle') this.playBattleBGM();
      }
    }
    return this.soundOn;
  }

  // --- SE (サウンドエフェクト) ジェネレーター ---
  playSE(type) {
    if (!this.soundOn) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'jump': {
        // 軽快なジャンプ音 (マリオ風上昇トーン)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'punch':
      case 'attack': {
        // パンチ・攻撃音 (鋭い風切り音＋低音アタック)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'hit': {
        // 敵に攻撃がヒットした気持ち良い打撃音
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'square';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        osc2.frequency.setValueAtTime(330, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
        break;
      }

      case 'damage': {
        // 主人公がダメージを受けた重い被弾音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'shot':
      case 'chalk': {
        // 先生がチョークや専門用語を発射する音 (サイバーシュート音)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'click':
      case 'btn': {
        // UIクリック・タップ音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.04); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'clear':
      case 'fanfare': {
        // クリア・救出ファンファーレ
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.45, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.35);
        });
        break;
      }
    }
  }

  // --- BGM セクエンサー ---
  stopBGM() {
    if (this.currentBGMInterval) {
      clearInterval(this.currentBGMInterval);
      this.currentBGMInterval = null;
    }
    this.bgmType = null;
  }

  // タイトルBGM（知覚的で希望に満ちたテクノポップループ）
  playTitleBGM() {
    this.stopBGM();
    this.bgmType = 'title';
    if (!this.soundOn) return;
    this.init();
    if (!this.ctx) return;

    // ペンタトニックスケール (C, D, E, G, A) による爽やかなBGM
    const melody = [
      523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00,
      440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25
    ];
    let step = 0;

    const playStep = () => {
      if (!this.soundOn || !this.ctx || this.bgmType !== 'title') return;
      const now = this.ctx.currentTime;
      const freq = melody[step % melody.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.24);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.24);

      step++;
    };

    playStep();
    this.currentBGMInterval = setInterval(playStep, 250); // BPM 240 (8th notes)
  }

  // ボス戦BGM（エキサイティングで緊迫感のあるレトロバトルロック）
  playBattleBGM() {
    this.stopBGM();
    this.bgmType = 'battle';
    if (!this.soundOn) return;
    this.init();
    if (!this.ctx) return;

    // マイナースケールとベースラインのダイナミックなループ
    const bassline = [110.00, 110.00, 146.83, 130.81, 110.00, 164.81, 146.83, 130.81];
    const leadline = [440.00, 0, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00];
    let step = 0;

    const playStep = () => {
      if (!this.soundOn || !this.ctx || this.bgmType !== 'battle') return;
      const now = this.ctx.currentTime;
      const idx = step % bassline.length;

      // ベースライン
      if (bassline[idx] > 0) {
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = 'sawtooth';
        oscB.frequency.setValueAtTime(bassline[idx], now);
        gainB.gain.setValueAtTime(0.2, now);
        gainB.gain.linearRampToValueAtTime(0.01, now + 0.16);
        oscB.connect(gainB);
        gainB.connect(this.masterGain);
        oscB.start(now);
        oscB.stop(now + 0.16);
      }

      // リードメロディ
      if (leadline[idx] > 0 && step % 2 === 0) {
        const oscL = this.ctx.createOscillator();
        const gainL = this.ctx.createGain();
        oscL.type = 'square';
        oscL.frequency.setValueAtTime(leadline[idx], now);
        gainL.gain.setValueAtTime(0.14, now);
        gainL.gain.linearRampToValueAtTime(0.01, now + 0.18);
        oscL.connect(gainL);
        gainL.connect(this.masterGain);
        oscL.start(now);
        oscL.stop(now + 0.18);
      }

      step++;
    };

    playStep();
    this.currentBGMInterval = setInterval(playStep, 160); // ハイテンポバトル
  }
}

// グローバルインスタンス
const audio = new AudioEngine();
window.audioEngine = audio;
