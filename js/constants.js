/**
 * 游戏常量定义
 */

// 颜色定义
const GREEN = '#0C6B3C';  // 台面主色调（毛毡绿色）
const DARK_GREEN = '#0C6B3C';  // 台面渐变起始色
const LIGHT_GREEN = '#0C6B3C';  // 台面渐变结束色
const BROWN = '#2B1810';  // 边框主色调（深棕色）
const LIGHT_BROWN = '#3D2317';  // 边框高光色（稍浅的深棕色）
const WOOD_COLOR = '#2B1810';  // 木质边框色
const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GOLD = '#ffd700';  // 袋口高亮色
const BLACK = '#000000';
const BLUE = '#0000FF';
const YELLOW = '#FFFF00';
const FELT_GREEN = '#0C6B3C';  // 毛毡绿色
const RAIL_DECORATION_COLOR = '#ffffff';  // 边框装饰点颜色
const RAIL_SHADOW = 'rgba(0, 0, 0, 0.5)';  // 库边阴影颜色
const RAIL_COLOR = '#0C6B3C';  // 库边颜色，与台面相同
const FRAME_COLOR = '#2B1810';  // 木质外框颜色，与BROWN相同

// 游戏窗口设置 - 这些将在初始化时被动态设置
let WINDOW_WIDTH = 1200;
let WINDOW_HEIGHT = 600;

// 球桌尺寸（2:1比例）- 这些将在初始化时被动态设置
let TABLE_WIDTH = 900;  // 增加台面宽度
let TABLE_HEIGHT = 450;  // 保持2:1比例
let TABLE_LEFT = (WINDOW_WIDTH - TABLE_WIDTH) / 2;
let TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;
let TABLE_TOP = (WINDOW_HEIGHT - TABLE_HEIGHT) / 2;
let TABLE_BOTTOM = TABLE_TOP + TABLE_HEIGHT;

// 球的属性 - 球的大小将根据屏幕尺寸动态调整
let BALL_RADIUS = 12;  // 调整球的大小
const BALL_MASS = 1;
const FRICTION = 0.99;  // 摩擦系数

// 袋口属性 - 袋口大小将根据球的大小动态调整
let POCKET_RADIUS = 18;  // 调整袋口大小
let POCKET_DETECTION_RADIUS = 20;  // 相应调整检测范围
const POCKET_LINER_COLOR = '#111111';  // 袋口内衬颜色
const POCKET_EDGE_COLOR = '#333333';  // 袋口边缘颜色
const POCKET_GLOW_COLOR = '#ffd700';  // 袋口高亮颜色
const POCKET_GLOW_DURATION = 300;  // 高亮持续时间（毫秒）

// 物理参数
const SLIDING_FRICTION = 0.02;  // 滑动摩擦系数
const ROLLING_FRICTION = 0.02;  // 滚动摩擦系数
const ELASTICITY = 0.8;  // 弹性系数

// 台球桌装饰 - 边框宽度将根据球的大小动态调整
let CUSHION_HEIGHT = 30;  // 增加边框宽度
const RAIL_HIGHLIGHT = '#8b5e4e';  // 边框高光色

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