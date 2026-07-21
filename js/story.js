/**
 * ==========================================================================
 * さとるくんの冒険 〜日本経済大学 渋谷キャンパスを救え！〜
 * ストーリー＆会話エンジン (js/story.js)
 * ==========================================================================
 */

const STORY_DATA = {
  INTRO: [
    {
      speaker: 'さとるくん',
      side: 'left',
      char: 'satoru',
      text: 'ここは日本経済大学 東京渋谷キャンパス……。\nあれっ！？ あそこの教室に閉じ込められているのは、ヒロインちゃん！'
    },
    {
      speaker: 'ヒロイン',
      side: 'right',
      char: 'heroine',
      text: '「さとるくん、助けて！\n熱血指導の『寺岡（てらおか）先生』の難解な課題と専門用語の嵐に囲まれているの！」'
    },
    {
      speaker: '寺岡（てらおか）先生',
      side: 'right',
      char: 'teacher',
      text: '「ふっふっふ……来たな、さとる君！\nここは『デジタルビジネス・マネジメント学科』の特別熱血補習ステージだ！」'
    },
    {
      speaker: '寺岡（てらおか）先生',
      side: 'right',
      char: 'teacher',
      text: '「これからの時代、AI活用やプログラミング、ビジネスの知識は必須！\n君が本気で成長したいなら、私の熱血課題（攻撃）に打ち勝ってみせよ！」'
    },
    {
      speaker: 'さとるくん',
      side: 'left',
      char: 'satoru',
      text: '「望むところだ！\n知識ゼロの状態からでも、日経大で学びながら必ず先生を超えてみせる！\n行くぞっ！」'
    },
    {
      speaker: '寺岡（てらおか）先生',
      side: 'right',
      char: 'teacher',
      text: '「その意気や良し！ チョークと課題プリント、そしてマーケティング用語の弾幕に耐えられるか！？\nいざ、勝負！！」'
    }
  ],
  CLEAR: [
    {
      speaker: '寺岡（てらおか）先生',
      side: 'right',
      char: 'teacher',
      text: '「見事だ……！ 私の熱血プリント攻撃と難解専門用語をすべて攻略するとは！」'
    },
    {
      speaker: 'さとるくん',
      side: 'left',
      char: 'satoru',
      text: '「やった！ 先生の弱点を見極めて、正確にジャンプとパンチを決められたぞ！」'
    },
    {
      speaker: 'ヒロイン',
      side: 'right',
      char: 'heroine',
      text: '「さとるくん、本当にありがとう！\nプログラミングやゲーム制作の未経験からスタートしても、こんなにカッコよく問題をクリアできるなんて！」'
    },
    {
      speaker: '寺岡（てらおか）先生',
      side: 'right',
      char: 'teacher',
      text: '「うむ！『知識ゼロからでも、楽しく学びながら実践的なサービスやゲームを作れるようになる』……\nそれが日本経済大学 渋谷キャンパスの誇る『デジタルビジネス・マネジメント学科』だ！」'
    },
    {
      speaker: 'さとるくん',
      side: 'left',
      char: 'satoru',
      text: '「うん！ これからももっとたくさんの技術やビジネスを学んで、最高のゲームやサービスを創り出すよ！」'
    }
  ]
};

class StoryEngine {
  constructor() {
    this.currentList = [];
    this.currentIndex = 0;
    this.onComplete = null;
    this.isTyping = false;
    this.typingTimer = null;
    this.currentText = '';
    this.displayedText = '';

    // DOM References
    this.screen = null;
    this.speakerEl = null;
    this.textEl = null;
    this.charLeft = null;
    this.charRight = null;
    this.skipBtn = null;
  }

  initDOM() {
    if (!this.screen) {
      this.screen = document.getElementById('story-screen');
      this.speakerEl = document.getElementById('story-speaker');
      this.textEl = document.getElementById('story-text');
      this.charLeft = document.getElementById('char-left');
      this.charRight = document.getElementById('char-right');
      this.skipBtn = document.getElementById('skip-story-btn');

      // クリックでテキスト進行またはタイピングスキップ
      this.screen.addEventListener('click', (e) => {
        if (e.target === this.skipBtn || e.target.closest('#skip-story-btn')) return;
        this.handleNext();
      });

      if (this.skipBtn) {
        this.skipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.audioEngine) window.audioEngine.playSE('click');
          this.finishStory();
        });
      }
    }
  }

  startStory(type, callback) {
    this.initDOM();
    this.currentList = STORY_DATA[type] || [];
    this.currentIndex = 0;
    this.onComplete = callback;

    this.screen.classList.remove('hidden');
    this.screen.classList.add('active');

    this.showCurrentMessage();
  }

  showCurrentMessage() {
    if (this.currentIndex >= this.currentList.length) {
      this.finishStory();
      return;
    }

    const data = this.currentList[this.currentIndex];
    this.speakerEl.textContent = data.speaker;

    // キャラクター立ち絵とアクティブ状態の設定
    this.updateCharacterPortraits(data.char, data.side);

    // テキストタイピングアニメーション
    if (this.typingTimer) clearInterval(this.typingTimer);
    this.isTyping = true;
    this.currentText = data.text;
    this.displayedText = '';
    this.textEl.textContent = '';

    let charIdx = 0;
    this.typingTimer = setInterval(() => {
      if (charIdx < this.currentText.length) {
        this.displayedText += this.currentText[charIdx];
        this.textEl.textContent = this.displayedText;
        charIdx++;
      } else {
        clearInterval(this.typingTimer);
        this.isTyping = false;
      }
    }, 25);
  }

  updateCharacterPortraits(charType, activeSide) {
    // 立ち絵をSVG/Canvasアート風に動的生成してスタイル適用
    if (activeSide === 'left') {
      this.charLeft.className = `char-portrait satoru active-speaker`;
      this.charRight.className = `char-portrait teacher`;
      this.renderPortrait(this.charLeft, 'satoru');
      this.renderPortrait(this.charRight, 'teacher');
    } else {
      this.charLeft.className = `char-portrait satoru`;
      this.charRight.className = `char-portrait ${charType} active-speaker`;
      this.renderPortrait(this.charLeft, 'satoru');
      this.renderPortrait(this.charRight, charType);
    }
  }

  renderPortrait(element, type) {
    if (type === 'satoru') {
      element.innerHTML = `<div class="satoru-photo-container"><img src="assets/satoru.png" class="satoru-photo-img" alt="さとるくん"></div>`;
      return;
    }

    // 外部画像に依存せず、高品質なSVGアバターを動的挿入
    let svg = '';
    if (type === 'teacher') {
      svg = `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="teacherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff007b"/>
            <stop offset="100%" stop-color="#6b21a8"/>
          </linearGradient>
        </defs>
        <!-- 熱血スーツ -->
        <path d="M35 240 L35 165 Q35 135 100 135 Q165 135 165 165 L165 240 Z" fill="url(#teacherGrad)" />
        <!-- ネクタイとシャツ -->
        <polygon points="90,135 110,135 105,200 95,200" fill="#ffb700" />
        <polygon points="85,135 115,135 100,160" fill="#ffffff" />
        <!-- 顔 -->
        <ellipse cx="100" cy="85" rx="44" ry="48" fill="#fbcfe8" />
        <!-- 熱血メガネ -->
        <rect x="68" y="76" width="26" height="16" rx="3" stroke="#ff007b" stroke-width="3" fill="rgba(255,255,255,0.4)" />
        <rect x="106" y="76" width="26" height="16" rx="3" stroke="#ff007b" stroke-width="3" fill="rgba(255,255,255,0.4)" />
        <line x1="94" y1="84" x2="106" y2="84" stroke="#ff007b" stroke-width="3" />
        <!-- 目 -->
        <circle cx="81" cy="84" r="3" fill="#831843" />
        <circle cx="119" cy="84" r="3" fill="#831843" />
        <!-- 眉毛 (熱血V字) -->
        <path d="M70 68 L92 74" stroke="#831843" stroke-width="4" stroke-linecap="round" />
        <path d="M130 68 L108 74" stroke="#831843" stroke-width="4" stroke-linecap="round" />
        <!-- 自信と情熱の口 -->
        <path d="M88 106 Q100 116 112 106" stroke="#831843" stroke-width="4" stroke-linecap="round" fill="none" />
      </svg>`;
    } else if (type === 'heroine') {
      svg = `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="heroineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffb700"/>
            <stop offset="100%" stop-color="#ff007b"/>
          </linearGradient>
        </defs>
        <!-- 服装 -->
        <path d="M45 240 L45 175 Q45 145 100 145 Q155 145 155 175 L155 240 Z" fill="url(#heroineGrad)" />
        <path d="M85 145 Q100 165 115 145 Z" fill="#ffffff" />
        <!-- 首 -->
        <rect x="90" y="125" width="20" height="22" fill="#ffe0cc" />
        <!-- 顔 -->
        <ellipse cx="100" cy="92" rx="40" ry="44" fill="#fff0e6" />
        <!-- 髪型 (ロングヘア＆リボン) -->
        <path d="M50 140 Q45 70 100 45 Q155 70 150 140 Q142 90 100 55 Q58 90 50 140 Z" fill="#78350f" />
        <!-- 目 (パッチリとした瞳) -->
        <ellipse cx="84" cy="92" rx="7" ry="9" fill="#451a03" />
        <ellipse cx="116" cy="92" rx="7" ry="9" fill="#451a03" />
        <circle cx="86" cy="89" r="2.5" fill="#fff" />
        <circle cx="118" cy="89" r="2.5" fill="#fff" />
        <!-- 笑顔/期待 -->
        <path d="M90 112 Q100 120 110 112" stroke="#9a3412" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- 頬の赤み -->
        <ellipse cx="73" cy="104" rx="7" ry="4" fill="#ff80b0" opacity="0.7"/>
        <ellipse cx="127" cy="104" rx="7" ry="4" fill="#ff80b0" opacity="0.7"/>
      </svg>`;
    }
    element.innerHTML = svg;
  }

  handleNext() {
    if (this.isTyping) {
      // タイピングを即時完了して全テキスト表示
      clearInterval(this.typingTimer);
      this.isTyping = false;
      this.textEl.textContent = this.currentText;
    } else {
      // 次のメッセージへ進む
      if (window.audioEngine) window.audioEngine.playSE('click');
      this.currentIndex++;
      this.showCurrentMessage();
    }
  }

  finishStory() {
    if (this.typingTimer) clearInterval(this.typingTimer);
    this.screen.classList.remove('active');
    this.screen.classList.add('hidden');
    if (this.onComplete) this.onComplete();
  }
}

// グローバルインスタンス
const storyEngine = new StoryEngine();
window.storyEngine = storyEngine;
