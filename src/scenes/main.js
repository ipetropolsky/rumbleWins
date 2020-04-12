import Phaser from 'phaser';
import PumpkinGroup from 'src/pumpkins';
import BangGroup, { PowGroup, BangGroup2 } from 'src/bangs';
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
            while (queue.length) {
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
        this.timeScale = 1;
        this.velocityStep = 400;
        this.damageVelocity = 300;
        this.jumpVelocity = 600;
        this.jumpHeight = 500;
        this.jumpDuration = 400;
        this.uppercutHeight = 400;
        this.uppercutDuration = 300;
        this.groundHeight = 40;
        this.strikeFrameRate = 18;
        this.gameOverDelay = 1000;
        this.pumpkinDamage = 15;
        this.pumpkinTime = 0;
        this.pumpkinTreshold = 3000;
        this.rumbleScale = 2;
        this.rumbleBodyOffset = 10;
    }

    preload() {
        this.load.image('background', 'src/assets/tower_640.png');
        this.load.image('background_part', 'src/assets/tower_part_640.png');
        this.load.atlas('rumble', 'src/assets/rumble.png', 'src/assets/rumble.json');
        this.load.image('spacer', 'src/assets/spacer_white.gif');
        this.load.image('rumble_name', 'src/assets/rumble-name.png');
        this.load.spritesheet('apple', 'src/assets/apple_small_32x32.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet('pumpkin', 'src/assets/pumpkin_32x32.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet('bang2', 'src/assets/bang_50x50.png', {
            frameWidth: 50,
            frameHeight: 50,
        });
        this.load.spritesheet('angry', 'src/assets/angry.png', {
            frameWidth: 184,
            frameHeight: 104,
        });
        this.load.image('bang_word', 'src/assets/bang_word.png');
        this.load.image('pow_word', 'src/assets/pow_word.png');
        this.load.image('game_over', 'src/assets/game_over.png');
        this.load.image('continue', 'src/assets/continue.png');
    }

    create() {
        this.setTimeScale(1);

        // Фон
        this.add
            .image(this.screenCenterX(), this.screenHeight(), 'background')
            .setOrigin(0.5, 1)
            .setScale(2);
        this.add
            .image(0, this.screenHeight(), 'background_part')
            .setOrigin(0, 1)
            .setScale(2)
            .setDepth(100);

        // Земля
        this.ground = this.add
            .image(0, this.screenHeight(), 'spacer')
            .setSize(this.screenWidth(), this.groundHeight)
            .setOrigin(0, 1)
            .setAlpha(0);

        // Через `physics.add.image` неправильно работают размер и origin.
        this.physics.add.existing(this.ground, true);

        // Рамбл
        this.player = this.physics.add
            .sprite(300, this.groundY(), 'rumble')
            .setOrigin(0.5, 1)
            .setScale(this.rumbleScale)
            .setOffset(this.rumbleBodyOffset, this.rumbleBodyOffset);
        this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, this.screenWidth(), this.groundY()));

        // Файербол
        this.fire = this.physics.add
            .sprite(0, 0, 'rumble', 'rumble_fire_00001')
            .setVisible(false)
            .setScale(this.rumbleScale)
            .setOffset(this.rumbleBodyOffset, this.rumbleBodyOffset)
            .setDebugBodyColor(0xff8888);

        this.updatePlayerBody();

        this.apple = this.physics.add.sprite(750, 500, 'apple').setScale(this.rumbleScale);
        window.apple = this.apple;

        this.createSimpleAnimation({ name: 'rumble_stance', end: 14, frameRate: this.frameRate(12) });
        this.createSimpleAnimation({ name: 'rumble_move', end: 14, frameRate: this.frameRate(14) });
        this.createSimpleAnimation({ name: 'rumble_uppercut', start: 3, end: 6, frameRate: this.frameRate(7) });
        this.createSimpleAnimation({ name: 'rumble_hooking', prefix: 'rumble_salto', start: 12, end: 14 });
        this.createSimpleAnimation({ name: 'rumble_damage', frameRate: this.frameRate(7) });
        this.createSimpleAnimation({ name: 'rumble_fallen', frameRate: this.frameRate(7) });
        this.createSimpleAnimation({ name: 'rumble_jump_kick', start: 1, end: 5 });
        this.createSimpleAnimation({ name: 'rumble_double_punch', start: 1, end: 9 });
        this.createSimpleAnimation({ name: 'rumble_low_punch', start: 1, end: 3 });
        this.createSimpleAnimation({ name: 'rumble_jumping_low_punch', start: 1, end: 3 });
        this.createSimpleAnimation({ name: 'rumble_block' });
        this.createSimpleAnimation({ name: 'rumble_squat' });
        this.createSimpleAnimation({ name: 'rumble_squat_block', start: 1, end: 1 });
        this.createSimpleAnimation({ name: 'rumble_fire', start: 1, end: 3, repeat: -1, frameRate: 10 });
        const punches = this.createAnimation({
            name: 'rumble_punches',
            parts: {
                left: { frames: [1, 2, 3] },
                right: { frames: [4, 5, 6, 7] },
                // fastRight: { frames: [5, 6, 7] },
                finishLeft: { frames: [1] },
            },
        });
        this.manekenAnims = this.createAnimation({
            name: 'maneken',
            parts: {
                stance: { frames: [1] },
                wtf: { frames: [2, 1], frameRate: 2 },
                throw: { frames: [3, 4, 1] },
            },
        });
        const fireball = this.createAnimation({
            name: 'rumble_fireball',
            parts: {
                before: { frames: [1, 2, 3, 4] },
                after: { start: 5, end: 10 },
            },
        });
        const salto = this.createAnimation({
            name: 'rumble_salto',
            parts: {
                prepare: { start: 1, end: 7 },
                onAir: { start: 8, end: 11 },
                finish: { start: 12, end: 17 },
            },
        });
        this.jumpAnimation = this.createAnimation({
            name: 'rumble_jump',
            parts: {
                start: { frames: [1], frameRate: this.frameRate(4) },
                up: { frames: [2], frameRate: this.frameRate(4) },
                down: { frames: [3, 4], frameRate: this.frameRate(14), repeat: -1 },
                landing: { frames: [5], frameRate: this.frameRate(14) },
            },
        });

        this.anims.create({
            key: 'bang',
            frames: this.anims.generateFrameNumbers('bang_word', { start: 0, end: 1 }),
            frameRate: this.frameRate(10),
            repeat: 0,
        });
        this.anims.create({
            key: 'bang2',
            frames: this.anims.generateFrameNumbers('bang2', { start: 0, end: 4 }),
            frameRate: this.frameRate(28),
            repeat: 0,
        });
        this.anims.create({
            key: 'pow',
            frames: this.anims.generateFrameNumbers('pow_word', { start: 0, end: 1 }),
            frameRate: this.frameRate(7),
            repeat: 0,
        });

        this.anims.create({
            key: 'angry',
            frames: this.anims.generateFrameNumbers('angry', { start: 0, end: 5 }),
            frameRate: this.frameRate(12),
            repeat: -1,
        });

        this.angry = this.add
            .sprite(0, 0, 'angry')
            .setOrigin(0, 1)
            .setDepth(1000)
            .setVisible(false);
        this.angry.setPosition(-this.angry.width, this.screenHeight() + this.angry.height);

        this.say = async (audio) => {
            this.angry.anims.stop();
            this.angry.setFrame(3);
            this.angry.setVisible(true);
            await this.tween(this.angry, {
                x: 0,
                y: this.screenHeight(),
                duration: 500,
                yoyo: false,
            });
            // this.sounds[audio].play({ volume: 0.5 });
            this.time.delayedCall(this.sounds[audio].duration * 1000, async () => {
                this.angry.anims.stop();
                this.angry.setFrame(3);
                await this.tween(this.angry, {
                    x: -this.angry.width,
                    y: this.screenHeight() + this.angry.height,
                    duration: 500,
                    yoyo: false,
                });
                this.angry.setVisible(false);
            });
            this.angry.anims.play('angry');
        };

        this.bangs2 = new BangGroup2(this.physics.world, this);
        this.bangs = new BangGroup(this.physics.world, this);
        this.pows = new PowGroup(this.physics.world, this);
        this.maneken = this.physics.add
            .sprite(1040, this.groundY(), 'rumble', 'maneken_00001')
            .setScale(this.rumbleScale);
        this.maneken.anims.play('stance');

        this.health = 100;
        this.add.rectangle(180, 30, 300, 16, 0xffffff);
        this.healthIndicator = this.add.rectangle(180, 30, 300, 16, 0xea6447);
        this.add.rectangle(180, 30, 300, 16, 0xffffff, 0).setStrokeStyle(2, 0x0a3730);
        this.add
            .image(20, 40, 'rumble_name')
            .setOrigin(0, 0)
            .setScale(2);

        this.pumpkins = new PumpkinGroup(this.physics.world, this);
        this.physics.add.overlap(this.pumpkins, this.ground, (p1, p2) => {
            const pumpkin = this.pumpkins.contains(p1) ? p1 : p2;
            const ground = this.pumpkins.contains(p1) ? p2 : p1;
            this.bangs2.createOne(pumpkin, ground);
            deactivate(pumpkin);
        });
        this.physics.add.overlap(this.pumpkins, this.fire, (p1, p2) => {
            const pumpkin = this.pumpkins.contains(p1) ? p1 : p2;
            const fire = this.pumpkins.contains(p1) ? p2 : p1;
            this.pows.createOne(pumpkin, fire);
            this.maneken.anims.play(this.manekenAnims.wtf);
            deactivate(pumpkin);
        });
        this.physics.add.overlap(this.pumpkins, this.player, async (player, pumpkin) => {
            const direction = pumpkin.x > player.x ? -1 : 1;
            if (this.strike) {
                this.pows.createOne(pumpkin, player);
                this.maneken.anims.play(this.manekenAnims.wtf);
                deactivate(pumpkin);
            } else {
                this.bangs.createOne(pumpkin, player);
                deactivate(pumpkin);
                this.health = Math.max(0, this.health - this.blockFactor() * this.pumpkinDamage);
                if (!this.health) {
                    await this.fall(direction);
                    this.gameOver();
                } else {
                    await this.damage(direction);
                }
            }
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.cameras.main.fadeIn(1000);

        this.salto = async () => {
            const inMoving = this.player.body.velocity.x;
            this.player.anims.stop();
            this.setStrike('salto');
            if (!inMoving) {
                await this.animatePlayer(salto.prepare);
            }
            await this.saltoInMoving();
        };

        this.saltoInMoving = async () => {
            await this.animatePlayer(salto.onAir);
            this.player.setVelocityX(0);
            this.shakeGround();
            if (this.queue.isEmpty()) {
                await this.animatePlayer(salto.finish);
            }
            this.setStrike(null);
        };

        this.punch = async () => {
            this.player.setVelocityX(0);
            if (this.prevStrike === 'punchRight' || this.time.now - this.prevPunchTime > 500) {
                this.strike = 'punchLeft';
                await this.animatePlayer(punches.left);
                if (this.queue.isEmpty()) {
                    await this.animatePlayer(punches.finishLeft);
                }
            } else {
                this.strike = 'punchRight';
                await this.animatePlayer(punches.right);
            }
            this.prevPunchTime = this.time.now;
            this.setStrike(null);
        };

        this.hooking = async () => {
            this.player.setVelocityX(0);
            this.setStrike('hooking');
            await this.animatePlayer('rumble_hooking');
            this.setStrike(null);
        };

        this.doublePunch = async () => {
            this.setStrike('doublePunch');
            if (!this.jumping) {
                this.player.setVelocityX(0);
            }
            await this.animatePlayer('rumble_double_punch');
            this.setStrike(null);
        };

        this.lowPunch = async () => {
            this.setStrike('lowPunch');
            if (!this.jumping) {
                this.player.setVelocityX(0);
            }
            await this.animatePlayer('rumble_low_punch');
            this.setStrike(null);
        };

        this.jumpingLowPunch = async () => {
            if (!this.jumping) {
                return;
            }
            this.setStrike('jumpingLowPunch');
            await this.animatePlayer('rumble_jumping_low_punch');
            this.setStrike(null);
        };

        this.uppercut = async () => {
            this.player.setVelocityX(0);
            this.setStrike('uppercut');
            this.player.anims.play('rumble_uppercut', true);
            await this.tweenPlayer({ duration: this.uppercutDuration, y: this.groundY() - this.uppercutHeight });
            this.setStrike(null);
        };

        this.fireball = async () => {
            this.player.setVelocityX(0);
            this.setStrike('fireball');
            await this.animatePlayer(fireball.before);
            const next = this.animatePlayer(fireball.after);
            this.fire.setPosition(this.player.x, this.player.y).setVisible(true);
            this.fire.setVelocity(1200, 0);
            this.fire.anims.play('rumble_fire', false);
            await next;
            this.setStrike(null);
        };

        this.jump = async () => {
            this.jumping = 'start';
            let jumpVelocity = 0;
            if (this.cursors.left.isDown) {
                jumpVelocity = -this.jumpVelocity;
            }
            if (this.cursors.right.isDown) {
                jumpVelocity = this.jumpVelocity;
            }
            this.player.setVelocityX(jumpVelocity);
            this.player.anims.play(this.jumpAnimation.start, true);
            this.player.once('animationcomplete', () => {
                this.jumping = 'up';
            });
            await this.tweenPlayer({ duration: this.jumpDuration, y: this.groundY() - this.jumpHeight, yoyo: false });
            this.jumping = 'down';
            await this.tweenPlayer({
                duration: this.jumpDuration,
                y: this.groundY(),
                yoyo: false,
                ease: 'Sine.easeIn',
            });
            this.player.setVelocityX(0);
            if (this.strike === 'doublePunch') {
                this.shakeGround();
            } else if (this.queue.isEmpty() && !this.inShock) {
                this.shakeGround(0.2);
                this.jumping = 'landing';
                await this.animatePlayer(this.jumpAnimation.landing);
            }
            this.jumping = false;
        };

        this.jumpKick = async () => {
            this.setStrike('jumpKick');
            await this.animatePlayer('rumble_jump_kick');
            this.setStrike(null);
        };

        this.damage = async (direction = 1) => {
            this.inShock = true;
            this.player.anims.stop();
            if (this.block) {
                // await this.animatePlayer('rumble_damage');
                await this.tweenPlayer({
                    duration: 100,
                    x: this.player.x + 20 * direction,
                    yoyo: false,
                });
            } else {
                this.player.setVelocityX(this.blockFactor() * this.damageVelocity * direction);
                await this.animatePlayer('rumble_damage');
                this.player.setVelocityX(0);
            }
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
            this.player.anims.play('rumble_damage');
            this.time.delayedCall(delay / 2, () => {
                this.player.anims.play('rumble_fallen');
            });
            this.tweenPlayer({
                duration: delay,
                x: this.player.x + direction * 200 * k,
                yoyo: false,
                ease: 'Linear',
            });
            await this.tweenPlayer({
                duration: delay,
                y: this.groundY() + 3 * this.player.scaleY,
                yoyo: false,
                // ease: 'Back.easeIn',
                ease: 'Linear',
            });
            this.shakeGround();
            this.inShock = false;
        };

        this.queue = new QueueManager(this);
        this.prevStrike = null;
        this.block = false;
        this.strike = null;
        this.jumping = null;
        this.gameIsOver = false;
        this.pumpkinTime = this.time.now;
    }

    async update() {
        if (this.gameIsOver) {
            return;
        }

        this.updatePlayerBody();

        if (this.time.now - this.pumpkinTime > this.pumpkinTreshold) {
            const rnd = Math.random();
            this.pumpkins.createOne(1040, 500, -1 * (400 + rnd * 1000), -1 * (0 + (1 - rnd) * 1000));
            this.pumpkinTime = this.time.now;
            this.maneken.anims.play(this.manekenAnims.throw);
        }

        this.healthIndicator.setSize(this.health * 3, 16);

        if (this.inShock) {
            return;
        }

        // Прыжок
        if (!this.jumping && !this.strike && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jump();
        }

        // Кулаком вниз
        if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
            const lowPunch = this.jumping ? this.jumpingLowPunch : this.lowPunch;
            if (this.strike) {
                this.queue.add(lowPunch);
            } else {
                lowPunch();
            }
        }

        // Файербол!
        if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
            if (this.jumping || this.strike) {
                this.queue.add(this.fireball);
            } else {
                this.fireball();
            }
        }

        // Прямые правой/левой и апперкот
        if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
            if (this.cursors.down.isDown) {
                if (this.strike) {
                    this.queue.add(this.uppercut);
                } else {
                    this.uppercut();
                }
            } else if (this.jumping || this.strike) {
                this.queue.add(this.punch);
            } else {
                this.punch();
            }
        }

        // Сальто/подсечка
        if (!this.jumping && Phaser.Input.Keyboard.JustDown(this.keyS)) {
            if (!this.strike && this.cursors.down.isDown) {
                this.hooking();
            } else if (this.strike) {
                this.queue.add(this.salto);
            } else {
                this.salto();
            }
        }

        // Удар двумя руками
        if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
            if (this.strike) {
                this.queue.add(this.doublePunch);
            } else {
                this.doublePunch();
            }
        }

        // В воздухе
        if (this.jumping) {
            // Бить ногой можно,когда летишь вверх или когда летишь вниз, но достаточно высоко
            if (
                Phaser.Input.Keyboard.JustDown(this.keyS) &&
                (this.jumping === 'start' || this.jumping === 'up' || this.player.y < this.groundY() * 0.6)
            ) {
                this.jumpKick();
            } else if (!this.strike) {
                if (this.jumping === 'up') {
                    this.player.anims.play(this.jumpAnimation.up, true);
                } else if (this.jumping === 'down') {
                    this.player.anims.play(this.jumpAnimation.down, true);
                }
            }
        }

        if (!this.strike) {
            // Поворот
            if (this.cursors.left.isDown) {
                this.player.flipX = true;
            } else if (this.cursors.right.isDown) {
                this.player.flipX = false;
            }

            if (!this.jumping) {
                if (
                    Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
                    Phaser.Input.Keyboard.JustDown(this.cursors.right)
                ) {
                    this.queue.clear();
                }

                // Блок
                this.block = this.keySpace.isDown;
                if (this.block) {
                    this.queue.clear();
                    this.player.setVelocityX(0);
                    if (this.cursors.down.isDown) {
                        this.player.anims.play('rumble_squat_block', true);
                    } else {
                        this.player.anims.play('rumble_block', true);
                    }
                } else if (this.cursors.down.isDown) {
                    this.queue.clear();
                    this.player.setVelocityX(0);
                    this.player.anims.play('rumble_squat', true);
                } else if (this.queue.isEmpty() && this.cursors.left.isDown) {
                    this.player.setVelocityX(-this.velocityStep);
                    this.player.anims.play('rumble_move', true);
                } else if (this.queue.isEmpty() && this.cursors.right.isDown) {
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

    shakeGround = (power = 0.5) => {
        this.cameras.main.shake(400 * power, 0.01 * power, true);
    };

    setStrike = (strike) => {
        if (strike !== this.strike) {
            this.prevStrike = this.strike;
            this.strike = strike;
        }
    };

    blockFactor() {
        return this.block ? 0.2 : 1;
    }

    animatePlayer = (animationName) => this.animate(this.player, animationName);

    tweenPlayer = (tweenParams) => this.tween(this.player, tweenParams);

    animate = (gameObject, animationName) => {
        return new Promise((resolve) => {
            gameObject.anims.stop();
            gameObject.once('animationcomplete', () => {
                resolve();
            });
            gameObject.anims.play(animationName, true);
        });
    };

    tween = (gameObject, tweenParams) => {
        return new Promise((resolve) => {
            this.activeTween = this.tweens.add({
                targets: gameObject,
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

    // Приводит body к размеру фрейма, автоматом ставится только размер gameObject.
    updatePlayerBody = () => {
        this.player.body.setSize(
            this.player.frame.realWidth - 2 * this.rumbleBodyOffset,
            this.player.frame.realHeight - 2 * this.rumbleBodyOffset,
            false
        );
        if (this.fire.visible) {
            this.fire.body.setSize(
                this.fire.frame.realWidth - 2 * this.rumbleBodyOffset,
                this.fire.frame.realHeight - 2 * this.rumbleBodyOffset,
                false
            );
        }
    };

    gameOver = async () => {
        this.gameIsOver = true;
        this.add
            .image(640, 260, 'game_over')
            .setScale(8)
            .setInteractive();

        this.time.delayedCall(this.gameOverDelay, () => {
            this.add.image(640, 360, 'continue').setScale(6);
            this.input.once('pointerdown', () => {
                this.scene.restart();
            });
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.restart();
            });
        });
    };

    setTimeScale(timeScale = 1) {
        this.timeScale = timeScale;
        this.tweens.timeScale = timeScale;
        this.physics.world.timeScale = 1 / timeScale; // o_O
        this.time.timeScale = timeScale;
    }

    frameRate(frameRate) {
        return (frameRate || this.strikeFrameRate) * this.timeScale;
    }

    screenWidth() {
        return this.cameras.main.width;
    }

    screenCenterX() {
        return this.cameras.main.centerX;
    }

    screenHeight() {
        return this.cameras.main.height;
    }

    groundY() {
        return this.screenHeight() - this.groundHeight;
    }

    /**
     * Создание анимации из текстуры по префиксу фреймов.
     * @param {Object} params
     * @param {String} params.texture
     * @param {String} params.name Имя анимации
     * @param {String} [params.prefix] Префикс имени фрейма в текстуре, по умолчанию `name`
     * @param {Array<Number>} [params.frames] Массив индексов фреймов
     * @param {Number} [params.start = 1] Первый фрейм
     * @param {Number} [params.end = 1] Последний фрейм
     */
    createSimpleAnimation({ texture = 'rumble', name, prefix, frames, start = 1, end = 1, ...animationParams }) {
        this.anims.create({
            key: name,
            frames: this.anims.generateFrameNames(texture, {
                prefix: `${prefix || name}_`,
                zeroPad: 5,
                frames,
                start,
                end,
            }),
            frameRate: this.frameRate(),
            repeat: 0,
            ...animationParams,
        });
    }

    /**
     * Создание анимации из нескольких частей по префиксу фреймов.
     * @param {Object} params
     * @param {String} params.name Имя анимации
     * @param {String} [params.prefix] Имя фрейма в текстуре, по умолчанию `name`
     * @param {Object<Array<[Number, Number]>>} [params.parts] = { all: [1, 1] } Начальный и конечный фреймы частей анимации
     * @returns {Object<String>} Маппинг {partName: fullName}
     * @example
     *     const salto = createAnimation({
     *         name: 'salto',
     *         parts: {
     *             prepare: { start: 1, end: 7 },
     *             onAir: { frames: [8, 9, 10, 11] },
     *             finish: { start: 12, end: 17 },
     *         },
     *     });
     *     salto.prepare === 'salto_prepare' // фреймы с salto_00001 по salto_00007
     *     salto.onAir === 'salto_onAir'     // фреймы с salto_00008 по salto_00011
     *     salto.finish === 'salto_finish'   // фреймы с salto_00012 по salto_00017
     * @example
     *     const renamed = createAnimation({
     *         name: 'renamed',
     *         prefix: 'punch',
     *         parts: { all: { start: 1, end: 4 } },
     *     });
     *     renamed.all === 'renamed_all'     // фреймы с punch_00001 по punch_00004
     */
    createAnimation({ name, prefix, parts = {}, ...animationParams }) {
        return Object.entries(parts).reduce((result, [partName, part]) => {
            result[partName] = `${name}_${partName}`;
            this.createSimpleAnimation({
                name: result[partName],
                prefix: prefix || name,
                ...animationParams,
                ...part,
            });
            return result;
        }, {});
    }
}
