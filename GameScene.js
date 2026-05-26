// GameScene: Handles the Action Game phase
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load parallax backgrounds
        this.load.image('bg_far', 'assets/images/bg_far.png');
        this.load.image('bg_mid', 'assets/images/bg_mid.png');
        this.load.image('bg_near', 'assets/images/bg_near.png');
        
        // Load player and ground
        this.load.image('player', 'assets/images/player.png');
        this.load.image('ground', 'assets/images/ground.png');
    }

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // 1. Setup Parallax Backgrounds
        // setScrollFactor controls how much the layer moves relative to the camera
        this.bgFar = this.add.tileSprite(0, 0, width, height, 'bg_far').setOrigin(0, 0);
        this.bgFar.setScrollFactor(0); // Sky/distant buildings shouldn't scroll vertically

        this.bgMid = this.add.tileSprite(0, 0, width, height, 'bg_mid').setOrigin(0, 0);
        this.bgMid.setScrollFactor(0);

        this.bgNear = this.add.tileSprite(0, 0, width, height, 'bg_near').setOrigin(0, 0);
        this.bgNear.setScrollFactor(0);

        // 2. Setup Ground (Physics Static Group)
        this.platforms = this.physics.add.staticGroup();
        
        // Create a long ground using the ground tile
        for (let i = 0; i < 10; i++) {
            this.platforms.create(i * 200, height - 32, 'ground').setScale(0.5).refreshBody();
        }

        // 3. Setup Player
        // Adjust scale based on your generated sprite size
        this.player = this.physics.add.sprite(100, height - 150, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(false); // We want camera to follow
        this.player.setScale(0.3); // Adjust as needed based on generated image

        // Add collision between player and ground
        this.physics.add.collider(this.player, this.platforms);

        // 3.5 Setup Goal
        this.goal = this.add.rectangle(1800, height - 82, 60, 100, 0x00ff00); // Green rectangle as a placeholder goal
        this.physics.add.existing(this.goal, true); // true = static body
        
        // Add overlap detection for goal
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        // 4. Setup Camera
        this.cameras.main.setBounds(0, 0, 2000, height);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // 5. Setup Inputs
        this.cursors = this.input.keyboard.createCursorKeys();

        // 6. UI for Game Phase
        this.add.text(16, 16, 'Game Phase', { fontSize: '24px', fill: '#000', backgroundColor: '#fff' }).setScrollFactor(0);
    }

    update() {
        // Player Movement Logic
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.flipX = true; // face left
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false; // face right
        }
        else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-400); // Jump
        }

        // Parallax Scrolling Logic
        // Adjust the tilePositionX based on the camera's scroll to create depth
        this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.1;
        this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.3;
        this.bgNear.tilePositionX = this.cameras.main.scrollX * 0.6;
    }

    reachGoal() {
        // Transition to clear scene
        this.scene.start('ClearScene');
    }
}
