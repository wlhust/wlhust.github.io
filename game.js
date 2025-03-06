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
    // 获取Canvas和上下文
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('找不到Canvas元素');
        return;
    }
    
    canvas.width = WINDOW_WIDTH;
    canvas.height = WINDOW_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // 创建台球桌
    table = new Table();
    
    // 创建旋转系统
    spinSystem = new SpinSystem();
    
    // 初始化音频系统
    initAudio();
    
    // 添加事件监听
    addEventListeners();
    
    // 显示菜单
    showMenu();
    
    // 开始游戏循环
    gameLoop();
    
    console.log('游戏初始化完成');
}

/**
 * 初始化音频系统
 */
function initAudio() {
    try {
        // 创建音频上下文
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // 加载音效
        loadAudioFiles();
    } catch (e) {
        console.warn('Web Audio API不受支持，游戏将没有声音', e);
    }
}

/**
 * 加载音效文件
 */
function loadAudioFiles() {
    for (const [type, path] of Object.entries(AUDIO_FILES)) {
        fetch(path)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                audioBuffers[type] = audioBuffer;
            })
            .catch(e => console.error(`加载音效失败: ${path}`, e));
    }
}

/**
 * 播放音效
 * @param {string} type - 音效类型
 */
function playSound(type) {
    if (!audioContext || !audioBuffers[type]) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[type];
    source.connect(audioContext.destination);
    source.start(0);
}

/**
 * 添加事件监听
 */
function addEventListeners() {
    // 鼠标移动事件
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    
    // 键盘按下事件
    document.addEventListener('keydown', (e) => {
        // 空格键开始蓄力
        if (e.code === 'Space' && gameState === GAME_STATE.AIMING && !isPoweringUp) {
            isPoweringUp = true;
            document.getElementById('power-bar').style.display = 'block';
            // 添加动画类
            document.getElementById('power-bar').classList.add('power-bar-active');
        }
    });
    
    // 键盘释放事件
    document.addEventListener('keyup', (e) => {
        // 空格键释放，进行击球
        if (e.code === 'Space' && gameState === GAME_STATE.AIMING && isPoweringUp) {
            shootCueBall();
            isPoweringUp = false;
            document.getElementById('power-bar').style.display = 'none';
            document.getElementById('power-fill').style.width = '0%';
            // 移除动画类
            document.getElementById('power-bar').classList.remove('power-bar-active');
        }
    });
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        // ESC键显示菜单
        if (e.key === 'Escape') {
            if (gameState !== GAME_STATE.MENU) {
                showMenu();
            } else {
                hideMenu();
            }
        }
    });
    
    // 开始游戏按钮
    document.getElementById('startButton').addEventListener('click', () => {
        startGame();
    });
    
    // 退出游戏按钮
    document.getElementById('quitButton').addEventListener('click', () => {
        // 在实际应用中，这里可能会有保存游戏状态或返回主页的逻辑
        window.close();
    });
}

/**
 * 显示菜单
 */
function showMenu() {
    gameState = GAME_STATE.MENU;
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('game-status').style.display = 'none';
}

/**
 * 隐藏菜单
 */
function hideMenu() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-status').style.display = 'flex';
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
    document.getElementById('game-status').style.display = 'flex';
    document.getElementById('power-bar').style.display = 'none';
}

/**
 * 创建球
 */
function createBalls() {
    balls = [];
    
    // 创建母球
    cueBall = new Ball(300, WINDOW_HEIGHT / 2, WHITE, true);
    balls.push(cueBall);
    
    // 创建目标球（三角形排列）
    const startX = 800;
    const startY = WINDOW_HEIGHT / 2;
    const colors = [RED, YELLOW, BLUE, RED, BLACK, YELLOW, BLUE, RED, YELLOW, BLUE];
    
    let ballIndex = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col <= row; col++) {
            if (ballIndex < colors.length) {
                const x = startX + row * (BALL_RADIUS * 2 - 1);
                const y = startY - (row * BALL_RADIUS) + (col * BALL_RADIUS * 2);
                balls.push(new Ball(x, y, colors[ballIndex], false, ballIndex + 1));
                ballIndex++;
            }
        }
    }
}

/**
 * 更新状态显示
 */
function updateStatusDisplay() {
    document.getElementById('scoreText').textContent = `得分: ${score}`;
    document.getElementById('shotsText').textContent = `击球次数: ${shots}`;
}

/**
 * 射击母球
 */
function shootCueBall() {
    // 计算力度（0-40，翻倍）
    const power = powerLevel * 40;
    
    // 计算速度向量
    const vx = Math.cos(aimingAngle) * power;
    const vy = Math.sin(aimingAngle) * power;
    
    // 设置母球速度
    cueBall.velocityX = vx;
    cueBall.velocityY = vy;
    cueBall.inMotion = true;
    
    // 应用旋转效果
    spinSystem.applySpinToBall(cueBall);
    
    // 增加击球次数
    shots++;
    updateStatusDisplay();
    
    // 更新游戏状态
    gameState = GAME_STATE.BALLS_MOVING;
    
    // 重置旋转系统
    spinSystem.reset();
}

/**
 * 检查所有球是否停止运动
 * @returns {boolean} - 是否所有球都停止运动
 */
function areBallsStopped() {
    for (const ball of balls) {
        if (ball.inMotion) return false;
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

/**
 * 游戏主循环
 */
function gameLoop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制台球桌
    table.draw(ctx);
    
    // 根据游戏状态执行不同逻辑
    switch (gameState) {
        case GAME_STATE.PLAYING:
        case GAME_STATE.AIMING:
            // 绘制瞄准线
            if (!spinSystem.active) {
                drawAimingLine();
            }
            
            // 更新力度条
            if (isPoweringUp) {
                powerLevel = Math.min(powerLevel + 0.01, 1);
                document.getElementById('power-fill').style.width = `${powerLevel * 100}%`;
            }
            break;
            
        case GAME_STATE.BALLS_MOVING:
            // 更新球的位置
            updateBalls();
            
            // 检查所有球是否停止运动
            if (areBallsStopped()) {
                // 检查游戏是否结束
                if (isGameOver()) {
                    gameState = GAME_STATE.GAME_OVER;
                    setTimeout(() => {
                        alert(`游戏结束！你的得分：${score}，用了${shots}次击球`);
                        showMenu();
                    }, 1000);
                } else if (cueBall.pocketed) {
                    // 如果母球进袋，重置母球位置
                    cueBall.pocketed = false;
                    cueBall.x = 300;
                    cueBall.y = WINDOW_HEIGHT / 2;
                    cueBall.velocityX = 0;
                    cueBall.velocityY = 0;
                    gameState = GAME_STATE.AIMING;
                } else {
                    gameState = GAME_STATE.AIMING;
                }
                
                // 重置力度
                powerLevel = 0;
            }
            break;
    }
    
    // 绘制所有球
    for (const ball of balls) {
        ball.draw(ctx);
    }
    
    // 请求下一帧
    requestAnimationFrame(gameLoop);
}

/**
 * 更新所有球的位置和状态
 */
function updateBalls() {
    // 移动每个球
    for (const ball of balls) {
        if (!ball.pocketed && ball.inMotion) {
            ball.move();
        }
    }
    
    // 检查球之间的碰撞
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            checkCollision(balls[i], balls[j]);
        }
    }
    
    // 检查球是否进袋
    for (const ball of balls) {
        if (!ball.pocketed && table.checkPocket(ball)) {
            if (!ball.isCue) {
                // 非母球进袋得分
                score += 10;
                updateStatusDisplay();
            }
        }
    }
}

/**
 * 计算预测路径
 * @param {Ball} ball - 球对象
 * @param {number} angle - 瞄准角度
 * @param {number} power - 力度
 * @returns {Array} - 路径点数组
 */
function calculatePredictedPath(ball, angle, power) {
    const path = [{x: ball.x, y: ball.y}];
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;
    let x = ball.x;
    let y = ball.y;
    const steps = 20;
    
    for (let i = 0; i < steps; i++) {
        x += vx / steps;
        y += vy / steps;
        
        // 检查边界碰撞
        if (x - BALL_RADIUS <= TABLE_LEFT || x + BALL_RADIUS >= TABLE_RIGHT) {
            break;
        }
        if (y - BALL_RADIUS <= TABLE_TOP || y + BALL_RADIUS >= TABLE_BOTTOM) {
            break;
        }
        
        // 检查球的碰撞
        let hasCollision = false;
        for (const otherBall of balls) {
            if (otherBall !== ball && !otherBall.pocketed) {
                const dx = x - otherBall.x;
                const dy = y - otherBall.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < BALL_RADIUS * 2) {
                    hasCollision = true;
                    break;
                }
            }
        }
        if (hasCollision) break;
        
        path.push({x, y});
    }
    
    return path;
}

/**
 * 绘制瞄准线
 */
function drawAimingLine() {
    if (gameState !== GAME_STATE.AIMING || cueBall.pocketed) return;
    
    // 计算瞄准角度
    const dx = mouseX - cueBall.x;
    const dy = mouseY - cueBall.y;
    aimingAngle = Math.atan2(dy, dx);
    
    // 绘制主瞄准线
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cueBall.x, cueBall.y);
    const lineLength = 300;
    const endX = cueBall.x + Math.cos(aimingAngle) * lineLength;
    const endY = cueBall.y + Math.sin(aimingAngle) * lineLength;
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制球杆
    const cueDistance = BALL_RADIUS + 10 + powerLevel * 50;
    const cueStartX = cueBall.x - Math.cos(aimingAngle) * cueDistance;
    const cueStartY = cueBall.y - Math.sin(aimingAngle) * cueDistance;
    const cueEndX = cueBall.x - Math.cos(aimingAngle) * (cueDistance + 160);
    const cueEndY = cueBall.y - Math.sin(aimingAngle) * (cueDistance + 160);
    
    // 绘制球杆阴影
    ctx.beginPath();
    ctx.moveTo(cueStartX + 3, cueStartY + 3);
    ctx.lineTo(cueEndX + 3, cueEndY + 3);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // 绘制球杆
    ctx.beginPath();
    ctx.moveTo(cueStartX, cueStartY);
    ctx.lineTo(cueEndX, cueEndY);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    ctx.setLineDash([]);
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', init);