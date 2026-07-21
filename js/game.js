/**
 * ==========================================================================
 * さとるくんの冒険 〜日本経済大学 渋谷キャンパスを救え！〜
 * 2Dアクションゲームエンジン＆ボス戦AI (js/game.js)
 * ==========================================================================
 */

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.gameTime = 0;

    // コールバック
    this.onBossDefeated = null;
    this.onGameOver = null;

    // 入力状態管理
    this.keys = {
      left: false,
      right: false,
      jump: false,
      attack: false
    };

    // エンティティ初期データ
    this.player = null;
    this.boss = null;
    this.projectiles = [];
    this.particles = [];

    // 定数
    this.GRAVITY = 1300;
    this.FLOOR_Y = 480;
    this.PLAYER_SPEED = 360;
    this.JUMP_VELOCITY = -680;
  }

  init(canvasId, callbacks = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.onBossDefeated = callbacks.onBossDefeated || null;
    this.onGameOver = callbacks.onGameOver || null;

    this.setupInputHandlers();
  }

  setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        if (!this.keys.jump) this.triggerJump();
        this.keys.jump = true;
      }
      if (['Enter', 'KeyZ', 'KeyX', 'ArrowDown', 'KeyS'].includes(e.code)) {
        if (!this.keys.attack) this.triggerAttack();
        this.keys.attack = true;

        if (e.code === 'KeyZ') {
          const now = Date.now();
          this.player.zKeyPressTimes.push(now);
          this.player.zKeyPressTimes = this.player.zKeyPressTimes.filter(t => now - t < 1000);
          if (this.player.zKeyPressTimes.length >= 3) {
            this.triggerRangedAttack();
            this.player.zKeyPressTimes = [];
          }
        }
      }
      if (e.code === 'KeyE') {
        this.triggerBarrier();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) this.keys.jump = false;
      if (['Enter', 'KeyZ', 'KeyX', 'ArrowDown', 'KeyS'].includes(e.code)) this.keys.attack = false;
    });

    // スマホ用タッチボタンイベント
    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); onUp(); });
    };

    bindTouch('touch-left', () => { this.keys.left = true; }, () => { this.keys.left = false; });
    bindTouch('touch-right', () => { this.keys.right = true; }, () => { this.keys.right = false; });
    bindTouch('touch-jump', () => { if (!this.keys.jump) this.triggerJump(); this.keys.jump = true; }, () => { this.keys.jump = false; });
    bindTouch('touch-attack', () => { if (!this.keys.attack) this.triggerAttack(); this.keys.attack = true; }, () => { this.keys.attack = false; });
  }

  resetGame() {
    this.gameTime = 0;
    // プレイヤー初期化
    this.player = {
      x: 140,
      y: this.FLOOR_Y - 65,
      width: 38,
      height: 65,
      vx: 0,
      vy: 0,
      hp: 5,
      maxHp: 5,
      facing: 'right',
      isJumping: false,
      isMoving: false,
      isAttacking: false,
      attackTimer: 0,
      attackCooldown: 0,
      invulnerableTimer: 0,
      chargeTimer: 0,
      isSpecialAttacking: false,
      specialAttackTimer: 0,
      specialDamageDealt: false,
      zKeyPressTimes: [],
      barrierActive: false,
      barrierTimer: 0,
      barrierCooldown: 0
    };

    // ボス初期化
    this.boss = {
      active: true,
      x: 740,
      y: this.FLOOR_Y - 110, // 地上（床接地位置：370）
      width: 70,
      height: 110,
      vx: -130,
      vy: 0,
      hp: 80,
      maxHp: 80,
      hitTimer: 0,
      attackCooldown: 2.0,
      attackIndex: 0
    };

    this.projectiles = [];
    this.particles = [];

    // UI初期化
    this.updateHUD();
  }

  start() {
    this.resetGame();
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
  }

  loop(timestamp) {
    if (!this.isRunning) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // 最大50msステップ
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  // --- ジャンプトリガー ---
  triggerJump() {
    if (!this.player.isJumping) {
      this.player.vy = this.JUMP_VELOCITY;
      this.player.isJumping = true;
      if (window.audioEngine) window.audioEngine.playSE('jump');
    }
  }

  // --- パンチ攻撃トリガー ---
  triggerAttack() {
    if (this.player.attackCooldown <= 0) {
      this.player.isAttacking = true;
      this.player.attackTimer = 0.25; // 0.25秒間の攻撃判定
      this.player.attackCooldown = 0.38;
      if (window.audioEngine) window.audioEngine.playSE('punch');
      this.checkAttackHits();
    }
  }

  // --- バリアトリガー ---
  triggerBarrier() {
    const p = this.player;
    if (p.barrierCooldown <= 0 && !p.barrierActive) {
      p.barrierActive = true;
      p.barrierTimer = 4.0; // 4秒持続
      p.barrierCooldown = 10.0; // 10秒クールダウン
      if (window.audioEngine) window.audioEngine.playSE('hit'); // バリア展開音の代用
      this.spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#00f3ff', 30);
    }
  }

  // --- 遠距離攻撃トリガー ---
  triggerRangedAttack() {
    const p = this.player;
    if (window.audioEngine) window.audioEngine.playSE('punch'); // 発射音代用
    
    this.projectiles.push({
      x: p.facing === 'right' ? p.x + p.width : p.x - 40,
      y: p.y + 15,
      width: 40,
      height: 20,
      vx: p.facing === 'right' ? 350 : -350,
      vy: 0,
      type: 'player_shot',
      isEnemy: false
    });
    this.spawnParticles(p.x + (p.facing === 'right' ? p.width : 0), p.y + 25, '#00f3ff', 10);
  }

  // --- 必殺技（5秒長押し）トリガー ---
  triggerSpecialAttack() {
    const p = this.player;
    p.isSpecialAttacking = true;
    p.specialAttackTimer = 0.85; // 0.85秒間の巨大必殺オーラ展開
    p.specialDamageDealt = false; // 今回の必殺技のダメージ付与フラグをリセット
    if (window.audioEngine) {
      window.audioEngine.playSE('fanfare');
      window.audioEngine.playSE('hit');
    }
    this.triggerScreenShake();

    // バナー表示
    const banner = document.getElementById('boss-action-banner');
    const bannerText = document.getElementById('boss-action-text');
    if (bannerText) bannerText.textContent = '【必殺発動】さとる「究極マーケティング・ブレード」！！（通常の2倍ダメージ）';
    this.showBanner(banner);

    // ド派手な発動パーティクル
    this.spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ffb700', 35);
    this.spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff007b', 25);

    this.checkAttackHits(true);
  }

  // プレイヤー攻撃の衝突判定
  checkAttackHits(isSpecial = false) {
    const p = this.player;
    // 攻撃のヒットボックス (必殺時は広範囲の巨大ブレード)
    const hitBox = {
      x: p.facing === 'right' ? p.x + (isSpecial ? p.width - 20 : p.width) : p.x - (isSpecial ? 180 : 50),
      y: p.y - (isSpecial ? 35 : 10),
      width: isSpecial ? 200 : 50,
      height: p.height + (isSpecial ? 50 : 15)
    };

    // 1. ボスとの衝突判定
    if (this.boss.active && this.checkAABB(hitBox, this.boss)) {
      if (isSpecial) {
        // 必殺技は発動時に1回だけ、無敵時間を貫通して「通常攻撃の二倍のダメージ（4ダメージ）」を与える！
        if (!p.specialDamageDealt) {
          p.specialDamageDealt = true;
          this.boss.hitTimer = 0;
          this.damageBoss(4);
        }
      } else if (this.boss.hitTimer <= 0) {
        // 通常パンチ攻撃のダメージも1から2へアップ！
        this.damageBoss(2);
      }
    }

    // 2. 敵弾（チョークやプリントや専門用語）の相殺判定
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.isEnemy && this.checkAABB(hitBox, proj)) {
        this.spawnParticles(proj.x + proj.width / 2, proj.y + proj.height / 2, isSpecial ? '#ffb700' : '#00f3ff', isSpecial ? 15 : 8);
        this.projectiles.splice(i, 1);
        if (window.audioEngine) window.audioEngine.playSE('hit');
      }
    }
  }

  damageBoss(dmg) {
    this.boss.hp = Math.max(0, this.boss.hp - dmg);
    this.boss.hitTimer = 0.25;
    if (window.audioEngine) window.audioEngine.playSE('hit');
    this.triggerScreenShake();
    this.spawnParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#ff007b', 20);
    this.updateHUD();

    if (this.boss.hp <= 0) {
      this.boss.active = false;
      this.spawnParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#ffb700', 45);
      if (window.audioEngine) window.audioEngine.playSE('fanfare');
      this.isRunning = false;
      if (this.onBossDefeated) setTimeout(() => this.onBossDefeated(), 1000);
    }
  }

  damagePlayer(dmg) {
    if (this.player.invulnerableTimer > 0) return;
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.player.invulnerableTimer = 1.6;
    if (window.audioEngine) window.audioEngine.playSE('damage');
    this.triggerScreenShake();
    this.spawnParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff0055', 18);
    this.updateHUD();

    if (this.player.hp <= 0) {
      this.isRunning = false;
      if (this.onGameOver) setTimeout(() => this.onGameOver(), 800);
    }
  }

  updateHUD() {
    // 1. ボスHPバー更新
    const bossBar = document.getElementById('boss-hp-bar');
    if (bossBar && this.boss) {
      const pct = (this.boss.hp / this.boss.maxHp) * 100;
      bossBar.style.width = `${pct}%`;
    }

    // 2. プレイヤーHPハート更新
    const heartsContainer = document.getElementById('player-hp-hearts');
    if (heartsContainer && this.player) {
      heartsContainer.innerHTML = '';
      for (let i = 0; i < this.player.maxHp; i++) {
        const span = document.createElement('span');
        span.className = i < this.player.hp ? 'heart active' : 'heart inactive';
        span.textContent = '❤️';
        heartsContainer.appendChild(span);
      }
    }
  }

  triggerScreenShake() {
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('shake');
      void container.offsetWidth; // リフロー
      container.classList.add('shake');
    }
  }

  // --- メインループ更新 ---
  update(dt) {
    this.gameTime += dt;
    const p = this.player;

    // 1. プレイヤー移動・重力処理
    if (this.keys.left) {
      p.vx = -this.PLAYER_SPEED;
      p.facing = 'left';
      p.isMoving = true;
    } else if (this.keys.right) {
      p.vx = this.PLAYER_SPEED;
      p.facing = 'right';
      p.isMoving = true;
    } else {
      p.vx = 0;
      p.isMoving = false;
    }

    p.vy += this.GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // 画面左右境界判定
    if (p.x < 10) p.x = 10;
    if (p.x > 960) p.x = 960;

    // 床接地判定
    if (p.y >= this.FLOOR_Y - p.height) {
      p.y = this.FLOOR_Y - p.height;
      p.vy = 0;
      p.isJumping = false;
    }

    // タイマー減算
    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) p.isAttacking = false;
    }
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    
    // バリアタイマー減算
    if (p.barrierTimer > 0) {
      p.barrierTimer -= dt;
      if (p.barrierTimer <= 0) p.barrierActive = false;
    }
    if (p.barrierCooldown > 0) p.barrierCooldown -= dt;

    // --- 必殺技チャージ更新 (攻撃キー5秒長押し) ---
    if (this.keys.attack && !p.isSpecialAttacking) {
      p.chargeTimer += dt;
      // チャージ上昇エフェクト
      if (Math.random() < 0.45) {
        this.particles.push({
          x: p.x + p.width / 2 + (Math.random() - 0.5) * 50,
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 25,
          vy: -45 - Math.random() * 60,
          life: 0.4,
          maxLife: 0.4,
          color: p.chargeTimer >= 4.0 ? '#ff007b' : (p.chargeTimer >= 2.5 ? '#ffb700' : '#00f3ff'),
          size: Math.random() * 4 + 2
        });
      }

      // 5秒経過で必殺技「究極マーケティング・ブレード」発動！！
      if (p.chargeTimer >= 5.0) {
        this.triggerSpecialAttack();
        p.chargeTimer = 0;
      }
    } else {
      if (!this.keys.attack) {
        p.chargeTimer = 0;
      }
    }

    // 必殺技持続更新 (効果中は連続ヒットや敵弾消滅が持続)
    if (p.specialAttackTimer > 0) {
      p.specialAttackTimer -= dt;
      if (p.specialAttackTimer <= 0) {
        p.isSpecialAttacking = false;
        p.specialDamageDealt = false;
      } else if (Math.floor(p.specialAttackTimer * 20) % 3 === 0) {
        this.checkAttackHits(true);
      }
    }

    // 2. ボス敵AI更新
    if (this.boss.active) {
      this.updateBossAI(dt);
    }

    // 3. 弾・弾幕更新
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // 敵弾とプレイヤーの当たり判定（バリア中は無効化して弾を消滅）
      if (proj.isEnemy && this.checkAABB(proj, p)) {
        if (p.barrierActive) {
          this.spawnParticles(proj.x, proj.y, '#00f3ff', 8);
          this.projectiles.splice(i, 1);
          if (window.audioEngine) window.audioEngine.playSE('hit');
          continue;
        } else if (p.invulnerableTimer <= 0) {
          this.damagePlayer(1);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // プレイヤーの遠距離攻撃（弾）とボスの当たり判定
      if (!proj.isEnemy && this.boss.active && this.checkAABB(proj, this.boss)) {
        this.damageBoss(1);
        this.spawnParticles(proj.x + proj.width, proj.y + proj.height / 2, '#ffb700', 12);
        this.projectiles.splice(i, 1);
        continue;
      }

      // 画面外削除
      if (proj.x < -150 || proj.x > 1150 || proj.y > 600 || proj.y < -100) {
        this.projectiles.splice(i, 1);
      }
    }

    // 4. パーティクル更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // 5. ボス本体とプレイヤーの接触判定
    if (this.boss.active && this.checkAABB(p, this.boss)) {
      if (p.barrierActive) {
        // バリア中はノーダメージ
      } else if (p.invulnerableTimer <= 0) {
        this.damagePlayer(1);
      }
    }
  }

  // ボスの攻撃AI
  updateBossAI(dt) {
    const b = this.boss;
    if (b.hitTimer > 0) b.hitTimer -= dt;

    // 地上を左右に動き回る (熱血パトロール歩行)
    b.x += b.vx * dt;
    if (b.x < 520) {
      b.x = 520;
      b.vx = Math.abs(b.vx);
    } else if (b.x > 860) {
      b.x = 860;
      b.vx = -Math.abs(b.vx);
    }
    // 地上で足を踏みしめながら歩き回る軽快な上下バウンス
    b.y = (this.FLOOR_Y - b.height) - Math.abs(Math.sin(this.gameTime * 7)) * 8;

    // 攻撃クールダウン減算＆発動
    b.attackCooldown -= dt;
    if (b.attackCooldown <= 0) {
      this.executeBossAttack();
      b.attackCooldown = Math.random() * 0.8 + 1.8; // 1.8〜2.6秒間隔
    }
  }

  executeBossAttack() {
    const b = this.boss;
    b.attackIndex = (b.attackIndex + 1) % 3;
    const banner = document.getElementById('boss-action-banner');
    const bannerText = document.getElementById('boss-action-text');

    if (window.audioEngine) window.audioEngine.playSE('chalk');

    if (b.attackIndex === 0) {
      // 攻撃1: チョーク投げ (2連射)
      if (bannerText) bannerText.textContent = '【攻撃】チョーク高速投擲！';
      this.showBanner(banner);
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          if (!this.isRunning || !b.active) return;
          this.projectiles.push({
            isEnemy: true,
            type: 'chalk',
            x: b.x,
            y: b.y + 40 + i * 25,
            width: 24,
            height: 10,
            vx: -380 - Math.random() * 50,
            vy: (Math.random() - 0.5) * 40
          });
          if (window.audioEngine) window.audioEngine.playSE('chalk');
        }, i * 220);
      }
    } else if (b.attackIndex === 1) {
      // 攻撃2: 大量の課題プリント攻撃 (上空からひらひら落下)
      if (bannerText) bannerText.textContent = '【警告】大量の補習課題プリント攻撃！';
      this.showBanner(banner);
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!this.isRunning || !b.active) return;
          this.projectiles.push({
            isEnemy: true,
            type: 'print',
            x: b.x - 20 - i * 60,
            y: b.y - 120 + i * 20, // 上空からひらひら舞い降りる
            width: 30,
            height: 40,
            vx: -240 - Math.random() * 80,
            vy: 110 + Math.random() * 100
          });
        }, i * 180);
      }
    } else {
      // 攻撃3: 難解専門用語ミサイル弾幕！
      const terms = ['マーケティング戦略', '統計学入門', 'AI・データ分析', '財務会計', 'デジタルビジネス'];
      const pickedTerm = terms[Math.floor(Math.random() * terms.length)];
      if (bannerText) bannerText.textContent = `【必殺】専門用語「${pickedTerm}」弾幕！！`;
      this.showBanner(banner);
      this.projectiles.push({
        isEnemy: true,
        type: 'term',
        termText: pickedTerm,
        x: b.x - 20,
        y: b.y + 50,
        width: 140,
        height: 32,
        vx: -420,
        vy: (this.player.y - b.y) * 0.4
      });
    }
  }

  showBanner(banner) {
    if (!banner) return;
    banner.classList.remove('hidden');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 1400);
  }

  // --- 当たり判定 & パーティクル ---
  checkAABB(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 180 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: Math.random() * 5 + 2,
        color,
        life: Math.random() * 0.4 + 0.2,
        maxLife: 0.6
      });
    }
  }

  // --- 描画処理 ---
  render() {
    if (!this.ctx || !window.graphicsEngine) return;
    const ctx = this.ctx;

    // 1. 背景パララックス描画
    window.graphicsEngine.renderBackground(ctx, 1024, 576, this.player ? this.player.x : 0);

    // 2. 結界内のヒロイン描画 (右端 X: 930)
    window.graphicsEngine.renderHeroine(ctx, 930, this.FLOOR_Y, this.gameTime);

    // 3. ボス描画
    if (this.boss && this.boss.active) {
      window.graphicsEngine.renderBoss(ctx, this.boss);
    }

    // 4. 弾・弾幕描画
    window.graphicsEngine.renderProjectiles(ctx, this.projectiles);

    // 5. プレイヤー描画
    if (this.player) {
      window.graphicsEngine.renderPlayer(ctx, this.player);
    }

    // 6. パーティクル描画
    window.graphicsEngine.renderParticles(ctx, this.particles);
  }
}

// グローバルインスタンス
const gameEngine = new GameEngine();
window.gameEngine = gameEngine;
