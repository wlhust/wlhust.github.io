/**
 * 球路预测功能
 */

/**
 * 计算预测球路径
 * @param {Ball} ball - 要预测路径的球
 * @param {number} angle - 击球角度
 * @param {number} power - 击球力度
 * @returns {Array} - 预测路径点数组
 */
function calculatePredictedPath(ball, angle, power) {
    // 创建一个虚拟球来模拟路径
    const virtualBall = {
        x: ball.x,
        y: ball.y,
        velocityX: Math.cos(angle) * power,
        velocityY: Math.sin(angle) * power,
        radius: BALL_RADIUS
    };
    
    const path = [{x: virtualBall.x, y: virtualBall.y}];
    const maxPoints = 10; // 最大预测点数
    const friction = 0.98; // 简化的摩擦系数
    
    // 模拟球的运动
    for (let i = 0; i < maxPoints; i++) {
        // 更新位置
        virtualBall.x += virtualBall.velocityX;
        virtualBall.y += virtualBall.velocityY;
        
        // 应用摩擦力
        virtualBall.velocityX *= friction;
        virtualBall.velocityY *= friction;
        
        // 检查边界碰撞
        if (virtualBall.x - BALL_RADIUS <= TABLE_LEFT || virtualBall.x + BALL_RADIUS >= TABLE_RIGHT) {
            virtualBall.velocityX *= -0.8;
            // 如果已经碰撞过边界，就不再继续预测
            if (i > 0) break;
        }
        if (virtualBall.y - BALL_RADIUS <= TABLE_TOP || virtualBall.y + BALL_RADIUS >= TABLE_BOTTOM) {
            virtualBall.velocityY *= -0.8;
            // 如果已经碰撞过边界，就不再继续预测
            if (i > 0) break;
        }
        
        // 确保球不会超出边界
        virtualBall.x = Math.max(TABLE_LEFT + BALL_RADIUS, Math.min(virtualBall.x, TABLE_RIGHT - BALL_RADIUS));
        virtualBall.y = Math.max(TABLE_TOP + BALL_RADIUS, Math.min(virtualBall.y, TABLE_BOTTOM - BALL_RADIUS));
        
        // 添加路径点
        path.push({x: virtualBall.x, y: virtualBall.y});
        
        // 如果速度太小，停止预测
        if (Math.abs(virtualBall.velocityX) < 0.5 && Math.abs(virtualBall.velocityY) < 0.5) {
            break;
        }
    }
    
    return path;
}