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
        this.velocityStep = 400;
        this.damageVelocity = 300;
        this.jumpVelocity = 600;
        this.jumpDuration = 400;
        this.uppercutDuration = 300;
        this.jumpTopY = 150;
        this.groundHeight = 50;
        this.strikeFrameRate = 14;
        this.mp3s = [
            'did_you_do_a_homework_2', //
            'did_you_do_a_homework', //
            'it_does_not_matter',
            'what_is_your_favorite_game', //
            'does_game_have_fighters',
            'father_need_to_work', //
            'does_your_father_have_a_power', //
            'do_you_have_dinner', //
            'good_news',
            'give_me_a_sandwitch', //
            'go_to_ussr', //
            // 'give_me_a_sandwitch_2',
            // 'do_you_have_dinner_2',
        ];
        this.currentSound = 0;
        this.gameOvers = 0;

        const modifier = 5;
        this.soundOnGameOvers = [5, 6, 10, 13, 17, 18, 25, 28].map((v) => v + modifier);
        this.doubleSoundOnGameOvers = [6, 10, 13].map((v) => v + modifier);
    }

    preload() {
        this.load.image('background', 'src/assets/background.jpg');
        this.load.atlas('rumble', 'src/assets/rumble.png', 'src/assets/rumble.json');
        this.load.image('spacer', 'src/assets/spacer_white.gif');
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

        this.mp3s.forEach((fileName) => {
            this.load.audio(fileName, `src/assets/mp3/${fileName}.mp3`, {
                instances: 1,
            });
        });
    }

    create() {
        // Фон
        this.add
            .image(this.screenWidth() / 2, this.screenHeight(), 'background')
            .setOrigin(0.5, 1)
            .setScale(1);

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
            .sprite(300, this.groundY() - 1, 'rumble')
            .setOrigin(0, 1)
            .setScale(2);
        // .setCollideWorldBounds(true);
        this.player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, this.screenWidth(), this.groundY()));
        this.updatePlayerBody();

        this.maneken = this.physics.add.sprite(1040, 550, 'maneken').setScale(2);
        this.apple = this.physics.add.sprite(750, 500, 'apple').setScale(2);

        this.createSimpleAnimation({ name: 'rumble_stance', end: 14, frameRate: 12 });
        this.createSimpleAnimation({ name: 'rumble_move', end: 14 });
        this.createSimpleAnimation({ name: 'rumble_uppercut', start: 3, end: 6, frameRate: 7 });
        this.createSimpleAnimation({ name: 'rumble_hooking', prefix: 'rumble_salto', start: 12, end: 14 });
        this.createSimpleAnimation({ name: 'rumble_squat' });
        this.createSimpleAnimation({ name: 'rumble_damage', frameRate: 7 });
        this.createSimpleAnimation({ name: 'rumble_fallen', frameRate: 7 });
        this.createSimpleAnimation({ name: 'rumble_jump_kick', start: 1, end: 5 });
        const punches = this.createAnimation({
            name: 'rumble_punches',
            parts: {
                left: { frames: [1, 2, 3] },
                right: { frames: [4, 5, 6, 7] },
                // fastRight: { frames: [5, 6, 7] },
                finishLeft: { frames: [1] },
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
                start: { frames: [1], frameRate: 4 },
                up: { frames: [2] },
                down: { frames: [3, 4], repeat: -1 },
                landing: { frames: [5] },
            },
        });

        this.anims.create({
            key: 'bang',
            frames: this.anims.generateFrameNumbers('bang_word', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: 0,
        });
        this.anims.create({
            key: 'bang2',
            frames: this.anims.generateFrameNumbers('bang2', { start: 0, end: 4 }),
            frameRate: 28,
            repeat: 0,
        });
        this.anims.create({
            key: 'pow',
            frames: this.anims.generateFrameNumbers('pow_word', { start: 0, end: 1 }),
            frameRate: 7,
            repeat: 0,
        });

        this.sounds = {};
        this.mp3s.forEach((name) => {
            this.sounds[name] = this.sound.add(name);
        });

        this.anims.create({
            key: 'angry',
            frames: this.anims.generateFrameNumbers('angry', { start: 0, end: 5 }),
            frameRate: 12,
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
            this.sounds[audio].play({ volume: 0.5 });
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

        // if (!this.gameOvers) {
        //     this.time.delayedCall(Math.random() * 5000, () => {
        //         this.say('go_to_ussr');
        //     });
        // }

        this.bangs2 = new BangGroup2(this.physics.world, this);
        this.bangs = new BangGroup(this.physics.world, this);
        this.pows = new PowGroup(this.physics.world, this);

        this.health = 100;
        this.add.rectangle(180, 30, 300, 16, 0xffffff);
        this.healthIndicator = this.add.rectangle(180, 30, 300, 16, 0xea6447);
        this.add.rectangle(180, 30, 300, 16, 0xffffff, 0).setStrokeStyle(2, 0x0a3730);

        this.pumpkins = new PumpkinGroup(this.physics.world, this);
        this.physics.add.overlap(this.pumpkins, this.ground, (p1, p2) => {
            const pumpkin = this.pumpkins.contains(p1) ? p1 : p2;
            const ground = this.pumpkins.contains(p1) ? p2 : p1;
            this.bangs2.createOne(pumpkin, ground);
            deactivate(pumpkin);
        });
        this.physics.add.overlap(this.pumpkins, this.player, async (player, pumpkin) => {
            const direction = pumpkin.x > player.x ? -1 : 1;
            if (this.strike) {
                this.pows.createOne(pumpkin, player);
                deactivate(pumpkin);
            } else {
                this.bangs.createOne(pumpkin, player);
                deactivate(pumpkin);
                this.health = Math.max(0, this.health - 15);
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

        this.uppercut = async () => {
            this.player.setVelocityX(0);
            this.setStrike('uppercut');
            this.player.anims.play('rumble_uppercut', true);
            await this.tweenPlayer({ duration: this.uppercutDuration, y: this.jumpTopY + 100 });
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
            await this.tweenPlayer({ duration: this.jumpDuration, y: this.jumpTopY, yoyo: false });
            this.jumping = 'down';
            await this.tweenPlayer({
                duration: this.jumpDuration,
                y: this.groundY(),
                yoyo: false,
                ease: 'Sine.easeIn',
            });
            this.player.setVelocityX(0);
            if (this.queue.isEmpty() && !this.inShock) {
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
        this.strike = null;
        this.jumping = null;
        this.gameIsOver = false;
    }

    async update() {
        if (this.gameIsOver) {
            return;
        }

        this.updatePlayerBody();

        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            const rnd = Math.random();
            this.pumpkins.createOne(1040, 500, -1 * (300 + rnd * 1000), -1 * (0 + (1 - rnd) * 1000));
        }

        this.healthIndicator.setSize(this.health * 3, 16);

        if (this.inShock) {
            return;
        }

        // Прыжок
        if (!this.jumping && !this.strike && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jump();
        }

        // Прямые правой/левой и апперкот
        if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
            if (this.cursors.down.isDown) {
                if (this.strike) {
                    this.queue.add(this.uppercut);
                } else {
                    this.uppercut();
                }
            } else if (this.jumping) {
                this.queue.add(this.punchFast);
            } else if (this.strike) {
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

                // Движение
                if (this.cursors.down.isDown) {
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

    shakeGround = () => {
        this.cameras.main.shake(200, 0.005, true);
    };

    setStrike = (strike) => {
        if (strike !== this.strike) {
            this.prevStrike = this.strike;
            this.strike = strike;
        }
    };

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
        this.player.body.setSize(this.player.frame.realWidth - 20, this.player.frame.realHeight - 20, true);
        this.player.body.setOffset(10, 10);
    };

    gameOver = async () => {
        this.gameOvers += 1;
        this.gameIsOver = true;
        this.add
            .image(640, 260, 'game_over')
            .setScale(8)
            .setInteractive();

        let delay = 1000;
        if (this.soundOnGameOvers.includes(this.gameOvers)) {
            delay = 5000;
            this.time.delayedCall(1000, () => {
                this.say(this.mp3s[this.currentSound]);
                this.currentSound += 1;
            });
        }
        if (this.doubleSoundOnGameOvers.includes(this.gameOvers)) {
            delay = 8000;
            this.time.delayedCall(6000, () => {
                this.say(this.mp3s[this.currentSound]);
                this.currentSound += 1;
            });
        }
        this.time.delayedCall(delay, () => {
            this.add
                .image(640, 360, 'continue')
                .setScale(6)
                .setInteractive();
            this.input.once('pointerdown', () => {
                this.scene.restart();
            });
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.restart();
            });
        });
    };

    screenWidth() {
        return this.sys.scale.width;
    }

    screenHeight() {
        return this.sys.scale.height;
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
            frameRate: this.strikeFrameRate,
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
