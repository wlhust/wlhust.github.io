/**
 * 游戏主逻辑实现
 */

// 游戏全局变量
let canvas;
let ctx;
let table;
let balls = [];
let cueBall;
let gameState = GAME_STATE.MENU;
let mouseX = 0;
let mouseY = 0;
let aimingAngle = 0;
let powerLevel = 0;
let isPoweringUp = false;
let score = 0;
let shots = 0;
let spinSystem;
let audioContext;
let audioBuffers = {};
let isAiming = false;  // 添加瞄准状态标志
let pocketAnimations = [];
let isMobileDevice = false;
let touchStartX = 0;
let touchStartY = 0;
let touchTimeout = null;
let scoreDisplay, shotsDisplay;

// 音效文件路径
const AUDIO_FILES = {
    [SOUND_TYPES.BALL_HIT]: 'audio/ball_hit.mp3',
    [SOUND_TYPES.WALL_HIT]: 'audio/wall_hit.mp3',
    [SOUND_TYPES.POCKET]: 'audio/pocket.mp3'
};

/**
 * 初始化游戏
 */
function init() {
    // 获取画布和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 检测设备类型
    isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    
    console.log("设备类型:", isMobileDevice ? "移动设备" : "桌面设备");
    
    // 调整画布大小以适应屏幕
    resizeCanvas();
    
    // 创建台球桌
    table = new Table();
    
    // 创建旋转系统
    spinSystem = new SpinSystem();
    
    // 初始化音频系统
    initAudio();
    
    // 添加事件监听
    addEventListeners();
    
    // 初始绘制
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    table.draw(ctx);
    
    // 显示菜单
    document.getElementById('menu').classList.remove('d-none');
    
    // 创建球
    balls = [];
    
    // 创建白球（母球）
    cueBall = new Ball(
        TABLE_LEFT + TABLE_WIDTH / 4,
        TABLE_TOP + TABLE_HEIGHT / 2,
        WHITE,
        true,  // 标记为母球
        0
    );
    balls.push(cueBall);
    
    // 创建其他球
    const colors = [RED, BLUE, YELLOW, GREEN, BROWN, BLACK];
    for (let i = 0; i < 10; i++) {
        const ball = new Ball(
            TABLE_LEFT + TABLE_WIDTH * 0.7 + (Math.random() - 0.5) * 100,
            TABLE_TOP + TABLE_HEIGHT * 0.5 + (Math.random() - 0.5) * 100,
            colors[i % colors.length],
            false,  // 非母球
            i + 1
        );
        balls.push(ball);
    }
    
    // 设置初始分数
    score = 0;
    
    // 添加分数显示
    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score';
    scoreDiv.style.position = 'absolute';
    scoreDiv.style.top = '10px';
    scoreDiv.style.left = '10px';
    scoreDiv.style.color = 'black';
    scoreDiv.style.fontSize = '20px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.textContent = '得分: 0';
    document.body.appendChild(scoreDiv);
    
    // 开始游戏循环
    gameLoop();
    
    console.log('游戏初始化完成');
}

/**
 * 调整画布大小以适应屏幕
 */
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // 如果是竖屏，交换宽高
    if (window.innerHeight > window.innerWidth) {
        // 在竖屏模式下，宽度和高度需要交换
        width = window.innerHeight;
        height = window.innerWidth;
    }
    
    // 保持宽高比
    const aspectRatio = 2; // 宽:高 = 2:1
    
    if (width / height > aspectRatio) {
        // 如果屏幕太宽，以高度为基准
        width = height * aspectRatio;
    } else {
        // 如果屏幕太高，以宽度为基准
        height = width / aspectRatio;
    }
    
    // 设置画布大小
    canvas.width = width;
    canvas.height = height;
    
    // 在电脑端使用固定尺寸，在移动端使用相对尺寸
    if (!isMobileDevice && width >= 1200) {
        // 电脑端使用固定尺寸
        TABLE_WIDTH = 900;
        TABLE_HEIGHT = 450;
        BALL_RADIUS = 12;
        CUSHION_HEIGHT = 30;
    } else {
        // 移动端或小屏幕设备使用相对尺寸
        TABLE_WIDTH = width * 0.8;
        TABLE_HEIGHT = height * 0.8;
        BALL_RADIUS = Math.min(TABLE_WIDTH, TABLE_HEIGHT) * 0.02;
        CUSHION_HEIGHT = BALL_RADIUS * 2;
    }
    
    // 更新相关位置
    TABLE_LEFT = (width - TABLE_WIDTH) / 2;
    TABLE_TOP = (height - TABLE_HEIGHT) / 2;
    TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH;
    TABLE_BOTTOM = TABLE_TOP + TABLE_HEIGHT;
    POCKET_RADIUS = BALL_RADIUS * 1.5;
    
    // 更新口袋位置
    if (table) {
        table.updatePockets();
    }
    
    // 更新UI元素位置
    const powerBar = document.getElementById('power-bar');
    if (powerBar) {
        // 将力度条放在台球桌下方中央位置
        powerBar.style.left = '50%';
        powerBar.style.bottom = '30px';
        powerBar.style.transform = 'translateX(-50%)';
        powerBar.style.width = `${Math.min(300, TABLE_WIDTH * 0.5)}px`;
    }
}

/**
 * 初始化音频系统
 */
function initAudio() {
    try {
        // 创建音频上下文
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 初始化音频对象
        audioBuffers = {
            [SOUND_TYPES.BALL_HIT]: new Audio('./audio/ball_hit.mp3'),
            [SOUND_TYPES.WALL_HIT]: new Audio('./audio/wall_hit.mp3'),
            [SOUND_TYPES.POCKET]: new Audio('./audio/pocket.mp3')
        };

        // 预加载所有音频
        Object.values(audioBuffers).forEach(audio => {
            audio.load();
        });
    } catch (e) {
        console.warn('音频初始化失败:', e);
    }
}

/**
 * 播放音效
 * @param {string} type - 音效类型
 */
function playSound(type) {
    try {
        if (audioBuffers[type]) {
            // 如果音频正在播放，重置它
            const audio = audioBuffers[type];
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.warn('播放音效失败:', e);
            });
        }
    } catch (e) {
        console.warn('播放音效失败:', e);
    }
}

/**
 * 添加事件监听
 */
function addEventListeners() {
    // 显示桌面控制提示，隐藏移动控制提示
    const desktopControls = document.querySelectorAll('.desktop-control');
    const mobileControls = document.querySelectorAll('.mobile-control');
    
    if (isMobileDevice) {
        desktopControls.forEach(el => el.classList.add('d-none'));
        mobileControls.forEach(el => el.classList.remove('d-none'));
    } else {
        desktopControls.forEach(el => el.classList.remove('d-none'));
        mobileControls.forEach(el => el.classList.add('d-none'));
    }

    // 鼠标移动事件 - 瞄准
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        
        if (gameState === GAME_STATE.AIMING) {
            // 计算瞄准角度
            const dx = mouseX - cueBall.x;
            const dy = mouseY - cueBall.y;
            aimingAngle = Math.atan2(dy, dx);
        }
    });
    
    // 触摸移动事件 - 瞄准
    canvas.addEventListener('touchmove', (e) => {
        if (gameState === GAME_STATE.AIMING) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            
            // 获取触摸坐标
            let touchX = touch.clientX - rect.left;
            let touchY = touch.clientY - rect.top;
            
            // 如果是竖屏模式，需要转换坐标
            if (window.innerHeight > window.innerWidth) {
                // 在竖屏模式下，触摸坐标需要转换
                // 注意：这里的转换逻辑需要与CSS中的transform匹配
                const tempX = touchY;
                touchY = rect.width - touchX;
                touchX = tempX;
            }
            
            // 计算瞄准角度
            const dx = touchX - cueBall.x;
            const dy = touchY - cueBall.y;
            aimingAngle = Math.atan2(dy, dx);
        }
    }, { passive: false });
    
    // 触摸开始事件 - 准备蓄力
    canvas.addEventListener('touchstart', (e) => {
        if (gameState === GAME_STATE.AIMING) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            
            // 获取触摸坐标
            touchStartX = touch.clientX - rect.left;
            touchStartY = touch.clientY - rect.top;
            
            // 如果是竖屏模式，需要转换坐标
            if (window.innerHeight > window.innerWidth) {
                // 在竖屏模式下，触摸坐标需要转换
                const tempX = touchStartY;
                touchStartY = rect.width - touchStartX;
                touchStartX = tempX;
            }
            
            // 长按开始蓄力
            touchTimeout = setTimeout(() => {
            isPoweringUp = true;
                powerLevel = 0;
                document.getElementById('power-bar').classList.remove('d-none');
            document.getElementById('power-bar').classList.add('power-bar-active');
            }, 500);
        }
    }, { passive: false });
    
    // 触摸结束事件 - 击球
    canvas.addEventListener('touchend', (e) => {
        if (gameState === GAME_STATE.AIMING) {
            e.preventDefault();
            
            // 清除长按计时器
            clearTimeout(touchTimeout);
            
            // 如果正在蓄力，则击球
            if (isPoweringUp) {
            shootCueBall();
            isPoweringUp = false;
                document.getElementById('power-bar').classList.add('d-none');
            document.getElementById('power-bar').classList.remove('power-bar-active');
                document.getElementById('power-fill').style.width = '0%';
        }
        }
    }, { passive: false });
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        // 空格键 - 蓄力
        if (e.code === 'Space' && gameState === GAME_STATE.AIMING && !isPoweringUp) {
            isPoweringUp = true;
            powerLevel = 0;
            document.getElementById('power-bar').classList.remove('d-none');
            document.getElementById('power-bar').classList.add('power-bar-active');
        }
        
        // ESC键 - 显示菜单
        if (e.code === 'Escape') {
                showMenu();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        // 空格键释放 - 击球
        if (e.code === 'Space' && isPoweringUp) {
            shootCueBall();
            isPoweringUp = false;
            document.getElementById('power-bar').classList.add('d-none');
            document.getElementById('power-bar').classList.remove('power-bar-active');
            document.getElementById('power-fill').style.width = '0%';
        }
    });
    
    // 开始游戏按钮
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // 退出游戏按钮
    document.getElementById('quitButton').addEventListener('click', () => {
        window.close();
    });
    
    // 窗口大小改变事件
    window.addEventListener('resize', () => {
        // 重新检测设备类型
        isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
        
        console.log("窗口大小改变，设备类型:", isMobileDevice ? "移动设备" : "桌面设备");
        
        // 重新调整画布大小
        resizeCanvas();
        
        // 更新控制提示显示
        const desktopControls = document.querySelectorAll('.desktop-control');
        const mobileControls = document.querySelectorAll('.mobile-control');
        
        if (isMobileDevice) {
            desktopControls.forEach(el => el.classList.add('d-none'));
            mobileControls.forEach(el => el.classList.remove('d-none'));
        } else {
            desktopControls.forEach(el => el.classList.remove('d-none'));
            mobileControls.forEach(el => el.classList.add('d-none'));
        }
    });
    
    // 屏幕方向改变事件
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // 重新调整画布大小
            resizeCanvas();
        }, 300);
    });
}

/**
 * 显示菜单
 */
function showMenu() {
    gameState = GAME_STATE.MENU;
    document.getElementById('menu').classList.remove('d-none');
    document.getElementById('game-status').classList.add('d-none');
    document.getElementById('power-bar').classList.add('d-none');
    
    // 绘制背景
    if (ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        table.draw(ctx);
    }
}

/**
 * 隐藏菜单
 */
function hideMenu() {
    document.getElementById('menu').classList.add('d-none');
    document.getElementById('game-status').classList.remove('d-none');
    document.getElementById('power-bar').classList.remove('d-none');
}

/**
 * 开始新游戏
 */
function startGame() {
    console.log('开始新游戏');
    // 隐藏菜单
    hideMenu();
    
    // 重置游戏状态
    score = 0;
    shots = 0;
    powerLevel = 0;
    isAiming = true;
    updateStatusDisplay();
    
    // 创建球
    createBalls();
    
    // 设置游戏状态为瞄准
    gameState = GAME_STATE.AIMING;
    
    // 显示游戏状态UI
    document.getElementById('game-status').classList.remove('d-none');
    document.getElementById('power-bar').classList.add('d-none');
    
    // 显示开始游戏提示
    showTooltip('游戏开始！使用鼠标瞄准，空格键蓄力击球', canvas.width/2, canvas.height - 50);
}

/**
 * 创建台球
 */
function createBalls() {
    balls = [];
    
    // 计算球的位置
    const centerX = TABLE_LEFT + TABLE_WIDTH / 2;
    const centerY = TABLE_TOP + TABLE_HEIGHT / 2;
    
    // 母球位置（左侧四分之一处）
    const cueBallX = TABLE_LEFT + TABLE_WIDTH / 4;
    const cueBallY = centerY;
    
    // 创建母球
    cueBall = new Ball(cueBallX, cueBallY, WHITE, true);
    balls.push(cueBall);
    
    // 创建三角形排列的彩球
    const startX = centerX + TABLE_WIDTH / 4;  // 右侧四分之一处
    const startY = centerY;
    const ballSpacing = BALL_RADIUS * 2.1;  // 球之间的间距
    
    // 球的颜色
    const colors = [
        YELLOW, BLUE, RED, '#800080', '#FFA500', '#008000', '#964B00', BLACK,
        YELLOW, BLUE, RED, '#800080', '#FFA500', '#008000', '#964B00'
    ];
    
    let ballCount = 0;
    
    // 创建三角形排列
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * ballSpacing * Math.cos(Math.PI / 6);
            const y = startY + (col - row / 2) * ballSpacing;
            
            if (ballCount < colors.length) {
                const isSolid = ballCount < 7;
                const number = ballCount + 1;
                const ball = new Ball(x, y, colors[ballCount], false, number);
                ball.isSolid = isSolid;
                ball.isStriped = !isSolid && number < 16;
                balls.push(ball);
                ballCount++;
            }
        }
    }
}

/**
 * 更新状态显示
 */
function updateStatusDisplay() {
    const scoreElement = document.getElementById('scoreText');
    const shotsElement = document.getElementById('shotsText');
    
    // 添加分数更新动画
    scoreElement.textContent = `得分: ${score}`;
    scoreElement.classList.add('score-update');
    setTimeout(() => {
        scoreElement.classList.remove('score-update');
    }, 300);
    
    shotsElement.textContent = `击球次数: ${shots}`;
}

/**
 * 显示提示信息
 * @param {string} message - 提示信息
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
function showTooltip(message, x, y) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(tooltip);
        }, 300);
    }, 1500);
}

/**
 * 击打母球
 */
function shootCueBall() {
    if (gameState !== GAME_STATE.AIMING || !cueBall) return;
    
    // 计算击球力度和方向
    const power = powerLevel * 20;  // 根据力度条计算实际力度
    
    // 计算速度分量
    const vx = Math.cos(aimingAngle) * power;
    const vy = Math.sin(aimingAngle) * power;
    
    // 设置母球速度 - 确保使用正确的属性名
    cueBall.velocityX = vx;
    cueBall.velocityY = vy;
    cueBall.inMotion = true;
    
    console.log("击球:", vx, vy, power, aimingAngle);
    
    // 应用旋转效果（如果有）
    if (typeof spinSystem !== 'undefined' && spinSystem) {
        spinSystem.applySpinToBall(cueBall);
    }
    
    // 播放击球音效
    playSound('ball_hit');
    
    // 增加击球次数
    shots++;
    updateStatusDisplay();
    
    // 更新游戏状态
    gameState = GAME_STATE.BALLS_MOVING;
    
    // 重置旋转系统（如果有）
    if (typeof spinSystem !== 'undefined' && spinSystem) {
        spinSystem.reset();
    }
    
    // 隐藏力度条
    document.getElementById('power-bar').classList.add('d-none');
    document.getElementById('power-fill').style.width = '0%';
}

/**
 * 检查所有球是否都停止运动
 * @returns {boolean} 如果所有球都停止运动，返回true
 */
function areBallsStopped() {
    for (const ball of balls) {
        if (!ball.pocketed && (ball.inMotion || Math.abs(ball.velocityX) > 0.1 || Math.abs(ball.velocityY) > 0.1)) {
            return false;
        }
    }
    return true;
}

/**
 * 检查游戏是否结束（所有非母球都进袋）
 * @returns {boolean} - 游戏是否结束
 */
function isGameOver() {
    for (const ball of balls) {
        if (!ball.isCue && !ball.pocketed) return false;
    }
    return true;
}

// 添加星光动画系统
class PocketAnimation {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.createTime = Date.now();
        this.duration = 600; // 减少动画持续时间，从1000ms改为600ms
        
        // 创建粒子
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                angle: Math.random() * Math.PI * 2,
                speed: 2 + Math.random() * 3, // 增加速度，从1-3改为2-5
                size: 3 + Math.random() * 5,
                color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`, // 金色系
                alpha: 1
            });
        }
    }
    
    update() {
        const elapsed = Date.now() - this.createTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // 更新每个粒子
        for (let particle of this.particles) {
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;
            particle.alpha = 1 - progress;
            particle.size -= progress * 0.1;
        }
        
        // 返回动画是否结束
        return progress < 1;
    }
    
    draw(ctx) {
        for (let particle of this.particles) {
            if (particle.alpha <= 0) continue;
            
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            // 绘制星形
            const spikes = 5;
            const outerRadius = particle.size;
            const innerRadius = particle.size / 2;
            
            ctx.beginPath();
            let rot = Math.PI / 2 * 3;
            let x = particle.x;
            let y = particle.y;
            let step = Math.PI / spikes;
            
            ctx.moveTo(x, y - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = particle.x + Math.cos(rot) * outerRadius;
                y = particle.y + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;
                
                x = particle.x + Math.cos(rot) * innerRadius;
                y = particle.y + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(particle.x, particle.y - outerRadius);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}

/**
 * 游戏主循环
 */
function gameLoop() {
    // 检查游戏状态
    if (gameState === GAME_STATE.GAME_OVER) {
        showMenu();
        return;
    }
    
    // 请求下一帧
    requestAnimationFrame(gameLoop);
    
    // 清除画布 - 扩大清除区域以覆盖球杆的整个旋转范围
    const frameWidth = CUSHION_HEIGHT * 2;
    const cueLength = 360; // 球杆长度
    const clearMargin = cueLength + 20; // 额外的清除边距
    
    ctx.clearRect(
        TABLE_LEFT - frameWidth - clearMargin, 
        TABLE_TOP - frameWidth - clearMargin,
        TABLE_WIDTH + frameWidth * 2 + clearMargin * 2, 
        TABLE_HEIGHT + frameWidth * 2 + clearMargin * 2
    );
    
    // 绘制台球桌
    table.draw(ctx);
    
    // 更新和绘制星光动画
    pocketAnimations = pocketAnimations.filter(animation => {
        const isActive = animation.update();
        if (isActive) {
            animation.draw(ctx);
        }
        return isActive;
    });
    
    // 绘制球
    for (let i = 0; i < balls.length; i++) {
        balls[i].draw(ctx);
    }
    
    // 根据游戏状态执行不同逻辑
    switch (gameState) {
        case GAME_STATE.AIMING:
            // 更新力度条
            if (isPoweringUp) {
                // 增加力度，但不超过1
                powerLevel = Math.min(powerLevel + 0.02, 1);
                const powerBar = document.getElementById('power-fill');
                if (powerBar) {
                    powerBar.style.width = `${powerLevel * 100}%`;
                }
            }
            
            // 绘制瞄准线
            drawAimingLine();
            
            // 绘制球杆
            drawCue(aimingAngle);
            break;
            
        case GAME_STATE.BALLS_MOVING:
            // 更新球的位置
            updateBalls();
            
            // 检查是否所有球都停止运动
            if (areBallsStopped()) {
                gameState = GAME_STATE.AIMING;
                powerLevel = 0;  // 重置力度
                
                // 检查游戏是否结束
                if (isGameOver()) {
                    gameState = GAME_STATE.GAME_OVER;
                    showMessage("游戏结束！得分: " + score);
                }
            }
            break;
    }
    
    // 检查球是否进袋
    checkPockets();
}

/**
 * 更新所有球的位置和状态
 */
function updateBalls() {
    let allStopped = true;
    
    // 移动每个球
    for (const ball of balls) {
        if (!ball.pocketed) {
            if (ball.inMotion || Math.abs(ball.velocityX) > 0.1 || Math.abs(ball.velocityY) > 0.1) {
                ball.move();
                allStopped = false;
            }
        }
    }
    
    // 检查球之间的碰撞
    for (let i = 0; i < balls.length; i++) {
        if (balls[i].pocketed) continue;
        
        for (let j = i + 1; j < balls.length; j++) {
            if (balls[j].pocketed) continue;
            
            if (checkCollision(balls[i], balls[j])) {
                allStopped = false;
            }
        }
    }
    
    // 检查球是否进袋
    checkPockets();
    
    // 如果所有球都停止了，切换回瞄准状态
    if (allStopped && gameState === GAME_STATE.BALLS_MOVING) {
        gameState = GAME_STATE.AIMING;
        console.log("所有球停止移动，切换回瞄准状态");
    }
}

/**
 * 重置游戏状态
 */
function resetGame() {
    // 重置所有球的状态
    for (const ball of balls) {
        if (ball.isCue) {
            // 重置母球位置
            ball.pocketed = false;
            ball.x = 300;
            ball.y = WINDOW_HEIGHT / 2;
            ball.velocityX = 0;
            ball.velocityY = 0;
            ball.inMotion = false;
        } else {
            // 移除已进袋的球
            ball.pocketed = true;
        }
    }
    
    // 重置游戏状态
    gameState = GAME_STATE.AIMING;
    powerLevel = 0;
    document.getElementById('power-fill').style.width = '0%';
    
    // 更新显示
                updateStatusDisplay();
    
    // 延迟一段时间后开始新的回合
    setTimeout(() => {
        startNewRound();
    }, 1000);
}

/**
 * 开始新的回合
 */
function startNewRound() {
    // 重置所有非母球
    for (const ball of balls) {
            if (!ball.isCue) {
            ball.pocketed = false;
            // 随机分配新位置（确保不与其他球重叠）
            let validPosition = false;
            while (!validPosition) {
                ball.x = TABLE_LEFT + BALL_RADIUS + Math.random() * (TABLE_RIGHT - TABLE_LEFT - 2 * BALL_RADIUS);
                ball.y = TABLE_TOP + BALL_RADIUS + Math.random() * (TABLE_BOTTOM - TABLE_TOP - 2 * BALL_RADIUS);
                validPosition = true;
                // 检查与其他球的重叠
                for (const otherBall of balls) {
                    if (otherBall !== ball && !otherBall.pocketed) {
                        const dx = ball.x - otherBall.x;
                        const dy = ball.y - otherBall.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < BALL_RADIUS * 2.2) { // 留一点额外空间
                            validPosition = false;
                            break;
                        }
                    }
                }
            }
            ball.velocityX = 0;
            ball.velocityY = 0;
            ball.inMotion = false;
        }
    }
    
    // 更新游戏状态
    gameState = GAME_STATE.AIMING;
                updateStatusDisplay();
            }

/**
 * 计算预测路径
 * @param {Ball} ball - 球对象
 * @param {number} angle - 瞄准角度
 * @param {number} power - 力度
 * @returns {Array} - 路径点数组，每个点包含位置和状态信息
 */
function calculatePredictedPath(ball, angle, power) {
    const MAX_BOUNCES = 3;  // 最大反弹次数
    const MAX_LENGTH = Math.sqrt((TABLE_RIGHT - TABLE_LEFT)**2 + (TABLE_BOTTOM - TABLE_TOP)**2) * 2;  // 最大路径长度
    const CUSHION_ENERGY_LOSS = 0.7;  // 库边碰撞能量保持率
    
    let path = [];
    let currentPoint = { x: ball.x, y: ball.y };
    let currentAngle = angle;
    let currentPower = power;
    let totalLength = 0;
    let bounceCount = 0;
    let segmentType = 'initial';  // 'initial', 'cushion', 'ball'
    let hitBall = false;  // 是否已经击中球
    
    path.push({ ...currentPoint, type: segmentType });
    
    while (bounceCount < MAX_BOUNCES && totalLength < MAX_LENGTH && !hitBall) {
        // 计算当前方向的单位向量
        const dirX = Math.cos(currentAngle);
        const dirY = Math.sin(currentAngle);
        
        // 计算到各边界的距离
        let minDist = Infinity;
        let nextPoint = { x: currentPoint.x, y: currentPoint.y };
        let nextAngle = currentAngle;
        let collisionType = null;
        let collidedBall = null;
        
        // 1. 检查球碰撞（优先级最高）
        for (const targetBall of balls) {
            if (targetBall === ball || targetBall.pocketed) continue;
            
            // 计算球心连线
            const dx = targetBall.x - currentPoint.x;
            const dy = targetBall.y - currentPoint.y;
            
            // 计算碰撞点
            const collisionDist = solveQuadraticEquation(
                dirX*dirX + dirY*dirY,
                2*(dirX*(currentPoint.x - targetBall.x) + dirY*(currentPoint.y - targetBall.y)),
                (currentPoint.x - targetBall.x)**2 + (currentPoint.y - targetBall.y)**2 - (2*BALL_RADIUS)**2
            );
            
            if (collisionDist && collisionDist < minDist) {
                minDist = collisionDist;
                
                // 计算碰撞点
                const collisionX = currentPoint.x + dirX * collisionDist;
                const collisionY = currentPoint.y + dirY * collisionDist;
                
                // 计算碰撞法线（从目标球指向白球的单位向量）
                const normalX = (collisionX - targetBall.x) / BALL_RADIUS;
                const normalY = (collisionY - targetBall.y) / BALL_RADIUS;
                
                // 计算目标球的运动方向（沿碰撞法线的反方向）
                const targetBallAngle = Math.atan2(-normalY, -normalX);
                
                nextPoint = {
                    x: collisionX,
                    y: collisionY,
                    targetBallX: targetBall.x,
                    targetBallY: targetBall.y,
                    targetBallAngle: targetBallAngle
                };
                
                collisionType = 'ball';
                collidedBall = targetBall;
            }
        }
        
        // 2. 检查库边碰撞
        // 左边界
        const distToLeft = (TABLE_LEFT + BALL_RADIUS - currentPoint.x) / dirX;
        if (distToLeft > 0 && distToLeft < minDist) {
            minDist = distToLeft;
            nextPoint = {
                x: TABLE_LEFT + BALL_RADIUS,
                y: currentPoint.y + dirY * distToLeft
            };
            nextAngle = Math.PI - currentAngle;
            collisionType = 'cushion';
        }
        
        // 右边界
        const distToRight = (TABLE_RIGHT - BALL_RADIUS - currentPoint.x) / dirX;
        if (distToRight > 0 && distToRight < minDist) {
            minDist = distToRight;
            nextPoint = {
                x: TABLE_RIGHT - BALL_RADIUS,
                y: currentPoint.y + dirY * distToRight
            };
            nextAngle = Math.PI - currentAngle;
            collisionType = 'cushion';
        }
        
        // 上边界
        const distToTop = (TABLE_TOP + BALL_RADIUS - currentPoint.y) / dirY;
        if (distToTop > 0 && distToTop < minDist) {
            minDist = distToTop;
            nextPoint = {
                x: currentPoint.x + dirX * distToTop,
                y: TABLE_TOP + BALL_RADIUS
            };
            nextAngle = -currentAngle;
            collisionType = 'cushion';
        }
        
        // 下边界
        const distToBottom = (TABLE_BOTTOM - BALL_RADIUS - currentPoint.y) / dirY;
        if (distToBottom > 0 && distToBottom < minDist) {
            minDist = distToBottom;
            nextPoint = {
                x: currentPoint.x + dirX * distToBottom,
                y: TABLE_BOTTOM - BALL_RADIUS
            };
            nextAngle = -currentAngle;
            collisionType = 'cushion';
        }
        
        // 3. 检查是否进袋
        for (const pocket of table.pockets) {
            const dx = pocket.x - currentPoint.x;
            const dy = pocket.y - currentPoint.y;
            const distToPocket = Math.sqrt(dx*dx + dy*dy);
            if (distToPocket < POCKET_DETECTION_RADIUS) {
                nextPoint = pocket;
                path.push({ ...nextPoint, type: 'pocket' });
                return path;
            }
        }
        
        // 更新路径
        if (collisionType) {
            path.push({ ...nextPoint, type: collisionType });
            
            // 如果是球碰撞，添加目标球的预测路径并终止白球路径
            if (collisionType === 'ball' && nextPoint.targetBallAngle !== undefined) {
                hitBall = true;  // 标记已击中球，不再继续白球路径
                
                // 从目标球中心开始计算目标球路径
                let tbCurrentPoint = { 
                    x: nextPoint.targetBallX, 
                    y: nextPoint.targetBallY 
                };
                let tbCurrentAngle = nextPoint.targetBallAngle;
                let tbBounceCount = 0;
                let tbTotalLength = 0;
                
                // 添加目标球起始点
                path.push({ 
                    x: tbCurrentPoint.x, 
                    y: tbCurrentPoint.y, 
                    type: 'targetBallStart' 
                });
                
                // 计算目标球路径
                while (tbBounceCount < MAX_BOUNCES - bounceCount && tbTotalLength < MAX_LENGTH / 2) {
                    const tbDirX = Math.cos(tbCurrentAngle);
                    const tbDirY = Math.sin(tbCurrentAngle);
                    
                    // 检查目标球的库边碰撞
                    let tbMinDist = Infinity;
                    let tbNextPoint = { x: tbCurrentPoint.x, y: tbCurrentPoint.y };
                    let tbNextAngle = tbCurrentAngle;
                    let tbCollisionType = null;
                    
                    // 左边界
                    const tbDistToLeft = (TABLE_LEFT + BALL_RADIUS - tbCurrentPoint.x) / tbDirX;
                    if (tbDistToLeft > 0 && tbDistToLeft < tbMinDist) {
                        tbMinDist = tbDistToLeft;
                        tbNextPoint = {
                            x: TABLE_LEFT + BALL_RADIUS,
                            y: tbCurrentPoint.y + tbDirY * tbDistToLeft
                        };
                        tbNextAngle = Math.PI - tbCurrentAngle;
                        tbCollisionType = 'targetBallCushion';
                    }
                    
                    // 右边界
                    const tbDistToRight = (TABLE_RIGHT - BALL_RADIUS - tbCurrentPoint.x) / tbDirX;
                    if (tbDistToRight > 0 && tbDistToRight < tbMinDist) {
                        tbMinDist = tbDistToRight;
                        tbNextPoint = {
                            x: TABLE_RIGHT - BALL_RADIUS,
                            y: tbCurrentPoint.y + tbDirY * tbDistToRight
                        };
                        tbNextAngle = Math.PI - tbCurrentAngle;
                        tbCollisionType = 'targetBallCushion';
                    }
                    
                    // 上边界
                    const tbDistToTop = (TABLE_TOP + BALL_RADIUS - tbCurrentPoint.y) / tbDirY;
                    if (tbDistToTop > 0 && tbDistToTop < tbMinDist) {
                        tbMinDist = tbDistToTop;
                        tbNextPoint = {
                            x: tbCurrentPoint.x + tbDirX * tbDistToTop,
                            y: TABLE_TOP + BALL_RADIUS
                        };
                        tbNextAngle = -tbCurrentAngle;
                        tbCollisionType = 'targetBallCushion';
                    }
                    
                    // 下边界
                    const tbDistToBottom = (TABLE_BOTTOM - BALL_RADIUS - tbCurrentPoint.y) / tbDirY;
                    if (tbDistToBottom > 0 && tbDistToBottom < tbMinDist) {
                        tbMinDist = tbDistToBottom;
                        tbNextPoint = {
                            x: tbCurrentPoint.x + tbDirX * tbDistToBottom,
                            y: TABLE_BOTTOM - BALL_RADIUS
                        };
                        tbNextAngle = -tbCurrentAngle;
                        tbCollisionType = 'targetBallCushion';
                    }
                    
                    // 检查目标球是否进袋
                    for (const pocket of table.pockets) {
                        const tbDx = pocket.x - tbCurrentPoint.x;
                        const tbDy = pocket.y - tbCurrentPoint.y;
                        const tbDistToPocket = Math.sqrt(tbDx*tbDx + tbDy*tbDy);
                        if (tbDistToPocket < POCKET_DETECTION_RADIUS) {
                            tbNextPoint = pocket;
                            path.push({ ...tbNextPoint, type: 'targetBallPocket' });
                            return path;
                        }
                    }
                    
                    // 更新目标球路径
                    if (tbCollisionType) {
                        path.push({ ...tbNextPoint, type: tbCollisionType });
                        tbCurrentPoint = tbNextPoint;
                        tbCurrentAngle = tbNextAngle;
                        tbBounceCount++;
                    } else {
                        // 无碰撞，直接延伸到最大长度
                        const tbRemainingLength = MAX_LENGTH / 2 - tbTotalLength;
                        tbNextPoint = {
                            x: tbCurrentPoint.x + tbDirX * tbRemainingLength,
                            y: tbCurrentPoint.y + tbDirY * tbRemainingLength
                        };
                        path.push({ ...tbNextPoint, type: 'targetBall' });
                        break;
                    }
                    
                    tbTotalLength += tbMinDist;
                }
                
                break;  // 终止白球路径计算
            }
            
            currentPoint = nextPoint;
            currentAngle = nextAngle;
            bounceCount++;
            
            // 库边碰撞能量损失
            if (collisionType === 'cushion') {
                currentPower *= CUSHION_ENERGY_LOSS;
            }
            
            segmentType = collisionType;
        } else {
            // 无碰撞，直接延伸到最大长度
            const remainingLength = MAX_LENGTH - totalLength;
            nextPoint = {
                x: currentPoint.x + dirX * remainingLength,
                y: currentPoint.y + dirY * remainingLength
            };
            path.push({ ...nextPoint, type: segmentType });
            break;
        }
        
        totalLength += minDist;
    }
    
    return path;
}

/**
 * 求解二次方程
 * @param {number} a - 二次项系数
 * @param {number} b - 一次项系数
 * @param {number} c - 常数项
 * @returns {number|null} - 最小的正根或null
 */
function solveQuadraticEquation(a, b, c) {
    const discriminant = b*b - 4*a*c;
    if (discriminant < 0) return null;
    
    const root1 = (-b + Math.sqrt(discriminant)) / (2*a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2*a);
    
    if (root1 > 0 && root2 > 0) {
        return Math.min(root1, root2);
    } else if (root1 > 0) {
        return root1;
    } else if (root2 > 0) {
        return root2;
    }
    
    return null;
}

/**
 * 绘制瞄准线
 */
function drawAimingLine() {
    if (gameState !== GAME_STATE.AIMING || cueBall.pocketed) return;
    
    // 不再重新计算瞄准角度，使用已经在鼠标/触摸事件中计算好的aimingAngle
    
    // 计算预测路径
    const predictedPath = calculatePredictedPath(cueBall, aimingAngle, powerLevel * 20);
    
    // 绘制预测路径
    for (let i = 0; i < predictedPath.length - 1; i++) {
        const current = predictedPath[i];
        const next = predictedPath[i + 1];
        
        // 设置线段样式
    ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = i === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
        
        // 在路径点绘制小圆点
        if (i < 3) {  // 只在前几个点绘制
        ctx.beginPath();
            ctx.arc(next.x, next.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        }
    }
}

/**
 * 绘制球杆
 * @param {number} angle - 球杆角度
 */
function drawCue(angle) {
    if (gameState !== GAME_STATE.AIMING || !cueBall) return;
    
    // 计算球杆长度和宽度（根据屏幕尺寸调整）
    const cueLength = Math.min(TABLE_WIDTH, TABLE_HEIGHT) * 0.4;
    const cueWidth = BALL_RADIUS * 0.7;
    
    // 计算球杆位置 - 修正蓄力方向
    // 蓄力时球杆向远离母球的方向移动，模拟真实击球动作
    const distanceFactor = isPoweringUp ? (1 + powerLevel * 0.5) : 1;
    const distance = BALL_RADIUS * 2 + cueLength * distanceFactor;
    const cueX = cueBall.x - Math.cos(angle) * distance;
    const cueY = cueBall.y - Math.sin(angle) * distance;
    
    // 保存当前上下文状态
    ctx.save();
    
    // 移动到球杆位置并旋转
    ctx.translate(cueX, cueY);
    ctx.rotate(angle);
    
    // 绘制球杆
    const gradient = ctx.createLinearGradient(0, -cueWidth/2, cueLength, cueWidth/2);
    gradient.addColorStop(0, '#8B4513');  // 深棕色
    gradient.addColorStop(0.2, '#D2691E');  // 浅棕色
    gradient.addColorStop(0.8, '#8B4513');  // 深棕色
    gradient.addColorStop(1, '#D2691E');  // 浅棕色
    
    ctx.fillStyle = gradient;
    
    // 球杆主体
    ctx.beginPath();
    ctx.moveTo(0, -cueWidth/2);
    ctx.lineTo(cueLength, -cueWidth/4);
    ctx.lineTo(cueLength, cueWidth/4);
    ctx.lineTo(0, cueWidth/2);
    ctx.closePath();
    ctx.fill();
    
    // 球杆尖端
    ctx.fillStyle = '#F5F5DC';  // 米色
    ctx.beginPath();
    ctx.moveTo(cueLength, -cueWidth/4);
    ctx.lineTo(cueLength + cueWidth, 0);
    ctx.lineTo(cueLength, cueWidth/4);
    ctx.closePath();
    ctx.fill();
    
    // 球杆装饰环
    const ringCount = 9;
    const ringSpacing = cueLength / (ringCount + 1);
    const ringWidth = cueWidth * 0.3;
    
    for (let i = 1; i <= ringCount; i++) {
        const ringPos = i * ringSpacing;
        const ringRadius = cueWidth/2 - (ringPos / cueLength) * (cueWidth/4);
        
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
        ctx.beginPath();
        ctx.rect(ringPos - ringWidth/2, -ringRadius, ringWidth, ringRadius * 2);
        ctx.fill();
        
        // 为黑色环添加高光
        if (i % 2 === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.rect(ringPos - ringWidth/2, -ringRadius, ringWidth, ringRadius * 0.3);
            ctx.fill();
        }
    }
    
    // 恢复上下文状态
    ctx.restore();
}

// 修改checkPockets函数，添加入袋动画
function checkPockets() {
    for (let i = balls.length - 1; i >= 0; i--) {
        const pocketIndex = table.checkPocket(balls[i]);
        if (pocketIndex !== -1) {
            // 播放入袋音效
            playSound('pocket');
            
            // 创建入袋动画
            const pocket = table.pockets[pocketIndex];
            pocketAnimations.push(new PocketAnimation(pocket.x, pocket.y));
            
            // 白球特殊处理
            if (balls[i].isCue) {
                // 白球进袋，重置位置
                balls[i].x = TABLE_LEFT + TABLE_WIDTH / 4;
                balls[i].y = TABLE_TOP + TABLE_HEIGHT / 2;
                balls[i].velocityX = 0;
                balls[i].velocityY = 0;
                
                // 显示提示
                showMessage("白球进袋！已重置位置");
            } else {
                // 非白球进袋，移除球
                balls.splice(i, 1);
                
                // 更新分数
                score += 10;
                updateScore();
            }
        }
    }
}

// 添加显示消息的函数
function showMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'game-message';
    messageDiv.textContent = text;
    messageDiv.style.position = 'absolute';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageDiv.style.color = 'white';
    messageDiv.style.padding = '10px 20px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.zIndex = '1000';
    
    document.body.appendChild(messageDiv);
    
    // 2秒后移除消息
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 2000);
}

// 更新分数显示
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `得分: ${score}`;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', init);