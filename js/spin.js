/**
 * 球的旋转系统
 */
class SpinSystem {
    constructor() {
        this.reset();
    }

    /**
     * 重置旋转状态
     */
    reset() {
        this.active = false;
        this.spinX = 0;  // 横向旋转
        this.spinY = 0;  // 纵向旋转
        this.power = 0;  // 旋转力度
    }

    /**
     * 将旋转效果应用到球上
     * @param {Ball} ball - 目标球
     */
    applySpinToBall(ball) {
        if (!this.active) return;

        // 应用旋转效果到球的速度
        ball.velocityX += this.spinX * this.power;
        ball.velocityY += this.spinY * this.power;

        // 重置旋转状态
        this.reset();
    }

    /**
     * 设置旋转参数
     * @param {number} x - 横向旋转量 (-1 到 1)
     * @param {number} y - 纵向旋转量 (-1 到 1)
     * @param {number} power - 旋转力度 (0 到 1)
     */
    setSpin(x, y, power) {
        this.active = true;
        this.spinX = Math.max(-1, Math.min(1, x));
        this.spinY = Math.max(-1, Math.min(1, y));
        this.power = Math.max(0, Math.min(1, power));
    }
} 