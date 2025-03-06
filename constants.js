/**
 * 游戏常量定义
 */

// 颜色定义
const GREEN = '#228B22';
const DARK_GREEN = '#006400';
const BROWN = '#8B4513';
const LIGHT_BROWN = '#A07C3C';
const WOOD_COLOR = '#B88648';
const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GOLD = '#DAA520';
const BLACK = '#000000';
const BLUE = '#0000FF';
const YELLOW = '#FFFF00';
const FELT_GREEN = '#1A7832';

// 游戏窗口设置
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 600;
const BALL_RADIUS = 15;
const POCKET_RADIUS = 35;  // 袋口半径
const POCKET_DETECTION_RADIUS = 45;  // 更大的检测半径，使球更容易进袋
const FRICTION = 0.985;  // 摩擦系数

// 物理参数
const SLIDING_FRICTION = 0.02;  // 滑动摩擦系数
const ROLLING_FRICTION = 0.02;  // 滚动摩擦系数
const ELASTICITY = 0.95;  // 弹性系数

// 台球桌边界
const TABLE_LEFT = 100;
const TABLE_RIGHT = WINDOW_WIDTH - 100;
const TABLE_TOP = 50;
const TABLE_BOTTOM = WINDOW_HEIGHT - 50;

// 游戏状态
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    AIMING: 'aiming',
    SHOOTING: 'shooting',
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