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
            { x: TABLE_LEFT + TABLE_WIDTH * 0.5, y: TABLE_TOP - POCKET_RADIUS * 0.3},         // 中上
            { x: TABLE_LEFT + TABLE_WIDTH * 0.5, y: TABLE_BOTTOM + POCKET_RADIUS * 0.3}       // 中下
        ];

        // 库边位置（用于碰撞检测）
        this.cushions = [
            // 上库边
            {
                x1: TABLE_LEFT,
                y1: TABLE_TOP,
                x2: TABLE_RIGHT,
                y2: TABLE_TOP
            },
            // 下库边
            {
                x1: TABLE_LEFT,
                y1: TABLE_BOTTOM,
                x2: TABLE_RIGHT,
                y2: TABLE_BOTTOM
            },
            // 左库边
            {
                x1: TABLE_LEFT,
                y1: TABLE_TOP,
                x2: TABLE_LEFT,
                y2: TABLE_BOTTOM
            },
            // 右库边
            {
                x1: TABLE_RIGHT,
                y1: TABLE_TOP,
                x2: TABLE_RIGHT,
                y2: TABLE_BOTTOM
            }
        ];

        // 加载台球桌图片
        this.image = new Image();
        this.image.src = 'src/pool.png';
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }
    
    /**
     * 绘制台球桌
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        if (this.imageLoaded) {
            // 绘制台球桌图片
            ctx.drawImage(
                this.image,
                TABLE_LEFT - CUSHION_HEIGHT * 2,  // 考虑边框宽度
                TABLE_TOP - CUSHION_HEIGHT * 2,
                TABLE_WIDTH + CUSHION_HEIGHT * 4,  // 增加边框宽度
                TABLE_HEIGHT + CUSHION_HEIGHT * 4
            );
        } else {
            // 如果图片未加载完成，显示加载中的提示
            ctx.fillStyle = '#0C6B3C';
            ctx.fillRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, TABLE_HEIGHT);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('加载中...', TABLE_LEFT + TABLE_WIDTH/2, TABLE_TOP + TABLE_HEIGHT/2);
        }
    }
    
    /**
     * 检查球是否进袋
     * @param {Ball} ball - 要检查的球
     * @returns {number} - 如果球进袋，返回袋口索引；否则返回-1
     */
    checkPocket(ball) {
        for (let i = 0; i < this.pockets.length; i++) {
            const pocket = this.pockets[i];
            const dx = ball.x - pocket.x;
            const dy = ball.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < POCKET_RADIUS) {
                return i;  // 返回袋口索引
            }
        }
        return -1;  // 没有进袋
    }

    /**
     * 检查球是否与库边碰撞
     * @param {Ball} ball - 要检查的球
     * @returns {boolean} - 是否发生碰撞
     */
    checkCushionCollision(ball) {
        for (const cushion of this.cushions) {
            // 计算球到库边的距离
            const dx = cushion.x2 - cushion.x1;
            const dy = cushion.y2 - cushion.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            // 计算球到库边的垂直距离
            const dot = ((ball.x - cushion.x1) * dx + (ball.y - cushion.y1) * dy) / length;
            const closestX = cushion.x1 + (dot * dx) / length;
            const closestY = cushion.y1 + (dot * dy) / length;
            
            // 检查最近点是否在库边线段上
            if (dot < 0) {
                const d = Math.sqrt((ball.x - cushion.x1) * (ball.x - cushion.x1) + 
                                  (ball.y - cushion.y1) * (ball.y - cushion.y1));
                if (d < BALL_RADIUS) {
                    return true;
                }
            } else if (dot > length) {
                const d = Math.sqrt((ball.x - cushion.x2) * (ball.x - cushion.x2) + 
                                  (ball.y - cushion.y2) * (ball.y - cushion.y2));
                if (d < BALL_RADIUS) {
                    return true;
                }
            } else {
                const d = Math.abs((ball.x - cushion.x1) * dy - (ball.y - cushion.y1) * dx) / length;
                if (d < BALL_RADIUS) {
                    return true;
                }
            }
        }
        return false;
    }
}