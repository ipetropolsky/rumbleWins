import Phaser from 'phaser';

const QueueManager = (scene) => {
    let queue = [];
    const isActual = (task) => {
        return scene.time.now - task.time < 2000;
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
        this.queue = new QueueManager(this);
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
    }

    create() {
        const strikeFrameRate = 14;
        this.add.image(640, 360, 'background').setScale(1);
        this.player = this.physics.add.sprite(640, 500, 'rumble_stance').setScale(3);
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
        this.player.anims.play('rumble_stance', true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.strikeInProgress = false;
        this.cameras.main.fadeIn(1000);

        this.salto = async () => {
            const inMoving = this.player.body.velocity.x;
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            this.player.y -= 45;
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
            this.player.y += 45;
        };

        this.punchLeft = async () => {
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            await this.animatePlayer('rumble_punch_left');
            if (this.queue.isEmpty()) {
                await this.animatePlayer('rumble_punch_left_return');
            }
            this.strikeInProgress = false;
        };

        this.punchRight = async () => {
            this.player.setVelocityX(0);
            this.player.anims.stop();
            this.strikeInProgress = true;
            await this.animatePlayer('rumble_punch_right');
            if (this.queue.isEmpty()) {
                await this.animatePlayer('rumble_punch_right_return');
            }
            this.strikeInProgress = false;
        };
    }

    async update() {
        // Прямой в челюсть слева
        if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
            if (this.strikeInProgress) {
                this.queue.add(this.punchLeft);
            } else {
                this.punchLeft();
            }
        }

        // Прямой в челюсть справа
        if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
            if (this.strikeInProgress) {
                this.queue.add(this.punchRight);
            } else {
                this.punchRight();
            }
        }

        // Сальто
        if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
            if (this.strikeInProgress) {
                this.queue.add(this.salto);
            } else {
                this.salto();
            }
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
}
