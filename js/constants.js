/**
 * 游戏常量定义
 */

// 颜色定义
const GREEN = '#2d5a27';  // 台面主色调
const DARK_GREEN = '#1d4b1a';  // 台面渐变起始色
const LIGHT_GREEN = '#3a6b33';  // 台面渐变结束色
const BROWN = '#2B1810';  // 边框主色调（深棕色）
const LIGHT_BROWN = '#3D2317';  // 边框高光色（稍浅的深棕色）
const WOOD_COLOR = '#2B1810';  // 木质边框色
const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GOLD = '#ffd700';  // 袋口高亮色
const BLACK = '#000000';
const BLUE = '#0000FF';
const YELLOW = '#FFFF00';
const FELT_GREEN = '#2d5a27';  // 毛毡绿色

// 游戏窗口设置
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 600;

// 球桌尺寸（2:1比例）
const TABLE_WIDTH = 900;  // 增加台面宽度
const TABLE_HEIGHT = 450;  // 保持2:1比例
const TABLE_LEFT = (WINDOW_WIDTH - TABLE_WIDTH) / 2;
const TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;
const TABLE_TOP = (WINDOW_HEIGHT - TABLE_HEIGHT) / 2;
const TABLE_BOTTOM = TABLE_TOP + TABLE_HEIGHT;

// 球的属性
const BALL_RADIUS = 12;  // 调整球的大小
const BALL_MASS = 1;
const FRICTION = 0.99;  // 摩擦系数

// 袋口属性
const POCKET_RADIUS = 18;  // 调整袋口大小
const POCKET_DETECTION_RADIUS = 20;  // 相应调整检测范围
const POCKET_LINER_COLOR = '#111111';  // 袋口内衬颜色
const POCKET_EDGE_COLOR = '#333333';  // 袋口边缘颜色
const POCKET_GLOW_COLOR = '#ffd700';  // 袋口高亮颜色
const POCKET_GLOW_DURATION = 300;  // 高亮持续时间（毫秒）

// 物理参数
const SLIDING_FRICTION = 0.02;  // 滑动摩擦系数
const ROLLING_FRICTION = 0.02;  // 滚动摩擦系数
const ELASTICITY = 0.8;  // 弹性系数

// 台球桌装饰
const CUSHION_HEIGHT = 30;  // 增加边框宽度
const RAIL_COLOR = '#6b3e2e';  // 边框颜色
const RAIL_HIGHLIGHT = '#8b5e4e';  // 边框高光色
const RAIL_SHADOW = 'rgba(0,0,0,0.3)';  // 边框阴影色
const RAIL_DECORATION_COLOR = '#ffffff';  // 边框装饰点颜色

// 游戏状态
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    AIMING: 'aiming',
    BALLS_MOVING: 'balls_moving',
    GAME_OVER: 'game_over'
};

// 音效类型
const SOUND_TYPES = {
    BALL_HIT: 'ball_hit',
    WALL_HIT: 'wall_hit',
    POCKET: 'pocket'
};

// 导出常量
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_STATE,
        SOUND_TYPES,
        WINDOW_WIDTH,
        WINDOW_HEIGHT,
        BALL_RADIUS,
        POCKET_RADIUS,
        POCKET_DETECTION_RADIUS,
        FRICTION,
        SLIDING_FRICTION,
        ROLLING_FRICTION,
        ELASTICITY,
        TABLE_LEFT,
        TABLE_RIGHT,
        TABLE_TOP,
        TABLE_BOTTOM
    };
}