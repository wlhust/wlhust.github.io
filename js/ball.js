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
        if (this.x - BALL_RADIUS <= TABLE_LEFT) {
            this.x = TABLE_LEFT + BALL_RADIUS;
            this.velocityX = -this.velocityX * ELASTICITY;
            playSound(SOUND_TYPES.WALL_HIT);
        } else if (this.x + BALL_RADIUS >= TABLE_RIGHT) {
            this.x = TABLE_RIGHT - BALL_RADIUS;
            this.velocityX = -this.velocityX * ELASTICITY;
            playSound(SOUND_TYPES.WALL_HIT);
        }
        
        if (this.y - BALL_RADIUS <= TABLE_TOP) {
            this.y = TABLE_TOP + BALL_RADIUS;
            this.velocityY = -this.velocityY * ELASTICITY;
            playSound(SOUND_TYPES.WALL_HIT);
        } else if (this.y + BALL_RADIUS >= TABLE_BOTTOM) {
            this.y = TABLE_BOTTOM - BALL_RADIUS;
            this.velocityY = -this.velocityY * ELASTICITY;
            playSound(SOUND_TYPES.WALL_HIT);
        }
    }
    
    /**
     * 绘制球体
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        if (this.pocketed) {
            // 如果球正在进袋，添加缩放和旋转动画
            if (this.pocketingAnimation) {
                const progress = (Date.now() - this.pocketingAnimation.startTime) / 300;
                if (progress <= 1) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(progress * Math.PI * 2);
                    ctx.scale(1 - progress * 0.2, 1 - progress * 0.2);
                    ctx.translate(-this.x, -this.y);
                    this.drawBall(ctx);
                    ctx.restore();
                    return;
                }
            }
            return;
        }
        
        this.drawBall(ctx);
    }

    drawBall(ctx) {
        // 绘制球体阴影
        const shadowOffsetX = 4;
        const shadowOffsetY = 4;
        const shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x + shadowOffsetX, this.y + shadowOffsetY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 绘制球体
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        
        // 创建球体径向渐变，增强3D效果
        const gradient = ctx.createRadialGradient(
            this.x - BALL_RADIUS/2.5, this.y - BALL_RADIUS/2.5, BALL_RADIUS/10,
            this.x, this.y, BALL_RADIUS
        );
        
        // 根据球的颜色创建渐变
        const baseColor = this.color;
        const lighterColor = this.getLighterColor(baseColor);
        const darkerColor = this.getDarkerColor(baseColor);
        
        gradient.addColorStop(0, lighterColor);
        gradient.addColorStop(0.6, baseColor);
        gradient.addColorStop(1, darkerColor);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加边缘描边，增强立体感
        ctx.strokeStyle = darkerColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 为球添加主高光效果
        const highlightX = this.x - BALL_RADIUS/2.5;
        const highlightY = this.y - BALL_RADIUS/2.5;
        const highlightRadius = BALL_RADIUS/2;
        
        const highlightGradient = ctx.createRadialGradient(
            highlightX, highlightY, 0,
            highlightX, highlightY, highlightRadius
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        // 添加次级高光
        const secondaryHighlightX = this.x + BALL_RADIUS/3;
        const secondaryHighlightY = this.y + BALL_RADIUS/3;
        const secondaryHighlightRadius = BALL_RADIUS/4;
        
        const secondaryGradient = ctx.createRadialGradient(
            secondaryHighlightX, secondaryHighlightY, 0,
            secondaryHighlightX, secondaryHighlightY, secondaryHighlightRadius
        );
        secondaryGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        secondaryGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(secondaryHighlightX, secondaryHighlightY, secondaryHighlightRadius, 0, Math.PI * 2);
        ctx.fillStyle = secondaryGradient;
        ctx.fill();
        
        // 绘制球号和标记
        this.drawBallNumber(ctx);
    }

    drawBallNumber(ctx) {
        if (this.isCue) {
            // 为母球添加特殊标记
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_RADIUS - 2, 0, Math.PI * 2);
            
            // 创建母球内部渐变
            const cueGradient = ctx.createRadialGradient(
                this.x - (BALL_RADIUS-2)/3, this.y - (BALL_RADIUS-2)/3, 0,
                this.x, this.y, BALL_RADIUS - 2
            );
            cueGradient.addColorStop(0, '#ffffff');
            cueGradient.addColorStop(0.7, '#f8f8f8');
            cueGradient.addColorStop(1, '#f0f0f0');
            
            ctx.fillStyle = cueGradient;
            ctx.fill();
        } else if (this.number !== null) {
            if (this.number <= 8) {
                this.drawSolidBall(ctx);
            } else {
                this.drawStripedBall(ctx);
            }
        }
    }

    /**
     * 绘制实色球
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawSolidBall(ctx) {
        // 绘制白色圆圈
        const circleRadius = BALL_RADIUS * 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制数字
        ctx.font = 'bold ' + (BALL_RADIUS * 0.6) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText(this.number.toString(), this.x, this.y);
    }

    /**
     * 绘制条纹球
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawStripedBall(ctx) {
        // 保存当前上下文状态
        ctx.save();
        
        // 创建条纹区域（上下白色区域）
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.clip();
        
        // 绘制白色条纹
        const stripeWidth = BALL_RADIUS * 1.2;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x - BALL_RADIUS, this.y - stripeWidth/2, BALL_RADIUS * 2, stripeWidth);
        
        // 恢复上下文
        ctx.restore();
        
        // 重新绘制球的边缘
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = this.getDarkerColor(this.color);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制白色圆圈
        const circleRadius = BALL_RADIUS * 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制数字
        ctx.font = 'bold ' + (BALL_RADIUS * 0.6) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText(this.number.toString(), this.x, this.y);
    }

    /**
     * 获取颜色的亮色版本
     * @param {string} color - 原始颜色
     * @returns {string} - 亮色版本
     */
    getLighterColor(color) {
        // 简单处理常见颜色
        switch(color) {
            case WHITE: return '#ffffff';
            case BLACK: return '#505050';
            case RED: return '#ff6060';
            case BLUE: return '#6060ff';
            case YELLOW: return '#ffff60';
            default:
                // 尝试解析颜色
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = color;
                    const rgb = ctx.fillStyle;
                    
                    // 简单增亮
                    return this.adjustBrightness(rgb, 40);
                } catch(e) {
                    return color; // 如果解析失败，返回原始颜色
                }
        }
    }

    /**
     * 获取颜色的暗色版本
     * @param {string} color - 原始颜色
     * @returns {string} - 暗色版本
     */
    getDarkerColor(color) {
        // 简单处理常见颜色
        switch(color) {
            case WHITE: return '#e0e0e0';
            case BLACK: return '#000000';
            case RED: return '#c00000';
            case BLUE: return '#000080';
            case YELLOW: return '#c0c000';
            default:
                // 尝试解析颜色
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = color;
                    const rgb = ctx.fillStyle;
                    
                    // 简单降低亮度
                    return this.adjustBrightness(rgb, -40);
                } catch(e) {
                    return color; // 如果解析失败，返回原始颜色
                }
        }
    }

    /**
     * 调整颜色亮度
     * @param {string} color - 原始颜色（格式：#rrggbb）
     * @param {number} amount - 亮度调整量（正值增亮，负值变暗）
     * @returns {string} - 调整后的颜色
     */
    adjustBrightness(color, amount) {
        if (color.startsWith('#')) {
            color = color.slice(1);
        } else if (color.startsWith('rgb')) {
            // 提取rgb值
            const match = color.match(/\d+/g);
            if (match && match.length >= 3) {
                color = '';
                for (let i = 0; i < 3; i++) {
                    const hex = parseInt(match[i]).toString(16);
                    color += hex.length === 1 ? '0' + hex : hex;
                }
            }
        }
        
        // 确保是6位十六进制
        if (color.length === 3) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        }
        
        // 解析RGB值
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        
        // 调整亮度
        const newR = Math.max(0, Math.min(255, r + amount));
        const newG = Math.max(0, Math.min(255, g + amount));
        const newB = Math.max(0, Math.min(255, b + amount));
        
        // 转回十六进制
        return `#${this.toHex(newR)}${this.toHex(newG)}${this.toHex(newB)}`;
    }

    /**
     * 将数字转为两位十六进制
     * @param {number} num - 输入数字
     * @returns {string} - 两位十六进制字符串
     */
    toHex(num) {
        const hex = Math.round(num).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }
}

/**
 * 检测两个球之间的碰撞并处理
 * @param {Ball} ball1 - 第一个球
 * @param {Ball} ball2 - 第二个球
 */
function checkCollision(ball1, ball2) {
    if (ball1.pocketed || ball2.pocketed) return false;
    
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
        const v1nAfter = (v1n * (m1 - e * m2) + v2n * m2 * (1 + e)) / (m1 + m2);
        const v2nAfter = (v2n * (m2 - e * m1) + v1n * m1 * (1 + e)) / (m1 + m2);
        
        // 切线方向速度保持不变
        const v1tAfter = v1t;
        const v2tAfter = v2t;
        
        // 将法线和切线分量转换回x和y分量
        ball1.velocityX = v1nAfter * nx + v1tAfter * tx;
        ball1.velocityY = v1nAfter * ny + v1tAfter * ty;
        ball2.velocityX = v2nAfter * nx + v2tAfter * tx;
        ball2.velocityY = v2nAfter * ny + v2tAfter * ty;
        
        // 设置球为运动状态
        ball1.inMotion = true;
        ball2.inMotion = true;
        
        // 播放碰撞音效
        playSound('ball_hit');
        
        // 防止球重叠：将球沿法线方向分离
        const overlap = BALL_RADIUS * 2 - distance;
        if (overlap > 0) {
            const separationX = nx * overlap * 0.5;
            const separationY = ny * overlap * 0.5;
            
            ball1.x -= separationX;
            ball1.y -= separationY;
            ball2.x += separationX;
            ball2.y += separationY;
        }
        
        return true;  // 发生了碰撞
    }
    
    return false;  // 没有碰撞
}