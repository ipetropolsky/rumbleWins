import Phaser from 'phaser';

export default class Main extends Phaser.Scene {
    constructor() {
        super('main');
        this.velocityStep = 400;
    }

    setRegistry(name, value) {
        this.registry.set(name, value);
    }

    changeRegistry(name, amount) {
        if (amount) {
            const value = this.registry.get(name) || 0;
            this.registry.set(name, value + amount);
        }
    }

    preload() {
        this.load.image('background', 'src/assets/background.jpg');
        this.load.spritesheet('rumble_stance', 'src/assets/rumble/stance_104x120.png', {
            frameWidth: 104,
            frameHeight: 120,
        });
        this.load.spritesheet('rumble_move', 'src/assets/rumble/move_104x120.png', {
            frameWidth: 104,
            frameHeight: 120,
        });
        this.load.spritesheet('rumble_down', 'src/assets/rumble/down_104x120.png', {
            frameWidth: 104,
            frameHeight: 120,
        });
        this.load.spritesheet('rumble_punch_left', 'src/assets/rumble/punch_left_196x120.png', {
            frameWidth: 196,
            frameHeight: 120,
        });
        this.load.spritesheet('rumble_punch_right', 'src/assets/rumble/punch_right_196x120.png', {
            frameWidth: 196,
            frameHeight: 120,
        });
        this.load.spritesheet('rumble_salto', 'src/assets/rumble/salto_208x150.png', {
            frameWidth: 208,
            frameHeight: 150,
        });
    }

    create() {
        this.add.image(640, 360, 'background').setScale(1);
        this.player = this.physics.add.sprite(640, 500, 'rumble_stance').setScale(3);
        this.anims.create({
            key: 'rumble_stance',
            frames: this.anims.generateFrameNumbers('rumble_stance', { start: 0, end: 13 }),
            frameRate: 12,
            repeat: -1,
        });
        this.anims.create({
            key: 'rumble_move',
            frames: this.anims.generateFrameNumbers('rumble_move', { start: 0, end: 7 }),
            frameRate: 14,
            repeat: -1,
        });
        this.anims.create({
            key: 'rumble_down',
            frames: this.anims.generateFrameNumbers('rumble_down', { start: 0, end: 0 }),
            frameRate: 0,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_punch_left',
            frames: this.anims.generateFrameNumbers('rumble_punch_left', { start: 0, end: 3 }),
            frameRate: 14,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_punch_right',
            frames: this.anims.generateFrameNumbers('rumble_punch_right', { start: 0, end: 3 }),
            frameRate: 14,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_salto_part_1',
            frames: this.anims.generateFrameNumbers('rumble_salto', { start: 0, end: 5 }),
            frameRate: 14,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_salto_part_2',
            frames: this.anims.generateFrameNumbers('rumble_salto', { start: 6, end: 7 }),
            frameRate: 14,
            repeat: 0,
        });
        this.player.anims.play('rumble_stance', true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.strikeInProgress = false;
        this.cameras.main.fadeIn(1000);
    }

    update() {
        // Прямой в челюсть слева
        if (!this.strikeInProgress && Phaser.Input.Keyboard.JustDown(this.keyA)) {
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            this.player.once('animationcomplete', () => {
                this.strikeInProgress = false;
            });
            this.player.anims.play('rumble_punch_left', true);
        }

        // Прямой в челюсть справа
        if (!this.strikeInProgress && Phaser.Input.Keyboard.JustDown(this.keyD)) {
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            this.player.once('animationcomplete', () => {
                this.strikeInProgress = false;
            });
            this.player.anims.play('rumble_punch_right', true);
        }

        // Сальто
        if (!this.strikeInProgress && Phaser.Input.Keyboard.JustDown(this.keyS)) {
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            this.player.once('animationcomplete', () => {
                this.cameras.main.shake(200, 0.005, true);
                this.player.once('animationcomplete', () => {
                    this.cameras.main.shake(200, 0.005, true);
                    this.strikeInProgress = false;
                    this.player.y += 45;
                });
                this.player.anims.play('rumble_salto_part_2', true);
            });
            this.player.y -= 45;
            this.player.anims.play('rumble_salto_part_1', true);
        }

        if (!this.strikeInProgress) {
            // Поворот
            if (this.cursors.left.isDown) {
                this.player.flipX = true;
            } else if (this.cursors.right.isDown) {
                this.player.flipX = false;
            }

            // Движение
            if (this.cursors.down.isDown) {
                this.player.setVelocityX(0);
                this.player.anims.play('rumble_down', true);
            } else if (this.cursors.left.isDown) {
                this.player.setVelocityX(-this.velocityStep);
                this.player.anims.play('rumble_move', true);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(this.velocityStep);
                this.player.anims.play('rumble_move', true);
            } else {
                this.player.setVelocityX(0);
                this.player.anims.play('rumble_stance', true);
            }
        }
    }
}
