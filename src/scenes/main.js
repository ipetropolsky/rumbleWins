import Phaser from 'phaser';
import PumpkinGroup from 'src/pumpkins';
import BangGroup, { PowGroup } from 'src/bangs';
import { deactivate } from 'src/utils';

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
        this.damageVelocity = 300;
        this.jumpVelocity = 600;
        this.jumpDuration = 300;
        this.jumpTopY = 150;
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
        this.load.image('spacer', 'src/assets/spacer_white.gif');
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
        this.load.spritesheet('rumble_damage', 'src/assets/rumble/damage_126x120.png', {
            frameWidth: 126,
            frameHeight: 120,
        });
        this.load.spritesheet('rumble_falls', 'src/assets/rumble/fallen_131x33.png', {
            frameWidth: 131,
            frameHeight: 33,
        });
        this.load.spritesheet('maneken', 'src/assets/maneken_120x120.png', {
            frameWidth: 120,
            frameHeight: 120,
        });
        this.load.spritesheet('apple', 'src/assets/apple_small_32x32.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet('pumpkin', 'src/assets/pumpkin_32x32.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.image('bang_word', 'src/assets/bang_word.png');
        this.load.image('pow_word', 'src/assets/pow_word.png');
        this.load.image('game_over', 'src/assets/game_over.png');
    }

    create() {
        const strikeFrameRate = 14;
        this.add.image(640, 360, 'background').setScale(1);
        this.player = this.physics.add
            .sprite(640, 550, 'rumble_stance')
            .setScale(2)
            .setCollideWorldBounds(true);
        this.player.body.setSize(60, 110);
        this.player.body.setOffset(20, 10);
        this.player.body.setBoundsRectangle(
            new Phaser.Geom.Rectangle(0, 0, this.sys.scale.width, this.sys.scale.height - 25)
        );
        this.maneken = this.physics.add.sprite(1040, 550, 'maneken').setScale(2);
        this.apple = this.physics.add.sprite(750, 500, 'apple').setScale(2);

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
        this.anims.create({
            key: 'rumble_damage',
            frames: this.anims.generateFrameNumbers('rumble_damage', { start: 0, end: 0 }),
            frameRate: 7,
            repeat: 0,
        });
        this.anims.create({
            key: 'rumble_falls',
            frames: this.anims.generateFrameNumbers('rumble_falls', { start: 0, end: 0 }),
            frameRate: 7,
            repeat: 0,
        });
        this.anims.create({
            key: 'bang',
            frames: this.anims.generateFrameNumbers('bang_word', { start: 0, end: 1 }),
            frameRate: 7,
            repeat: 0,
        });
        this.anims.create({
            key: 'pow',
            frames: this.anims.generateFrameNumbers('pow_word', { start: 0, end: 1 }),
            frameRate: 7,
            repeat: 0,
        });

        this.bangs = new BangGroup(this.physics.world, this);
        this.pows = new PowGroup(this.physics.world, this);

        this.health = 100;
        this.add.rectangle(120, 20, 200, 10, 0xffffff);
        this.healthIndicator = this.add.rectangle(120, 20, 200, 10, 0xea6447);
        this.add.rectangle(120, 20, 200, 10, 0xffffff, 0).setStrokeStyle(2, 0x0a3730);

        this.ground = this.physics.add
            .image(this.sys.scale.width / 2 - 1, this.sys.scale.height - 25, 'spacer')
            .setImmovable();
        this.ground.setSize(this.sys.scale.width + 2, 50);
        this.ground.alpha = 0;
        this.ground.setFriction(1, 1);

        this.pumpkins = new PumpkinGroup(this.physics.world, this);
        this.physics.add.collider(this.pumpkins, this.ground);
        this.physics.add.overlap(this.pumpkins, this.player, async (player, pumpkin) => {
            const direction = pumpkin.x > player.x ? -1 : 1;
            if (this.strikeInProgress) {
                this.pows.createOne(pumpkin, player);
                deactivate(pumpkin);
            } else {
                this.bangs.createOne(pumpkin, player);
                deactivate(pumpkin);
                this.health = Math.max(0, this.health - 10);
                if (!this.health) {
                    await this.fall(direction);
                    this.gameOver();
                } else {
                    await this.damage(direction);
                }
            }
        });

        this.player.anims.play('rumble_stance', true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.cameras.main.fadeIn(1000);

        this.salto = async () => {
            const inMoving = this.player.body.velocity.x;
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            this.player.body.setOffset(56, 40);
            this.player.y -= 15 * this.player.scaleY;
            if (!inMoving) {
                await this.animatePlayer('rumble_salto_part_1');
            }
            await this.saltoInMoving();
            this.player.body.setOffset(20, 10);
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
            this.player.body.setOffset(66, 10);
            await this.animatePlayer(this.changePunch ? 'rumble_punch_right' : 'rumble_punch_left');
            if (this.queue.isEmpty()) {
                await this.animatePlayer(this.changePunch ? 'rumble_punch_right_return' : 'rumble_punch_left_return');
            }
            this.player.body.setOffset(20, 10);
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
            if (this.queue.isEmpty() && !this.inShock) {
                await this.animatePlayer('rumble_jump_landing');
            }
            this.jumpInProgress = false;
            this.player.y += 10 * this.player.scaleY;
        };

        this.jumpKick = async () => {
            this.strikeInProgress = true;
            this.player.anims.stop();
            this.player.body.setOffset(66, 15);
            await this.animatePlayer('rumble_jump_kick');
            this.player.body.setOffset(20, 10);
            this.strikeInProgress = false;
        };

        this.damage = async (direction = 1) => {
            this.inShock = true;
            this.player.anims.stop();
            this.player.setVelocityX(this.damageVelocity * direction);
            await this.animatePlayer('rumble_damage');
            this.player.setVelocityX(0);
            this.inShock = false;
        };

        this.fall = async (direction = 1) => {
            this.inShock = true;
            this.player.anims.stop();
            this.player.setVelocityX(0);
            this.player.setVelocityY(0);
            const k = 1 + (550 - this.player.y) / 400;
            const delay = 200 * k;
            this.activeTween && this.activeTween.stop();
            this.player.body.setSize(131, 31);
            this.player.body.setOffset(0, 0);
            this.player.setTexture('rumble_damage');
            // await this.animatePlayer('rumble_damage');
            this.time.delayedCall(delay / 2, () => {
                this.player.setTexture('rumble_falls');
            });
            this.tweenPlayer({
                duration: delay,
                x: this.player.x + direction * 200 * k,
                yoyo: false,
                ease: 'Linear',
            });
            await this.tweenPlayer({
                duration: delay,
                y: this.sys.scale.height - 25 - 28 * this.player.scaleY,
                yoyo: false,
                // ease: 'Back.easeIn',
                ease: 'Linear',
            });
            this.shakeGround();
            // this.player.body.setSize(60, 110);
            // this.player.body.setOffset(20, 10);
            this.inShock = false;
        };

        this.queue = new QueueManager(this);
        this.strikeInProgress = false;
        this.jumpInProgress = false;
        this.changePunch = false;
        this.gameIsOver = false;
    }

    async update() {
        if (this.gameIsOver) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            const rnd = Math.random();
            this.pumpkins.createOne(1040, 500, -1 * (300 + rnd * 1000), -1 * (-200 + (1 - rnd) * 1500));
        }

        this.healthIndicator.setSize(this.health * 2, 10);

        if (this.inShock) {
            return;
        }

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
            this.activeTween = this.tweens.add({
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

    gameOver = async () => {
        this.gameIsOver = true;
        this.add
            .image(640, 360, 'game_over')
            .setScale(4)
            .setInteractive();
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    };
}
