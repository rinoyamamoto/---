/**
 * ==========================================================================
 * さとるくんの冒険 〜日本経済大学 渋谷キャンパスを救え！〜
 * メインコントローラー＆シーン遷移管理 (js/main.js)
 * ==========================================================================
 */

class GameController {
  constructor() {
    this.currentScene = 'TITLE';
    this.screens = {};
  }

  init() {
    // 各オーバーレイ要素の参照取得
    this.screens = {
      TITLE: document.getElementById('title-screen'),
      STORY: document.getElementById('story-screen'),
      BOSS_UI: document.getElementById('boss-ui-overlay'),
      GAME_OVER: document.getElementById('game-over-screen'),
      PR_RESULT: document.getElementById('pr-screen'),
      VIRTUAL_PAD: document.getElementById('virtual-controls')
    };

    // ゲームエンジンの初期化＆コールバック登録
    if (window.gameEngine) {
      window.gameEngine.init('game-canvas', {
        onBossDefeated: () => this.switchScene('STORY_CLEAR'),
        onGameOver: () => this.switchScene('GAME_OVER')
      });
    }

    // ボタンイベントのバインド
    this.bindEvents();

    // 初期シーン切り替え (TITLE)
    this.switchScene('TITLE');

    // タイトル画面でも Canvas 背景を 60FPS で描画開始
    this.startBackgroundLoop();
  }

  bindEvents() {
    // 1. スタートボタン
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.audioEngine) window.audioEngine.playSE('click');
        this.switchScene('STORY_INTRO');
      });
    }

    // 2. リトライボタン (ゲームオーバー画面から再挑戦)
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (window.audioEngine) window.audioEngine.playSE('click');
        this.switchScene('GAME_BOSS');
      });
    }

    // 3. タイトルへ戻るボタン
    const toTitleBtn = document.getElementById('to-title-btn');
    if (toTitleBtn) {
      toTitleBtn.addEventListener('click', () => {
        if (window.audioEngine) window.audioEngine.playSE('click');
        this.switchScene('TITLE');
      });
    }

    // 4. もう一度遊ぶボタン (PR画面からリプレイ)
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        if (window.audioEngine) window.audioEngine.playSE('click');
        this.switchScene('TITLE');
      });
    }

    // 5. サウンドトグルボタン
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        if (window.audioEngine) {
          const soundOn = window.audioEngine.toggleSound();
          const icon = soundToggle.querySelector('.sound-icon');
          const label = soundToggle.querySelector('.sound-label');
          if (soundOn) {
            soundToggle.classList.remove('muted');
            if (icon) icon.textContent = '🔊';
            if (label) label.textContent = 'SOUND ON';
          } else {
            soundToggle.classList.add('muted');
            if (icon) icon.textContent = '🔇';
            if (label) label.textContent = 'SOUND OFF';
          }
        }
      });
    }

    // 6. スペースキーまたはEnterキーでストーリーとゲームを開始・進行
    window.addEventListener('keydown', (e) => {
      if (['Space', 'Enter'].includes(e.code)) {
        // シーン遷移直後(0.35秒以内)の連打巻き込みや誤動作を防止
        if (Date.now() - (this.lastSceneChangeTime || 0) < 350) return;

        if (this.currentScene === 'TITLE') {
          e.preventDefault();
          if (window.audioEngine) window.audioEngine.playSE('click');
          this.switchScene('STORY_INTRO');
        } else if (this.currentScene === 'STORY_INTRO' || this.currentScene === 'STORY_CLEAR') {
          e.preventDefault();
          if (window.storyEngine && window.storyEngine.screen && window.storyEngine.screen.classList.contains('active')) {
            window.storyEngine.handleNext();
          }
        } else if (this.currentScene === 'GAME_OVER') {
          e.preventDefault();
          if (window.audioEngine) window.audioEngine.playSE('click');
          this.switchScene('GAME_BOSS');
        } else if (this.currentScene === 'PR_RESULT') {
          e.preventDefault();
          if (window.audioEngine) window.audioEngine.playSE('click');
          this.switchScene('TITLE');
        }
      }
    });
  }

  // --- シーン切り替えロジック ---
  switchScene(sceneName) {
    this.currentScene = sceneName;
    this.lastSceneChangeTime = Date.now();

    // 1. まず全スクリーンを非表示にする
    Object.values(this.screens).forEach(screen => {
      if (screen) {
        screen.classList.remove('active');
        screen.classList.add('hidden');
      }
    });

    // ゲームエンジンの停止
    if (window.gameEngine && sceneName !== 'GAME_BOSS') {
      window.gameEngine.stop();
    }

    // 2. 対象シーンに応じた表示・処理
    switch (sceneName) {
      case 'TITLE':
        if (this.screens.TITLE) {
          this.screens.TITLE.classList.remove('hidden');
          this.screens.TITLE.classList.add('active');
        }
        if (window.audioEngine) window.audioEngine.playTitleBGM();
        break;

      case 'STORY_INTRO':
        if (window.audioEngine) window.audioEngine.playTitleBGM();
        if (window.storyEngine) {
          window.storyEngine.startStory('INTRO', () => {
            // 導入ストーリー完了時はシームレスにボス戦へ
            this.switchScene('GAME_BOSS');
          });
        }
        break;

      case 'GAME_BOSS':
        if (this.screens.BOSS_UI) {
          this.screens.BOSS_UI.classList.remove('hidden');
          this.screens.BOSS_UI.classList.add('active');
        }
        // 画面上の仮想コマンドボタンは非表示（無効化）
        if (this.screens.VIRTUAL_PAD) {
          this.screens.VIRTUAL_PAD.classList.add('hidden');
          this.screens.VIRTUAL_PAD.classList.remove('active');
        }
        if (window.audioEngine) window.audioEngine.playBattleBGM();
        if (window.gameEngine) window.gameEngine.start();
        break;

      case 'STORY_CLEAR':
        if (window.audioEngine) window.audioEngine.stopBGM();
        if (window.storyEngine) {
          window.storyEngine.startStory('CLEAR', () => {
            // クリアストーリー完了後は PR画面へ
            this.switchScene('PR_RESULT');
          });
        }
        break;

      case 'PR_RESULT':
        if (this.screens.PR_RESULT) {
          this.screens.PR_RESULT.classList.remove('hidden');
          this.screens.PR_RESULT.classList.add('active');
        }
        if (window.audioEngine) window.audioEngine.playTitleBGM();
        break;

      case 'GAME_OVER':
        if (this.screens.GAME_OVER) {
          this.screens.GAME_OVER.classList.remove('hidden');
          this.screens.GAME_OVER.classList.add('active');
        }
        if (window.audioEngine) window.audioEngine.stopBGM();
        break;
    }
  }

  // タイトル等での背景アニメーションループ
  startBackgroundLoop() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const renderLoop = () => {
      // ゲームプレイ中でない時だけ Canvas に背景とヒロインを描画
      if (this.currentScene !== 'GAME_BOSS') {
        time += 0.016;
        if (window.graphicsEngine) {
          window.graphicsEngine.renderBackground(ctx, 1024, 576, Math.sin(time * 0.5) * 40);
          window.graphicsEngine.renderHeroine(ctx, 930, 480, time);
        }
      }
      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
  }
}

// ページロード時にコントローラー起動
window.addEventListener('DOMContentLoaded', () => {
  const controller = new GameController();
  window.gameController = controller;
  controller.init();
});
