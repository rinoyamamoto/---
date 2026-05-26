// Initialize Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // Attaches canvas to this div
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    // The scenes in order: StoryScene comes first, then GameScene, then ClearScene
    scene: [StoryScene, GameScene, ClearScene]
};

// Start the game
const game = new Phaser.Game(config);
