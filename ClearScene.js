// ClearScene: Handles the game clear screen
class ClearScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClearScene' });
    }

    create() {
        // Dark blue background for clear screen
        this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x0a2a0a).setOrigin(0, 0);

        const centerX = this.sys.game.config.width / 2;
        const centerY = this.sys.game.config.height / 2;

        this.add.text(centerX, centerY - 50, 'GAME CLEAR!', {
            fontFamily: 'sans-serif',
            fontSize: '64px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 50, 'スペースキー または クリックでタイトルへ戻る', {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Input handler for restarting (Click/Tap)
        this.input.on('pointerdown', this.restartGame, this);

        // Input handler for restarting (Space Key)
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceBar.on('down', this.restartGame, this);
    }

    restartGame() {
        // Restart from the story phase
        this.scene.start('StoryScene');
    }
}
