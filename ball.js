/**
 * 球类实现
 */
class Ball {
    constructor(x, y, color, isCue = false, number = null) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isCue = isCue;
        this.velocityX = 0;
        this.velocityY = 0;
        this.inMotion = false;
        this.number = number;
        this.pocketed = false;
        
        // 旋转相关属性
        this.angularVelocity = 0;  // 角速度
        this.hitPointY = 0;  // 击打点Y偏移
        this.spinEffect = 0;  // 旋转效果系数
        this.mass = 0.165;  // 球质量(kg)
        this.maxTorque = 5.4;  // 最大扭矩系数增加到原来的2倍(N·m)
        this.slidingFriction = SLIDING_FRICTION;  // 滑动摩擦系数
        this.rollingFriction = ROLLING_FRICTION;  // 滚动摩擦系数
    }
    
    /**
     * 移动球体并应用物理效果
     */
    move() {
        // 如果速度很小，停止球的运动
        if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) {
            this.velocityX = 0;
            this.velocityY = 0;
            this.inMotion = false;
            this.angularVelocity = 0;  // 停止时重置角速度
            return;
        }
        
        // 计算总速度
        const velocity = Math.sqrt(this.velocityX**2 + this.velocityY**2);
        
        // 应用旋转效果
        if (this.isCue && Math.abs(this.angularVelocity) > 0) {
            // 上旋效果：增加前进速度
            if (this.angularVelocity > 0) {
                const speedBoost = 0.4 * Math.abs(this.angularVelocity);  // 增加到40%速度提升
                this.velocityX *= (1 + speedBoost);
                this.velocityY *= (1 + speedBoost);
            }
            // 下旋效果：产生回拉
            else if (this.angularVelocity < 0 && velocity < 4) {  // 增加回拉速度阈值
                this.velocityX *= -0.5;  // 增加回拉效果
                this.velocityY *= -0.5;
            }
        }
        
        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // 应用摩擦力和角速度衰减
        const friction = Math.abs(this.angularVelocity) > 0 ? this.slidingFriction : this.rollingFriction;
        this.velocityX *= (1 - friction);
        this.velocityY *= (1 - friction);
        this.angularVelocity *= 0.98;  // 角速度衰减
        
        // 边界碰撞检测
        if (this.x - BALL_RADIUS <= TABLE_LEFT || this.x + BALL_RADIUS >= TABLE_RIGHT) {
            this.velocityX *= -0.8;
            playSound(SOUND_TYPES.WALL_HIT);
        }
        if (this.y - BALL_RADIUS <= TABLE_TOP || this.y + BALL_RADIUS >= TABLE_BOTTOM) {
            this.velocityY *= -0.8;
            playSound(SOUND_TYPES.WALL_HIT);
        }
        
        // 确保球不会卡在边界
        this.x = Math.max(TABLE_LEFT + BALL_RADIUS, Math.min(this.x, TABLE_RIGHT - BALL_RADIUS));
        this.y = Math.max(TABLE_TOP + BALL_RADIUS, Math.min(this.y, TABLE_BOTTOM - BALL_RADIUS));
    }
    
    /**
     * 绘制球体
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        if (this.pocketed) return;
        
        // 绘制球体阴影
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
        ctx.fill();
        
        // 绘制球体
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 为球添加高光效果
        const highlightX = this.x - BALL_RADIUS/2;
        const highlightY = this.y - BALL_RADIUS/2;
        const highlightRadius = BALL_RADIUS/3;
        
        const gradient = ctx.createRadialGradient(
            highlightX, highlightY, 0,
            highlightX, highlightY, highlightRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        if (this.isCue) {
            // 为母球添加特殊标记
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_RADIUS - 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgb(200, 200, 200)';
            ctx.fill();
        } else if (this.number !== null) {
            // 为有编号的球绘制数字
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 根据球的颜色选择文字颜色
            const isDarkBall = this.color === BLACK || this.color === BLUE;
            ctx.fillStyle = isDarkBall ? WHITE : BLACK;
            
            ctx.fillText(this.number.toString(), this.x, this.y);
        }
        
        // 如果是母球且有旋转，绘制旋转效果指示器
        if (this.isCue && Math.abs(this.angularVelocity) > 0.1) {
            const spinColor = this.angularVelocity > 0 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            const spinRadius = 5 + Math.abs(this.angularVelocity) * 10;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, spinRadius, 0, Math.PI * 2);
            ctx.fillStyle = spinColor;
            ctx.fill();
        }
    }
}

/**
 * 检测两个球之间的碰撞并处理
 * @param {Ball} ball1 - 第一个球
 * @param {Ball} ball2 - 第二个球
 */
function checkCollision(ball1, ball2) {
    if (ball1.pocketed || ball2.pocketed) return;
    
    // 计算两球中心连线向量（法线方向）
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // 基本碰撞检测
    if (distance < BALL_RADIUS * 2) {
        // 计算法线单位向量（从ball1指向ball2）
        let nx, ny;
        if (distance > 0) {  // 避免除以零
            nx = dx / distance;
            ny = dy / distance;
        } else {
            nx = 1;
            ny = 0;  // 如果两球中心重合，选择任意方向作为法线
        }
        
        // 计算切线单位向量（垂直于法线）
        const tx = -ny;
        const ty = nx;
        
        // 计算球1在法线和切线方向的速度分量
        const v1n = ball1.velocityX * nx + ball1.velocityY * ny;  // 法线分量
        const v1t = ball1.velocityX * tx + ball1.velocityY * ty;  // 切线分量
        
        // 计算球2在法线和切线方向的速度分量
        const v2n = ball2.velocityX * nx + ball2.velocityY * ny;  // 法线分量
        const v2t = ball2.velocityX * tx + ball2.velocityY * ty;  // 切线分量
        
        // 质量参数（虽然台球质量相同，但保留参数使模型更通用）
        const m1 = 1.0;
        const m2 = 1.0;
        
        // 应用动量守恒和能量守恒（带弹性系数）计算碰撞后的法线速度
        // 弹性系数为0.95（轻微能量损失）
        const e = ELASTICITY;
        
        // 计算碰撞后的法线速度（仅法线方向交换动量）
        const v1n_final = (v1n * (m1 - e * m2) + m2 * (1 + e) * v2n) / (m1 + m2);
        const v2n_final = (v2n * (m2 - e * m1) + m1 * (1 + e) * v1n) / (m1 + m2);
        
        // 切线方向速度保持不变
        const v1t_final = v1t;
        const v2t_final = v2t;
        
        // 将法线和切线速度分量转换回x和y分量
        ball1.velocityX = v1n_final * nx + v1t_final * tx;
        ball1.velocityY = v1n_final * ny + v1t_final * ty;
        ball2.velocityX = v2n_final * nx + v2t_final * tx;
        ball2.velocityY = v2n_final * ny + v2t_final * ty;
        
        // 防止球体重叠（将球体分开）
        const overlap = 2 * BALL_RADIUS - distance;
        ball2.x += overlap * nx * 0.5;
        ball2.y += overlap * ny * 0.5;
        ball1.x -= overlap * nx * 0.5;
        ball1.y -= overlap * ny * 0.5;
        
        ball1.inMotion = true;
        ball2.inMotion = true;
        
        playSound(SOUND_TYPES.BALL_HIT);
    } else {
        // 基于运动轨迹的碰撞预测
        // 计算相对速度
        const vx = ball2.velocityX - ball1.velocityX;
        const vy = ball2.velocityY - ball1.velocityY;
        
        // 计算相对位置和速度的点积
        const dotProduct = dx * vx + dy * vy;
        
        // 如果点积为正，球体正在远离而非接近
        if (dotProduct >= 0) return;
        
        // 计算判别式 b^2-4ac，用于求解二次方程
        // 二次方程：|p + vt|^2 = 4R^2，其中p是相对位置，v是相对速度，R是球半径
        const a = vx * vx + vy * vy;
        const b = 2 * (dx * vx + dy * vy);
        const c = dx * dx + dy * dy - 4 * BALL_RADIUS * BALL_RADIUS;
        
        const discriminant = b * b - 4 * a * c;
        
        // 如果判别式小于0，没有实数解，不会发生碰撞
        if (discriminant < 0 || a < 0.0001) return;  // a接近0意味着相对速度几乎为0
        
        // 计算碰撞时间（取较小的正值解）
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        
        // 如果t为负数或太大，不考虑碰撞
        if (t < 0 || t > 1.0) return;  // 限制预测时间范围
        
        // 预测碰撞点
        const collision_x1 = ball1.x + ball1.velocityX * t;
        const collision_y1 = ball1.y + ball1.velocityY * t;
        const collision_x2 = ball2.x + ball2.velocityX * t;
        const collision_y2 = ball2.y + ball2.velocityY * t;
        
        // 更新球的位置到碰撞点
        ball1.x = collision_x1;
        ball1.y = collision_y1;
        ball2.x = collision_x2;
        ball2.y = collision_y2;
        
        // 重新计算法线方向（基于碰撞点）
        const new_dx = collision_x2 - collision_x1;
        const new_dy = collision_y2 - collision_y1;
        const new_distance = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
        
        // 计算法线单位向量
        let nx, ny;
        if (new_distance > 0) {
            nx = new_dx / new_distance;
            ny = new_dy / new_distance;
        } else {
            nx = 1;
            ny = 0;
        }
        
        // 计算切线单位向量
        const tx = -ny;
        const ty = nx;
        
        // 计算速度分量
        const v1n = ball1.velocityX * nx + ball1.velocityY * ny;
        const v1t = ball1.velocityX * tx + ball1.velocityY * ty;
        const v2n = ball2.velocityX * nx + ball2.velocityY * ny;
        const v2t = ball2.velocityX * tx + ball2.velocityY * ty;
        
        // 质量参数
        const m1 = 1.0;
        const m2 = 1.0;
        
        // 弹性系数
        const e = ELASTICITY;
        
        // 计算碰撞后的法线速度
        const v1n_final = (v1n * (m1 - e * m2) + m2 * (1 + e) * v2n) / (m1 + m2);
        const v2n_final = (v2n * (m2 - e * m1) + m1 * (1 + e) * v1n) / (m1 + m2);
        
        // 切线方向速度保持不变
        const v1t_final = v1t;
        const v2t_final = v2t;
        
        // 将速度分量转换回x和y分量
        ball1.velocityX = v1n_final * nx + v1t_final * tx;
        ball1.velocityY = v1n_final * ny + v1t_final * ty;
        ball2.velocityX = v2n_final * nx + v2t_final * tx;
        ball2.velocityY = v2n_final * ny + v2t_final * ty;
        
        ball1.inMotion = true;
        ball2.inMotion = true;
        
        playSound(SOUND_TYPES.BALL_HIT);
    }
}