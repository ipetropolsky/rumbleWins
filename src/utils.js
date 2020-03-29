export const activate = (gameObject, x, y, vx, vy) => {
    gameObject.enableBody(true, x, y, true, true);
    gameObject.body.setVelocity(vx, vy);
    gameObject.onActivate && gameObject.onActivate();
};

export const deactivate = (gameObject) => {
    if (gameObject.active) {
        gameObject.disableBody(true, true);
        gameObject.onDeactivate && gameObject.onDeactivate();
    }
};

const WORLD_PADDING = 100;
export const outOfScreen = (gameObject) => {
    if (gameObject.outOfScreen) {
        return gameObject.outOfScreen();
    }
    return (
        gameObject.x + gameObject.displayWidth / 2 < -WORLD_PADDING ||
        gameObject.x - gameObject.displayWidth / 2 > gameObject.scene.game.config.width + WORLD_PADDING ||
        // gameObject.y + gameObject.displayHeight / 2 < -WORLD_PADDING ||
        gameObject.y - gameObject.displayHeight / 2 > gameObject.scene.game.config.height + WORLD_PADDING
    );
};

export const updateMembers = (group) => {
    group.getChildren().forEach((member) => {
        if (member.active && outOfScreen(member)) {
            group.onDeactivate && group.onDeactivate(member);
            deactivate(member);
        }
    });
};

export const leadTo = (targetValue, value, step) => {
    if (value > targetValue) {
        return Math.max(value - step, targetValue);
    }
    return Math.min(value + step, targetValue);
};
