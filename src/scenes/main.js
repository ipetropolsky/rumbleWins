import Phaser from 'phaser';

const QueueManager = (scene) => {
    let queue = [];
    const isActual = (task) => {
        return scene.time.now - task.time < 500;
    };
    return {
        isEmpty: () => !queue.filter(isActual).length,

        isActual,

        add: (fn) => {
            if (queue.length < 3) {
                const time = scene.time.now;
                queue.push({ time, fn });
            }
        },

        get: () => {
            if (queue.length) {
                const task = queue.shift();
                if (isActual(task)) {
                    return task.fn;
                }
            }
            return undefined;
        },

        clear: () => {
            queue = [];
        },
    };
};

export default class Main extends Phaser.Scene {
    constructor() {
        super('main');
        this.velocityStep = 400;
        this.saltoVelocity = 100;
        this.jumpVelocity = 600;
        this.jumpDuration = 300;
        this.jumpTopY = 150;
        this.queue = new QueueManager(this);
        this.strikeInProgress = false;
        this.jumpInProgress = false;
        this.changePunch = false;
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
        this.load.spritesheet('rumble_salto', 'src/assets/rumble/salto_long_176x150.png', {
            frameWidth: 176,
            frameHeight: 150,
        });
        this.load.spritesheet('rumble_jump', 'src/assets/rumble/jump_104x140.png', {
            frameWidth: 104,
            frameHeight: 140,
        });
        this.load.spritesheet('rumble_jump_kick', 'src/assets/rumble/jump_kick_203x130.png', {
            frameWidth: 203,
            frameHeight: 130,
        });
    }

    create() {
        const strikeFrameRate = 14;
        this.add.image(640, 360, 'background').setScale(1);
        this.player = this.physics.add.sprite(640, 550, 'rumble_stance').setScale(2);
        this.anims.create({
            key: 'rumble_stance',
            frames: this.anims.generateFrameNumbers('rumble_stance', { start: 0, end: 13 }),
            frameRate: 11,
            repeat: -1,
        });
        this.anims.create({
            key: 'rumble_move',
            frames: this.anims.generateFrameNumbers('rumble_move', { start: 0, end: 7 }),
            frameRate: strikeFrameRate,
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
            frames: this.anims.generateFrameNumbers('rumble_punch_left', { start: 0, end: 2 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_punch_left_return',
            frames: this.anims.generateFrameNumbers('rumble_punch_left', { start: 3, end: 3 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_punch_right',
            frames: this.anims.generateFrameNumbers('rumble_punch_right', { start: 0, end: 2 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_punch_right_return',
            frames: this.anims.generateFrameNumbers('rumble_punch_right', { start: 3, end: 3 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_salto_part_1',
            frames: this.anims.generateFrameNumbers('rumble_salto', { start: 0, end: 6 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_salto_part_2',
            frames: this.anims.generateFrameNumbers('rumble_salto', { start: 7, end: 10 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_salto_part_3',
            frames: this.anims.generateFrameNumbers('rumble_salto', { start: 11, end: 16 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_jump_prepare',
            frames: this.anims.generateFrameNumbers('rumble_jump', { start: 0, end: 1 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_jump',
            frames: this.anims.generateFrameNumbers('rumble_jump', { start: 2, end: 2 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_jump_landing',
            frames: this.anims.generateFrameNumbers('rumble_jump', { start: 3, end: 3 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_jump_kick',
            frames: this.anims.generateFrameNumbers('rumble_jump_kick', { start: 0, end: 5 }),
            frameRate: strikeFrameRate,
            repeat: 0,
        });
        this.player.anims.play('rumble_stance', true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.cameras.main.fadeIn(1000);

        this.salto = async () => {
            const inMoving = this.player.body.velocity.x;
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            this.player.y -= 15 * this.player.scaleY;
            if (!inMoving) {
                await this.animatePlayer('rumble_salto_part_1');
            }
            this.saltoInMoving();
        };

        this.saltoInMoving = async () => {
            this.player.setVelocityX(this.saltoVelocity * (this.player.flipX ? -1 : 1));
            await this.animatePlayer('rumble_salto_part_2');
            this.player.setVelocityX(0);
            this.shakeGround();
            if (this.queue.isEmpty()) {
                await this.animatePlayer('rumble_salto_part_3');
            }
            this.strikeInProgress = false;
            this.player.y += 15 * this.player.scaleY;
        };

        this.punch = async () => {
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            await this.animatePlayer(this.changePunch ? 'rumble_punch_right' : 'rumble_punch_left');
            if (this.queue.isEmpty()) {
                await this.animatePlayer(this.changePunch ? 'rumble_punch_right_return' : 'rumble_punch_left_return');
            }
            this.changePunch = !this.changePunch;
            this.strikeInProgress = false;
        };

        this.jump = async () => {
            this.jumpInProgress = true;
            this.player.anims.stop();
            this.player.y -= 10 * this.player.scaleY;
            let jumpVelocity = 0;
            if (this.cursors.left.isDown) {
                jumpVelocity = -this.jumpVelocity;
            }
            if (this.cursors.right.isDown) {
                jumpVelocity = this.jumpVelocity;
            }
            // await this.animatePlayer('rumble_jump_prepare');
            this.player.setVelocityX(jumpVelocity);
            this.player.anims.play('rumble_jump', true);
            await this.tweenPlayer({ duration: this.jumpDuration, y: this.jumpTopY });
            this.player.setVelocityX(0);
            if (this.queue.isEmpty()) {
                await this.animatePlayer('rumble_jump_landing');
            }
            this.jumpInProgress = false;
            this.player.y += 10 * this.player.scaleY;
        };

        this.jumpKick = async () => {
            this.strikeInProgress = true;
            this.player.anims.stop();
            await this.animatePlayer('rumble_jump_kick');
            this.strikeInProgress = false;
        };
    }

    async update() {
        // Прыжок
        if (!this.jumpInProgress && !this.strikeInProgress && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jump();
        }

        // Прямой в челюсть слева-справа
        if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
            if (this.strikeInProgress || this.jumpInProgress) {
                this.queue.add(this.punch);
            } else {
                this.punch();
            }
        }

        // Сальто
        if (!this.jumpInProgress && Phaser.Input.Keyboard.JustDown(this.keyS)) {
            if (this.strikeInProgress) {
                this.queue.add(this.salto);
            } else {
                this.salto();
            }
        }

        // Удар ногой в воздухе
        if (this.jumpInProgress && Phaser.Input.Keyboard.JustDown(this.keyS)) {
            this.jumpKick();
        }

        if (!this.strikeInProgress && !this.jumpInProgress) {
            // Поворот
            if (this.cursors.left.isDown) {
                this.player.flipX = true;
            } else if (this.cursors.right.isDown) {
                this.player.flipX = false;
            }

            if (!this.jumpInProgress) {
                // Движение
                if (this.cursors.down.isDown) {
                    this.queue.clear();
                    this.player.setVelocityX(0);
                    this.player.anims.play('rumble_down', true);
                } else if (this.cursors.left.isDown) {
                    this.queue.clear();
                    this.player.setVelocityX(-this.velocityStep);
                    this.player.anims.play('rumble_move', true);
                } else if (this.cursors.right.isDown) {
                    this.queue.clear();
                    this.player.setVelocityX(this.velocityStep);
                    this.player.anims.play('rumble_move', true);
                } else if (!this.queue.isEmpty()) {
                    const action = this.queue.get();
                    action && action();
                } else {
                    this.player.setVelocityX(0);
                    this.player.anims.play('rumble_stance', true);
                }
            }
        }
    }

    shakeGround = () => {
        this.cameras.main.shake(200, 0.005, true);
    };

    animatePlayer = (animationName) => {
        return new Promise((resolve) => {
            this.player.anims.play(animationName, true);
            this.player.once('animationcomplete', () => {
                resolve();
            });
        });
    };

    tweenPlayer = (tweenParams) => {
        return new Promise((resolve) => {
            this.tweens.add({
                targets: this.player,
                ease: 'Sine.easeOut',
                repeat: 0,
                yoyo: true,
                ...tweenParams,
                onComplete: async () => {
                    resolve();
                },
            });
        });
    };
}
