/**
 * 台球桌类实现
 */
class Table {
    constructor() {
        // 台球桌边界
        this.left = TABLE_LEFT;
        this.right = TABLE_RIGHT;
        this.top = TABLE_TOP;
        this.bottom = TABLE_BOTTOM;
        
        // 袋口位置
        this.pockets = [
            { x: TABLE_LEFT, y: TABLE_TOP },             // 左上
            { x: TABLE_RIGHT, y: TABLE_TOP },            // 右上
            { x: TABLE_LEFT, y: TABLE_BOTTOM },          // 左下
            { x: TABLE_RIGHT, y: TABLE_BOTTOM },         // 右下
            { x: TABLE_LEFT + TABLE_WIDTH * 0.5, y: TABLE_TOP - POCKET_RADIUS * 0.3},         // 中上（向右移动）
            { x: TABLE_LEFT + TABLE_WIDTH * 0.5, y: TABLE_BOTTOM + POCKET_RADIUS * 0.3}       // 中下（向左移动）
        ];
    }
    
    /**
     * 绘制台球桌
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        // 添加整体阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        const frameWidth = CUSHION_HEIGHT * 2;  // 外框宽度是库边高度的两倍
        const cornerRadius = frameWidth * 1.2;  // 增大圆角半径
        
        // 创建木质边框渐变
        const frameGradient = ctx.createLinearGradient(
            TABLE_LEFT - frameWidth, 
            TABLE_TOP - frameWidth,
            TABLE_LEFT - frameWidth, 
            TABLE_BOTTOM + frameWidth
        );
        frameGradient.addColorStop(0, LIGHT_BROWN);
        frameGradient.addColorStop(0.5, BROWN);
        frameGradient.addColorStop(1, LIGHT_BROWN);
        
        ctx.fillStyle = frameGradient;
        
        // 绘制圆角矩形边框
        ctx.beginPath();
        
        // 左上角
        ctx.arc(
            TABLE_LEFT - frameWidth + cornerRadius,
            TABLE_TOP - frameWidth + cornerRadius,
            cornerRadius,
            Math.PI,
            Math.PI * 1.5
        );
        
        // 上边
        ctx.lineTo(TABLE_RIGHT + frameWidth - cornerRadius, TABLE_TOP - frameWidth);
        
        // 右上角
        ctx.arc(
            TABLE_RIGHT + frameWidth - cornerRadius,
            TABLE_TOP - frameWidth + cornerRadius,
            cornerRadius,
            Math.PI * 1.5,
            0
        );
        
        // 右边
        ctx.lineTo(TABLE_RIGHT + frameWidth, TABLE_BOTTOM + frameWidth - cornerRadius);
        
        // 右下角
        ctx.arc(
            TABLE_RIGHT + frameWidth - cornerRadius,
            TABLE_BOTTOM + frameWidth - cornerRadius,
            cornerRadius,
            0,
            Math.PI * 0.5
        );
        
        // 下边
        ctx.lineTo(TABLE_LEFT - frameWidth + cornerRadius, TABLE_BOTTOM + frameWidth);
        
        // 左下角
        ctx.arc(
            TABLE_LEFT - frameWidth + cornerRadius,
            TABLE_BOTTOM + frameWidth - cornerRadius,
            cornerRadius,
            Math.PI * 0.5,
            Math.PI
        );
        
        // 左边
        ctx.lineTo(TABLE_LEFT - frameWidth, TABLE_TOP - frameWidth + cornerRadius);
        
        ctx.closePath();
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 创建台面渐变
        const tableGradient = ctx.createLinearGradient(
            TABLE_LEFT, TABLE_TOP,
            TABLE_RIGHT, TABLE_BOTTOM
        );
        tableGradient.addColorStop(0, DARK_GREEN);
        tableGradient.addColorStop(1, LIGHT_GREEN);
        
        // 绘制台面
        ctx.fillStyle = tableGradient;
        ctx.fillRect(TABLE_LEFT, TABLE_TOP, 
                    TABLE_WIDTH, TABLE_HEIGHT);
        
        // 添加台面纹理
        this.drawFeltTexture(ctx);
        
        // 绘制台球桌边框
        this.drawCushions(ctx);
        
        // 绘制袋口
        this.drawPockets(ctx);
        
        // 绘制台球桌边框装饰
        this.drawCushionDecorations(ctx);
        
        // 绘制金属标尺装饰条
        this.drawRulerDecorations(ctx);
        
        // 绘制台面内部阴影
        this.drawInnerShadow(ctx);
    }
    
    /**
     * 绘制袋口
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawPockets(ctx) {
        for (const pocket of this.pockets) {
            // 绘制袋口阴影
            ctx.beginPath();
            ctx.arc(pocket.x + 2, pocket.y + 2, POCKET_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            
            // 绘制袋口
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
            
            // 创建袋口渐变
            const pocketGradient = ctx.createRadialGradient(
                pocket.x, pocket.y, 0,
                pocket.x, pocket.y, POCKET_RADIUS
            );
            pocketGradient.addColorStop(0, '#222222');
            pocketGradient.addColorStop(1, '#000000');
            
            ctx.fillStyle = pocketGradient;
            ctx.fill();
            
            // 绘制袋口内部网状结构
            this.drawPocketMesh(ctx, pocket);
            
            // 绘制袋口边缘高光
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = POCKET_EDGE_COLOR;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    drawPocketMesh(ctx, pocket) {
        ctx.save();
        ctx.translate(pocket.x, pocket.y);
        
        // 创建网格图案
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(POCKET_RADIUS, 0);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawFeltTexture(ctx) {
        // 创建细微纹理
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        for (let x = TABLE_LEFT; x < TABLE_RIGHT; x += 4) {
            for (let y = TABLE_TOP; y < TABLE_BOTTOM; y += 4) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
    }
    
    drawInnerShadow(ctx) {
        const shadowWidth = 20;
        
        // 上边阴影
        const topShadow = ctx.createLinearGradient(0, TABLE_TOP, 0, TABLE_TOP + shadowWidth);
        topShadow.addColorStop(0, RAIL_SHADOW);
        topShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = topShadow;
        ctx.fillRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, shadowWidth);
        
        // 左边阴影
        const leftShadow = ctx.createLinearGradient(TABLE_LEFT, 0, TABLE_LEFT + shadowWidth, 0);
        leftShadow.addColorStop(0, RAIL_SHADOW);
        leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = leftShadow;
        ctx.fillRect(TABLE_LEFT, TABLE_TOP, shadowWidth, TABLE_HEIGHT);
        
        // 右边阴影
        const rightShadow = ctx.createLinearGradient(TABLE_RIGHT, 0, TABLE_RIGHT - shadowWidth, 0);
        rightShadow.addColorStop(0, RAIL_SHADOW);
        rightShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = rightShadow;
        ctx.fillRect(TABLE_RIGHT - shadowWidth, TABLE_TOP, shadowWidth, TABLE_HEIGHT);
        
        // 下边阴影
        const bottomShadow = ctx.createLinearGradient(0, TABLE_BOTTOM, 0, TABLE_BOTTOM - shadowWidth);
        bottomShadow.addColorStop(0, RAIL_SHADOW);
        bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = bottomShadow;
        ctx.fillRect(TABLE_LEFT, TABLE_BOTTOM - shadowWidth, TABLE_WIDTH, shadowWidth);
    }
    
    drawRulerDecorations(ctx) {
        const rulerHeight = 3;
        const markSpacing = 50;
        const markHeight = 5;
        
        // 绘制标尺底色
        ctx.fillStyle = '#c0c0c0';
        
        // 上边标尺
        ctx.fillRect(TABLE_LEFT, TABLE_TOP - CUSHION_HEIGHT - rulerHeight, 
                    TABLE_WIDTH, rulerHeight);
                    
        // 下边标尺
        ctx.fillRect(TABLE_LEFT, TABLE_BOTTOM + CUSHION_HEIGHT, 
                    TABLE_WIDTH, rulerHeight);
        
        // 绘制刻度
        ctx.fillStyle = '#808080';
        for (let x = TABLE_LEFT; x <= TABLE_RIGHT; x += markSpacing) {
            // 上边刻度
            ctx.fillRect(x, TABLE_TOP - CUSHION_HEIGHT - rulerHeight - markHeight/2, 
                        1, markHeight);
            
            // 下边刻度
            ctx.fillRect(x, TABLE_BOTTOM + CUSHION_HEIGHT, 
                        1, markHeight);
        }
    }
    
    /**
     * 创建木纹纹理
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @returns {CanvasPattern} - 木纹纹理
     */
    createWoodPattern(ctx) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 100;
        patternCanvas.height = 100;
        const patternCtx = patternCanvas.getContext('2d');
        
        // 绘制木纹底色
        patternCtx.fillStyle = WOOD_COLOR;
        patternCtx.fillRect(0, 0, 100, 100);
        
        // 绘制木纹纹理
        patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        patternCtx.lineWidth = 1;
        
        for (let i = 0; i < 20; i++) {
            const y = Math.random() * 100;
            patternCtx.beginPath();
            patternCtx.moveTo(0, y);
            patternCtx.bezierCurveTo(
                25, y + Math.random() * 10 - 5,
                75, y + Math.random() * 10 - 5,
                100, y + Math.random() * 10 - 5
            );
            patternCtx.stroke();
        }
        
        // 添加一些深色斑点
        patternCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const radius = Math.random() * 3 + 1;
            patternCtx.beginPath();
            patternCtx.arc(x, y, radius, 0, Math.PI * 2);
            patternCtx.fill();
        }
        
        try {
            return ctx.createPattern(patternCanvas, 'repeat');
        } catch (e) {
            console.error('创建木纹纹理失败', e);
            return null;
        }
    }
    
    /**
     * 创建毛毡纹理
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @returns {CanvasPattern} - 毛毡纹理
     */
    createFeltPattern(ctx) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 200;
        patternCanvas.height = 200;
        const patternCtx = patternCanvas.getContext('2d');
        
        // 绘制毛毡底色 - 使用图片中的绿色
        patternCtx.fillStyle = FELT_GREEN;
        patternCtx.fillRect(0, 0, 200, 200);
        
        // 添加细微纹理
        patternCtx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 200;
            const y = Math.random() * 200;
            const size = Math.random() * 1.5 + 0.5;
            patternCtx.fillRect(x, y, size, size);
        }
        
        // 添加一些亮点
        patternCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 200;
            const y = Math.random() * 200;
            const size = Math.random() * 1 + 0.5;
            patternCtx.fillRect(x, y, size, size);
        }
        
        try {
            return ctx.createPattern(patternCanvas, 'repeat');
        } catch (e) {
            console.error('创建毛毡纹理失败', e);
            return null;
        }
    }
    
    /**
     * 绘制台球桌边框
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {string} color - 边框颜色
     */
    drawCushions(ctx) {
        const cushionWidth = CUSHION_HEIGHT;
        const frameWidth = cushionWidth * 2;  // 外框宽度
        const cornerRadius = frameWidth * 1.2;  // 与外框一致的圆角半径
        
        // 绘制外框
        ctx.fillStyle = RAIL_COLOR;
        
        // 绘制圆角边框
        ctx.beginPath();
        
        // 左上角
        ctx.arc(
            TABLE_LEFT - frameWidth + cornerRadius,
            TABLE_TOP - frameWidth + cornerRadius,
            cornerRadius,
            Math.PI,
            Math.PI * 1.5
        );
        
        // 上边
        ctx.lineTo(TABLE_RIGHT + frameWidth - cornerRadius, TABLE_TOP - frameWidth);
        
        // 右上角
        ctx.arc(
            TABLE_RIGHT + frameWidth - cornerRadius,
            TABLE_TOP - frameWidth + cornerRadius,
            cornerRadius,
            Math.PI * 1.5,
            0
        );
        
        // 右边
        ctx.lineTo(TABLE_RIGHT + frameWidth, TABLE_BOTTOM + frameWidth - cornerRadius);
        
        // 右下角
        ctx.arc(
            TABLE_RIGHT + frameWidth - cornerRadius,
            TABLE_BOTTOM + frameWidth - cornerRadius,
            cornerRadius,
            0,
            Math.PI * 0.5
        );
        
        // 下边
        ctx.lineTo(TABLE_LEFT - frameWidth + cornerRadius, TABLE_BOTTOM + frameWidth);
        
        // 左下角
        ctx.arc(
            TABLE_LEFT - frameWidth + cornerRadius,
            TABLE_BOTTOM + frameWidth - cornerRadius,
            cornerRadius,
            Math.PI * 0.5,
            Math.PI
        );
        
        // 左边
        ctx.lineTo(TABLE_LEFT - frameWidth, TABLE_TOP - frameWidth + cornerRadius);
        
        ctx.closePath();
        ctx.fill();
        
        // 绘制内侧库边（绿色）
        ctx.fillStyle = DARK_GREEN;
        
        // 上库边
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT, TABLE_TOP);
        ctx.lineTo(TABLE_LEFT - cushionWidth, TABLE_TOP - cushionWidth);
        ctx.lineTo(TABLE_RIGHT + cushionWidth, TABLE_TOP - cushionWidth);
        ctx.lineTo(TABLE_RIGHT, TABLE_TOP);
        ctx.closePath();
        ctx.fill();
        
        // 下库边
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT, TABLE_BOTTOM);
        ctx.lineTo(TABLE_LEFT - cushionWidth, TABLE_BOTTOM + cushionWidth);
        ctx.lineTo(TABLE_RIGHT + cushionWidth, TABLE_BOTTOM + cushionWidth);
        ctx.lineTo(TABLE_RIGHT, TABLE_BOTTOM);
        ctx.closePath();
        ctx.fill();
        
        // 左库边
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT, TABLE_TOP);
        ctx.lineTo(TABLE_LEFT - cushionWidth, TABLE_TOP - cushionWidth);
        ctx.lineTo(TABLE_LEFT - cushionWidth, TABLE_BOTTOM + cushionWidth);
        ctx.lineTo(TABLE_LEFT, TABLE_BOTTOM);
        ctx.closePath();
        ctx.fill();
        
        // 右库边
        ctx.beginPath();
        ctx.moveTo(TABLE_RIGHT, TABLE_TOP);
        ctx.lineTo(TABLE_RIGHT + cushionWidth, TABLE_TOP - cushionWidth);
        ctx.lineTo(TABLE_RIGHT + cushionWidth, TABLE_BOTTOM + cushionWidth);
        ctx.lineTo(TABLE_RIGHT, TABLE_BOTTOM);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * 绘制台球桌边框装饰
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawCushionDecorations(ctx) {
        const frameWidth = CUSHION_HEIGHT * 2;
        // 绘制边框装饰点 - 白色点
        ctx.fillStyle = RAIL_DECORATION_COLOR;
        
        // 装饰点的位置偏移（从边缘向内）
        const offset = frameWidth * 0.4;
        
        // 上边框装饰点
        const topPoints = 8;
        const topSpacing = TABLE_WIDTH / (topPoints + 1);
        for (let i = 1; i <= topPoints; i++) {
            const x = TABLE_LEFT + i * topSpacing;
            const y = TABLE_TOP - frameWidth + offset;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 下边框装饰点
        const bottomPoints = 8;
        const bottomSpacing = TABLE_WIDTH / (bottomPoints + 1);
        for (let i = 1; i <= bottomPoints; i++) {
            const x = TABLE_LEFT + i * bottomSpacing;
            const y = TABLE_BOTTOM + frameWidth - offset;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 左边框装饰点
        const leftPoints = 3;
        const leftSpacing = TABLE_HEIGHT / (leftPoints + 1);
        for (let i = 1; i <= leftPoints; i++) {
            const x = TABLE_LEFT - frameWidth + offset;
            const y = TABLE_TOP + i * leftSpacing;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 右边框装饰点
        const rightPoints = 3;
        const rightSpacing = TABLE_HEIGHT / (rightPoints + 1);
        for (let i = 1; i <= rightPoints; i++) {
            const x = TABLE_RIGHT + frameWidth - offset;
            const y = TABLE_TOP + i * rightSpacing;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * 绘制台球桌标记点
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawTableMarkers(ctx) {
        ctx.fillStyle = WHITE;
        
        // 中心点
        ctx.beginPath();
        ctx.arc((TABLE_LEFT + TABLE_RIGHT) / 2, (TABLE_TOP + TABLE_BOTTOM) / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 四分之一点
        ctx.beginPath();
        ctx.arc(TABLE_LEFT + (TABLE_RIGHT - TABLE_LEFT) / 4, (TABLE_TOP + TABLE_BOTTOM) / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 四分之三点
        ctx.beginPath();
        ctx.arc(TABLE_LEFT + (TABLE_RIGHT - TABLE_LEFT) * 3 / 4, (TABLE_TOP + TABLE_BOTTOM) / 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 检查球是否进袋
     * @param {Ball} ball - 要检查的球
     * @returns {boolean} - 是否进袋
     */
    checkPocket(ball) {
        if (ball.pocketed) return false;
        
        for (const pocket of this.pockets) {
            const dx = ball.x - pocket.x;
            const dy = ball.y - pocket.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < POCKET_DETECTION_RADIUS) {
                ball.pocketed = true;
                playSound(SOUND_TYPES.POCKET);
                return true;
            }
        }
        
        return false;
    }
}