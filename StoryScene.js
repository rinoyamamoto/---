// StoryScene: Handles the narrative parts of the game
class StoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryScene' });
        this.dialogues = [
            "ここは、とある大学。",
            "今日もいつもと変わらない平和な一日が始まるはずだった...",
            "しかし、事件は起きたのだ。",
            "（クリックしてゲームを開始）"
        ];
        this.currentDialogueIndex = 0;
    }

    create() {
        // Background for story phase (blurred or dimmed)
        this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x0a0a2a).setOrigin(0, 0);

        // Dialogue Box UI (Glassmorphism style using graphics)
        const boxWidth = 700;
        const boxHeight = 150;
        const x = (this.sys.game.config.width - boxWidth) / 2;
        const y = this.sys.game.config.height - boxHeight - 30;

        this.dialogueBox = this.add.graphics();
        this.dialogueBox.fillStyle(0xffffff, 0.1);
        this.dialogueBox.fillRoundedRect(x, y, boxWidth, boxHeight, 16);
        this.dialogueBox.lineStyle(2, 0xffffff, 0.3);
        this.dialogueBox.strokeRoundedRect(x, y, boxWidth, boxHeight, 16);

        // Text
        this.textObject = this.add.text(x + 30, y + 30, this.dialogues[this.currentDialogueIndex], {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            wordWrap: { width: boxWidth - 60, useAdvancedWrap: true }
        });

        // Next prompt indicator
        this.nextPrompt = this.add.text(x + boxWidth - 40, y + boxHeight - 40, '▼', {
            fontSize: '20px',
            color: '#aaaaaa'
        });

        // Add simple bobbing animation to the prompt indicator
        this.tweens.add({
            targets: this.nextPrompt,
            y: this.nextPrompt.y + 10,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Input handler for dialogue progression (Click/Tap)
        this.input.on('pointerdown', this.advanceDialogue, this);

        // Input handler for dialogue progression (Space Key)
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceBar.on('down', this.advanceDialogue, this);
    }

    advanceDialogue() {
        this.currentDialogueIndex++;
        if (this.currentDialogueIndex < this.dialogues.length) {
            this.textObject.setText(this.dialogues[this.currentDialogueIndex]);
        } else {
            // Transition to Game Phase
            this.scene.start('GameScene');
        }
    }
}
