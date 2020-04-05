import Phaser from 'phaser';
import 'regenerator-runtime/runtime';
import SceneMain from 'src/scenes/main';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    title: 'Rumble Wins',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            // debug: true,
        },
    },
    pixelArt: true,
    roundPixels: true,
    scene: [SceneMain],
};

// eslint-disable-next-line no-unused-vars
new Phaser.Game(config);
