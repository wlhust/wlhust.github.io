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
            { x: TABLE_LEFT, y: TABLE_TOP },  // 左上
            { x: TABLE_RIGHT, y: TABLE_TOP },  // 右上
            { x: TABLE_LEFT, y: TABLE_BOTTOM },  // 左下
            { x: TABLE_RIGHT, y: TABLE_BOTTOM },  // 右下
            { x: (TABLE_LEFT + TABLE_RIGHT) / 2, y: TABLE_TOP },  // 中上
            { x: (TABLE_LEFT + TABLE_RIGHT) / 2, y: TABLE_BOTTOM }  // 中下
        ];
    }
    
    /**
     * 绘制台球桌
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        // 绘制外部背景 - 木质外框
        const woodPattern = this.createWoodPattern(ctx);
        ctx.fillStyle = woodPattern || WOOD_COLOR;
        ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
        
        // 绘制台球桌边框底座
        ctx.fillStyle = LIGHT_BROWN;
        ctx.fillRect(TABLE_LEFT - 30, TABLE_TOP - 30, 
                    TABLE_RIGHT - TABLE_LEFT + 60, 
                    TABLE_BOTTOM - TABLE_TOP + 60);
        
        // 添加边框阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 绘制台面
        const feltPattern = this.createFeltPattern(ctx);
        ctx.fillStyle = feltPattern || FELT_GREEN;
        ctx.fillRect(TABLE_LEFT, TABLE_TOP, 
                    TABLE_RIGHT - TABLE_LEFT, 
                    TABLE_BOTTOM - TABLE_TOP);
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 绘制台球桌边框
        const cushionColor = DARK_GREEN;
        this.drawCushions(ctx, cushionColor);
        
        // 绘制台球桌边框装饰
        this.drawCushionDecorations(ctx);
        
        // 绘制袋口
        this.pockets.forEach(pocket => {
            // 绘制袋口外圈阴影
            ctx.beginPath();
            ctx.arc(pocket.x + 3, pocket.y + 3, POCKET_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fill();
            
            // 绘制袋口外圈
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = BLACK;
            ctx.fill();
            
            // 绘制袋口内部
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS - 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgb(10, 10, 10)';
            ctx.fill();
            
            // 添加袋口内部阴影效果
            ctx.beginPath();
            ctx.arc(pocket.x + 2, pocket.y + 2, POCKET_RADIUS - 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgb(5, 5, 5)';
            ctx.fill();
        });
        
        // 绘制台球桌上的标记点
        this.drawTableMarkers(ctx);
        
        // 绘制瞄准辅助点
        this.drawAimingDots(ctx);
        
        // 绘制台球桌边缘阴影效果
        this.drawTableShadow(ctx);
    }
    
    /**
     * 绘制瞄准辅助点
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawAimingDots(ctx) {
        const dotSpacing = 30;
        const dotRadius = 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        // 绘制水平线上的点
        for (let x = TABLE_LEFT + dotSpacing; x < TABLE_RIGHT; x += dotSpacing) {
            for (let y of [TABLE_TOP + dotSpacing, TABLE_BOTTOM - dotSpacing]) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 绘制垂直线上的点
        for (let y = TABLE_TOP + dotSpacing; y < TABLE_BOTTOM; y += dotSpacing) {
            for (let x of [TABLE_LEFT + dotSpacing, TABLE_RIGHT - dotSpacing]) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
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
        patternCanvas.width = 100;
        patternCanvas.height = 100;
        const patternCtx = patternCanvas.getContext('2d');
        
        // 绘制毛毡底色
        patternCtx.fillStyle = FELT_GREEN;
        patternCtx.fillRect(0, 0, 100, 100);
        
        // 绘制毛毡纹理
        patternCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            patternCtx.fillRect(x, y, 1, 1);
        }
        
        // 添加一些亮点
        patternCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            patternCtx.fillRect(x, y, 1, 1);
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
    drawCushions(ctx, color) {
        const cushionWidth = 20;
        
        // 上边框
        ctx.fillStyle = color;
        ctx.fillRect(TABLE_LEFT, TABLE_TOP - cushionWidth, 
                    TABLE_RIGHT - TABLE_LEFT, cushionWidth);
        
        // 下边框
        ctx.fillRect(TABLE_LEFT, TABLE_BOTTOM, 
                    TABLE_RIGHT - TABLE_LEFT, cushionWidth);
        
        // 左边框
        ctx.fillRect(TABLE_LEFT - cushionWidth, TABLE_TOP, 
                    cushionWidth, TABLE_BOTTOM - TABLE_TOP);
        
        // 右边框
        ctx.fillRect(TABLE_RIGHT, TABLE_TOP, 
                    cushionWidth, TABLE_BOTTOM - TABLE_TOP);
        
        // 添加边框高光
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        // 上边框高光
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT, TABLE_TOP - cushionWidth + 2);
        ctx.lineTo(TABLE_RIGHT, TABLE_TOP - cushionWidth + 2);
        ctx.stroke();
        
        // 左边框高光
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT - cushionWidth + 2, TABLE_TOP);
        ctx.lineTo(TABLE_LEFT - cushionWidth + 2, TABLE_BOTTOM);
        ctx.stroke();
    }
    
    /**
     * 绘制台球桌边框装饰
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawCushionDecorations(ctx) {
        // 绘制边框装饰点
        ctx.fillStyle = GOLD;
        
        // 上边框装饰点
        for (let i = 1; i < 6; i++) {
            const x = TABLE_LEFT + (TABLE_RIGHT - TABLE_LEFT) * i / 6;
            ctx.beginPath();
            ctx.arc(x, TABLE_TOP - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 下边框装饰点
        for (let i = 1; i < 6; i++) {
            const x = TABLE_LEFT + (TABLE_RIGHT - TABLE_LEFT) * i / 6;
            ctx.beginPath();
            ctx.arc(x, TABLE_BOTTOM + 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 左右边框装饰点
        for (let i = 1; i < 3; i++) {
            const y = TABLE_TOP + (TABLE_BOTTOM - TABLE_TOP) * i / 3;
            
            // 左边框
            ctx.beginPath();
            ctx.arc(TABLE_LEFT - 10, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // 右边框
            ctx.beginPath();
            ctx.arc(TABLE_RIGHT + 10, y, 5, 0, Math.PI * 2);
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
     * 绘制台球桌阴影
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    drawTableShadow(ctx) {
        // 创建半透明阴影
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = TABLE_RIGHT - TABLE_LEFT;
        shadowCanvas.height = TABLE_BOTTOM - TABLE_TOP;
        const shadowCtx = shadowCanvas.getContext('2d');
        
        // 绘制内部阴影
        const gradient = shadowCtx.createLinearGradient(0, 0, 0, shadowCanvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        shadowCtx.fillStyle = gradient;
        shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        
        // 绘制左右阴影
        const horizontalGradient = shadowCtx.createLinearGradient(0, 0, shadowCanvas.width, 0);
        horizontalGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        horizontalGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        horizontalGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        shadowCtx.fillStyle = horizontalGradient;
        shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        
        // 将阴影绘制到主画布
        ctx.globalAlpha = 0.5;
        ctx.drawImage(shadowCanvas, TABLE_LEFT, TABLE_TOP);
        ctx.globalAlpha = 1.0;
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