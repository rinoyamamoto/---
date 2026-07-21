/**
 * ==========================================================================
 * さとるくんの冒険 〜日本経済大学 渋谷キャンパスを救え！〜
 * 2Dグラフィックス＆パララックスレンダリングエンジン (js/graphics.js)
 * ==========================================================================
 */

class GraphicsEngine {
  constructor() {
    this.satoruImg = new Image();
    this.satoruImg.src = 'assets/satoru.png';
    this.satoruAttackImg = new Image();
    this.satoruAttackImg.src = 'assets/satoru_attack.png';
    this.heroineImg = new Image();
    this.heroineImg.src = 'assets/heroine.png';
    this.bgStars = [];
    // スター＆都市光の初期化
    for (let i = 0; i < 40; i++) {
      this.bgStars.push({
        x: Math.random() * 1024,
        y: Math.random() * 300,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.05 + 0.02
      });
    }
  }

  // --- パララックス背景（渋谷キャンパスとサイバー夜景）描画 ---
  renderBackground(ctx, width, height, cameraX = 0) {
    // 1. 空・グラデーション背景
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0a0f1d');
    skyGrad.addColorStop(0.6, '#181f38');
    skyGrad.addColorStop(1, '#231c42');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. 遠景スター＆グリッド光
    ctx.save();
    this.bgStars.forEach(star => {
      ctx.fillStyle = `rgba(0, 243, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc((star.x - cameraX * 0.05 + width) % width, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 3. 遠景ビル群 (渋谷シルエット)
    ctx.save();
    ctx.fillStyle = '#0f1426';
    const buildings = [
      { x: 0, w: 100, h: 220 }, { x: 110, w: 140, h: 310 }, { x: 260, w: 90, h: 180 },
      { x: 360, w: 180, h: 360 }, { x: 550, w: 120, h: 250 }, { x: 680, w: 160, h: 330 },
      { x: 850, w: 180, h: 280 }
    ];
    buildings.forEach(b => {
      const bx = (b.x - cameraX * 0.15 + width * 2) % (width + 200) - 100;
      ctx.fillRect(bx, height - b.h - 80, b.w, b.h);

      // 窓のネオンライト
      ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
      for (let wy = height - b.h - 60; wy < height - 90; wy += 25) {
        for (let wx = bx + 12; wx < bx + b.w - 15; wx += 22) {
          if ((wx + wy) % 3 === 0) {
            ctx.fillRect(wx, wy, 10, 15);
          }
        }
      }
      ctx.fillStyle = '#0f1426';
    });
    ctx.restore();

    // 4. 中景：日本経済大学 東京渋谷キャンパス (メインビルディング・サイン)
    ctx.save();
    const campusX = 300 - cameraX * 0.3;
    // キャンパス棟シルエット
    const campusGrad = ctx.createLinearGradient(0, height - 380, 0, height - 80);
    campusGrad.addColorStop(0, '#1e294b');
    campusGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = campusGrad;
    ctx.fillRect(campusX, height - 380, 420, 300);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(campusX, height - 380, 420, 300);

    // 屋上ネオンサイン 「JUE TOKYO SHIBUYA」
    ctx.fillStyle = '#00f3ff';
    ctx.font = '900 20px Outfit, sans-serif';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.fillText('JUE TOKYO SHIBUYA CAMPUS', campusX + 40, height - 340);
    ctx.fillStyle = '#ff007b';
    ctx.font = '700 16px Noto Sans JP, sans-serif';
    ctx.shadowColor = '#ff007b';
    ctx.fillText('デジタルビジネス・マネジメント学科', campusX + 65, height - 310);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 5. 教室ステージ床・壁の装飾
    ctx.save();
    // 床 (Y: 480 〜 576)
    const floorGrad = ctx.createLinearGradient(0, 480, 0, height);
    floorGrad.addColorStop(0, '#1e293b');
    floorGrad.addColorStop(0.2, '#0f172a');
    floorGrad.addColorStop(1, '#020617');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 480, width, height - 480);

    // 床のサイバーグリッド線
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let gx = - (cameraX % 40); gx < width; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 480);
      ctx.lineTo(gx - 20, height);
      ctx.stroke();
    }
    // 床の境界ネオンライン
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(width, 480);
    ctx.stroke();
    ctx.restore();
  }

  // --- ヒロイン（檻に閉じ込められた姿）描画 ---
  renderHeroine(ctx, x, y, time = 0) {
    ctx.save();
    
    // ヒロイン画像の描画
    if (this.heroineImg && this.heroineImg.complete) {
      // 影をつけて少し浮き出させる
      ctx.shadowColor = 'rgba(255, 0, 123, 0.4)';
      ctx.shadowBlur = 10;
      ctx.drawImage(this.heroineImg, x - 35, y - 90, 70, 90);
      ctx.shadowBlur = 0;
    }

    // 檻 (ケージ) の描画
    ctx.strokeStyle = '#475569'; // 鉄格子色（スレートグレー）
    ctx.lineWidth = 4;
    
    const cageLeft = x - 50;
    const cageRight = x + 50;
    const cageTop = y - 100;
    const cageBottom = y + 10;
    
    // 枠
    ctx.strokeRect(cageLeft, cageTop, 100, 110);
    // 縦の鉄格子
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cageLeft + i * 20, cageTop);
      ctx.lineTo(cageLeft + i * 20, cageBottom);
      ctx.stroke();
    }
    // 横の補強線
    ctx.beginPath();
    ctx.moveTo(cageLeft, cageTop + 55);
    ctx.lineTo(cageRight, cageTop + 55);
    ctx.stroke();

    // 檻上のテキスト
    ctx.fillStyle = '#ff4da6';
    ctx.font = '800 14px Noto Sans JP, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4da6';
    ctx.shadowBlur = 10;
    ctx.fillText('HELP! 補習の檻', x, y - 110 + Math.sin(time * 4) * 4);
    ctx.restore();
  }

  // --- プレイヤー（さとるくん）描画 ---
  renderPlayer(ctx, player) {
    ctx.save();
    const { x, y, width, height, facing, isMoving, isJumping, isAttacking, invulnerableTimer } = player;

    // 無敵時の点滅
    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.translate(x + width / 2, y + height);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // アニメーション用オフセット計算
    const bob = isMoving ? Math.sin(Date.now() * 0.015) * 3 : 0;
    const jumpOffset = isJumping ? -6 : 0;

    const isSpecial = player.isSpecialAttacking;
    const chargeTimer = player.chargeTimer || 0;

    // 写真画像があれば「体なし・写真のみ」をダイナミックキャラクターとして表示！
    const currentPhotoImg = ((isAttacking || isSpecial) && this.satoruAttackImg && this.satoruAttackImg.complete && this.satoruAttackImg.naturalWidth > 0)
      ? this.satoruAttackImg
      : (this.satoruImg && this.satoruImg.complete && this.satoruImg.naturalWidth > 0 ? this.satoruImg : null);

    if (currentPhotoImg) {
      // 体なし・写真のみを描画
      ctx.save();
      if (isSpecial) {
        ctx.filter = 'drop-shadow(0 0 25px #ffb700) drop-shadow(0 0 35px #ff007b)';
      } else if (isAttacking) {
        ctx.filter = 'drop-shadow(0 0 18px #ff007b)';
      } else if (chargeTimer > 0) {
        ctx.filter = 'drop-shadow(0 0 16px #ffb700)';
      } else {
        ctx.filter = 'drop-shadow(0 0 12px #00f3ff)';
      }

      // キャラクターボックスの中心（0, 0 は足元接地位置）から写真全体を描画
      const imgW = isSpecial ? 105 : (isAttacking ? 86 : 76);
      const imgH = isSpecial ? 115 : (isAttacking ? 96 : 86);
      ctx.drawImage(currentPhotoImg, -imgW / 2, -imgH + bob + jumpOffset, imgW, imgH);
      ctx.restore();

      // --- 必殺技チャージ中のゲージ＆エネルギーオーラ表示 ---
      if (chargeTimer > 0 && !isSpecial) {
        const pct = Math.min(100, Math.floor((chargeTimer / 5.0) * 100));
        ctx.save();
        // チャージオーラリング
        ctx.strokeStyle = pct >= 80 ? '#ff007b' : (pct >= 40 ? '#ffb700' : '#00f3ff');
        ctx.lineWidth = 2.5;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -45 + bob + jumpOffset, 45 + Math.sin(Date.now() * 0.02) * 8, 0, Math.PI * 2);
        ctx.stroke();

        // チャージバー背景と本体
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(-35, -118 + bob + jumpOffset, 70, 10);
        ctx.fillStyle = pct >= 80 ? '#ff007b' : (pct >= 40 ? '#ffb700' : '#00f3ff');
        ctx.fillRect(-35, -118 + bob + jumpOffset, (70 * pct) / 100, 10);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-35, -118 + bob + jumpOffset, 70, 10);

        // パーセントテキスト
        ctx.fillStyle = '#fff';
        ctx.font = '900 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ CHARGE ${pct}% ⚡`, 0, -124 + bob + jumpOffset);
        ctx.restore();
      }

      // --- 必殺技（巨大マーケティング・ブレード）または通常パンチ攻撃の軌跡描画 ---
      if (isSpecial) {
        ctx.save();
        // 巨大ゴールド衝撃波
        ctx.strokeStyle = '#ffb700';
        ctx.lineWidth = 10;
        ctx.shadowColor = '#ffb700';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(80, -50 + bob + jumpOffset, 95, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // 外周のサイバーシアンブレード
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(98, -50 + bob + jumpOffset, 115, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();

        // 必殺技テキスト
        ctx.fillStyle = '#ff007b';
        ctx.font = '900 16px Noto Sans JP';
        ctx.shadowColor = '#ff007b';
        ctx.shadowBlur = 15;
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 究極マーケティング・ブレード (2倍ダメージ) ⚡', 120, -100 + bob + jumpOffset);
        ctx.restore();
      } else if (isAttacking) {
        ctx.save();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(36, -45 + bob + jumpOffset, 42, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        ctx.fillStyle = '#ffb700';
        ctx.font = '900 13px Noto Sans JP';
        ctx.shadowColor = '#ffb700';
        ctx.shadowBlur = 10;
        ctx.fillText('気合！', 44, -40 + bob + jumpOffset);
        ctx.restore();
      }
    } else {
      // 1. 脚部 (フォールバック時のみ描画)
      ctx.fillStyle = '#1e293b';
      if (isMoving && !isJumping) {
        const legOffset = Math.sin(Date.now() * 0.02) * 8;
        ctx.fillRect(-14 + legOffset / 2, -24, 10, 24);
        ctx.fillRect(4 - legOffset / 2, -24, 10, 24);
      } else {
        ctx.fillRect(-12, -24, 10, 24);
        ctx.fillRect(2, -24, 10, 24);
      }

      // 2. 胴体
      const bodyGrad = ctx.createLinearGradient(-18, -65 + bob, 18, -24 + bob);
      bodyGrad.addColorStop(0, '#00f3ff');
      bodyGrad.addColorStop(1, '#0055ff');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(-18, -65 + bob + jumpOffset, 36, 42);

      // 胸元ロゴ JUE
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JUE', 0, -42 + bob + jumpOffset);

      // 3. 顔・頭部
      ctx.fillStyle = '#ffe0cc';
      ctx.beginPath();
      ctx.arc(0, -78 + bob + jumpOffset, 16, 0, Math.PI * 2);
      ctx.fill();

      // 髪型
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -82 + bob + jumpOffset, 17, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-17, -84 + bob + jumpOffset, 6, 12);

      // 目＆意気込み表情
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, -80 + bob + jumpOffset, 4, 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(5, -79 + bob + jumpOffset, 2, 2);

      // 4. 攻撃モーション
      if (isAttacking) {
        ctx.fillStyle = '#ffb700';
        ctx.fillRect(18, -55 + bob + jumpOffset, 32, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '900 11px Noto Sans JP';
        ctx.fillText('教科書！', 34, -43 + bob + jumpOffset);

        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(36, -48 + bob + jumpOffset, 35, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(4, -58 + bob + jumpOffset, 12, 22);
      }
    }

    // --- バリア（シールド）描画 ---
    if (player.barrierActive) {
      ctx.save();
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
      ctx.beginPath();
      // キャラを包む楕円のバリア
      ctx.ellipse(0, -height / 2 + bob + jumpOffset, width + 10 + Math.sin(Date.now()*0.01)*5, height/2 + 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = '900 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.fillText('🛡️ DIGITAL BARRIER', 0, -height - 20 + bob + jumpOffset);
      ctx.restore();
    }

    ctx.restore();
  }

  // --- ボス（熱血指導・寺岡先生）描画 ---
  renderBoss(ctx, boss) {
    if (!boss.active) return;
    ctx.save();
    const { x, y, width, height, isHit, hp } = boss;

    ctx.translate(x + width / 2, y + height);

    // 被弾時は赤白にフラッシュ＆揺れる
    if (boss.hitTimer > 0) {
      ctx.translate(Math.sin(Date.now() * 0.1) * 6, 0);
      ctx.filter = 'brightness(2) drop-shadow(0 0 15px #ff0055)';
    }

    const hover = Math.sin(Date.now() * 0.006) * 12;

    // 1. ボスオーラ (強烈な熱血エネルギー)
    ctx.fillStyle = 'rgba(255, 0, 123, 0.15)';
    ctx.beginPath();
    ctx.arc(0, -60 + hover, 65, 0, Math.PI * 2);
    ctx.fill();

    // 2. マント・スーツ
    ctx.fillStyle = '#6b21a8';
    ctx.beginPath();
    ctx.moveTo(-35, -90 + hover);
    ctx.lineTo(45, -90 + hover);
    ctx.lineTo(60, -10 + hover);
    ctx.lineTo(-45, -10 + hover);
    ctx.closePath();
    ctx.fill();

    // スーツ胴体
    ctx.fillStyle = '#831843';
    ctx.fillRect(-26, -95 + hover, 52, 60);

    // 金のネクタイ
    ctx.fillStyle = '#ffb700';
    ctx.beginPath();
    ctx.moveTo(-6, -95 + hover);
    ctx.lineTo(6, -95 + hover);
    ctx.lineTo(10, -45 + hover);
    ctx.lineTo(-10, -45 + hover);
    ctx.closePath();
    ctx.fill();

    // 3. 頭部・顔
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(0, -115 + hover, 24, 0, Math.PI * 2);
    ctx.fill();

    // 熱血メガネ（光る！）
    ctx.strokeStyle = '#ff007b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff007b';
    ctx.shadowBlur = 10;
    ctx.strokeRect(-18, -122 + hover, 14, 10);
    ctx.strokeRect(4, -122 + hover, 14, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-16, -120 + hover, 10, 6);
    ctx.fillRect(6, -120 + hover, 10, 6);
    ctx.shadowBlur = 0;

    // 熱血口
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -103 + hover, 8, 0, Math.PI);
    ctx.stroke();

    // 4. 右腕（攻撃動作・チョーク/プリント持ち）
    ctx.fillStyle = '#831843';
    ctx.fillRect(-45, -90 + hover, 18, 40);
    ctx.fillRect(27, -90 + hover, 24, 30);

    ctx.restore();
  }

  // --- 敵の攻撃（チョーク・プリント・専門用語弾幕）描画 ---
  renderProjectiles(ctx, projectiles) {
    projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

      if (p.type === 'player_shot') {
        // さとるくんの遠距離攻撃（デジタル弾）
        ctx.fillStyle = '#00f3ff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '900 10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('</>', 0, 0);
      } else if (p.type === 'chalk') {
        // チョーク投げ (回転する白い弾幕)
        ctx.rotate(Date.now() * 0.02);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(-12, -4, 24, 8);
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(-12, -4, 6, 8);
      } else if (p.type === 'print') {
        // 大量の課題プリント (ひらひら飛んでくるA4用紙)
        ctx.rotate(Math.sin(Date.now() * 0.01) * 0.5);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff007b';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff007b';
        ctx.shadowBlur = 8;
        ctx.fillRect(-15, -20, 30, 40);
        ctx.strokeRect(-15, -20, 30, 40);
        ctx.fillStyle = '#ff007b';
        ctx.font = '800 10px Noto Sans JP';
        ctx.textAlign = 'center';
        ctx.fillText('課題', 0, -3);
        ctx.font = '700 8px Noto Sans JP';
        ctx.fillText('提出！', 0, 10);
      } else if (p.type === 'term') {
        // 専門用語ミサイル (難解ワードのネオン弾)
        ctx.fillStyle = 'rgba(255, 0, 123, 0.85)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff007b';
        ctx.shadowBlur = 15;
        const textWidth = ctx.measureText(p.termText || '専門用語').width + 24;
        ctx.beginPath();
        ctx.roundRect(-textWidth / 2, -16, textWidth, 32, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 13px Noto Sans JP';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.termText || '専門用語', 0, 0);
      }

      ctx.restore();
    });
  }

  // --- パーティクル・エフェクト描画 ---
  renderParticles(ctx, particles) {
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

// グローバルインスタンス
const graphicsEngine = new GraphicsEngine();
window.graphicsEngine = graphicsEngine;
