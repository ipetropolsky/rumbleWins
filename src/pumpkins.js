import Phaser from 'phaser';

import AutoGroup from 'src/autoGroup';
import { BULLET } from 'src/layers';
import { activate } from 'src/utils';

class Pumpkin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'pumpkin');
    }

    put(x, y, vx, vy) {
        activate(this, x, y, vx, vy);
        this.setGravity(0, 1000);
        this.setMass(10);
        this.setDrag(100, 100);
        this.setBounce(0.4, 0.4);
        this.setFriction(1, 1);
        this.setScale(2);
    }
}

export default class PumpkinGroup extends AutoGroup {
    classType = Pumpkin;
    depth = BULLET;

    createOne(x, y, vx, vy) {
        const pumpkin = this.get();
        pumpkin.put(x, y, vx, vy);
        return pumpkin;
    }
}
