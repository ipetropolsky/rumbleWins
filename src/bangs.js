import Phaser from 'phaser';

import AutoGroup from 'src/autoGroup';
import { BULLET } from 'src/layers';
import { activate, deactivate } from 'src/utils';

class Bang extends Phaser.Physics.Arcade.Image {
    scale = 1.5;

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture || 'bang_word');
    }

    put(x, y, vx, vy) {
        activate(this, x, y, vx, vy);
        this.setDrag(3000, 1500);
        this.setScale(0.1);
        this.scene.tweens.add({
            targets: this,
            ease: 'Bounce.easeOut',
            scaleX: this.scale,
            scaleY: this.scale,
            repeat: 0,
            duration: 300,
            onComplete: async () => {
                deactivate(this);
            },
        });
    }
}

export default class BangGroup extends AutoGroup {
    classType = Bang;
    depth = BULLET;

    createOne(gameObject1, gameObject2) {
        const bang = this.get();
        bang.put(
            (gameObject1.x + gameObject2.x) / 2,
            gameObject1.y,
            (gameObject1.body.velocity.x + gameObject2.body.velocity.x) / 2,
            (gameObject1.body.velocity.y + gameObject2.body.velocity.y) / 2
        );
        return bang;
    }
}

class Pow extends Bang {
    scale = 1;

    constructor(scene, x, y) {
        super(scene, x, y, 'pow_word');
    }
}

export class PowGroup extends BangGroup {
    classType = Pow;
}
