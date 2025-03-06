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
    
    // 设置画布尺寸
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
    
    // 初始绘制
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    table.draw(ctx);
    
    // 显示菜单
    document.getElementById('menu').classList.remove('d-none');
    
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
 * 创建球
 */
function createBalls() {
    balls = [];
    
    // 创建母球（位置调整到左侧1/4处）
    cueBall = new Ball(TABLE_LEFT + TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2 + TABLE_TOP, WHITE, true);
    balls.push(cueBall);
    
    // 创建目标球（标准三角形排列）
    const startX = TABLE_LEFT + TABLE_WIDTH * 0.75;  // 位置调整到右侧1/4处
    const startY = TABLE_HEIGHT / 2 + TABLE_TOP;
    
    // 定义球的位置和颜色
    const ballLayout = [
        { row: 0, col: 0, color: YELLOW },  // 顶点球
        
        { row: 1, col: -0.5, color: BLUE },  // 第二行
        { row: 1, col: 0.5, color: RED },
        
        { row: 2, col: -1, color: RED },    // 第三行
        { row: 2, col: 0, color: BLACK },
        { row: 2, col: 1, color: YELLOW },
        
        { row: 3, col: -1.5, color: YELLOW },  // 第四行
        { row: 3, col: -0.5, color: BLUE },
        { row: 3, col: 0.5, color: RED },
        { row: 3, col: 1.5, color: BLUE }
    ];
    
    // 计算球的间距（紧密相连）
    const spacing = BALL_RADIUS * 2;  // 球的直径
    const rowSpacing = spacing * Math.cos(Math.PI / 6);  // 行间距（等边三角形）
    
    // 放置所有球
    for (const ball of ballLayout) {
        const x = startX + ball.row * rowSpacing;
        const y = startY + ball.col * spacing;
        balls.push(new Ball(x, y, ball.color, false, balls.length));
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
    
    // 隐藏力度条
    document.getElementById('power-bar').classList.add('d-none');
    document.getElementById('power-fill').style.width = '0%';
}

/**
 * 检查所有球是否停止运动
 * @returns {boolean} - 是否所有球都停止运动
 */
function areBallsStopped() {
    for (const ball of balls) {
        if (!ball.pocketed && ball.inMotion) {
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

/**
 * 游戏主循环
 */
function gameLoop() {
    // 确保画布尺寸正确
    if (canvas.width !== WINDOW_WIDTH || canvas.height !== WINDOW_HEIGHT) {
        canvas.width = WINDOW_WIDTH;
        canvas.height = WINDOW_HEIGHT;
        canvas.style.width = `${WINDOW_WIDTH}px`;
        canvas.style.height = `${WINDOW_HEIGHT}px`;
        
        // 首次设置背景色
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 只清除台球桌区域（包括边框）
    const frameWidth = CUSHION_HEIGHT * 2;
    ctx.clearRect(
        TABLE_LEFT - frameWidth - 10, 
        TABLE_TOP - frameWidth - 10, 
        TABLE_WIDTH + (frameWidth + 10) * 2, 
        TABLE_HEIGHT + (frameWidth + 10) * 2
    );
    
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
                } else {
                    // 设置为瞄准状态，可以继续击球
                    gameState = GAME_STATE.AIMING;
                    powerLevel = 0;
                    document.getElementById('power-fill').style.width = '0%';
                }
            }
            break;
    }
    
    // 绘制所有球
    for (const ball of balls) {
        if (!ball.pocketed) {
            ball.draw(ctx);
        }
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
            if (ball.isCue) {
                // 白球进袋，重置位置
                ball.pocketed = false;
                ball.x = 300;
                ball.y = WINDOW_HEIGHT / 2;
                ball.velocityX = 0;
                ball.velocityY = 0;
                ball.inMotion = false;
                showTooltip('白球进袋！已重置位置', ball.x, ball.y - 30);
            } else {
                // 非白球进袋得分
                ball.pocketed = true;
                score += 10;
                updateStatusDisplay();
                showTooltip('+10分！', ball.x, ball.y - 30);
            }
        }
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
    
    // 计算瞄准角度
    const dx = mouseX - cueBall.x;
    const dy = mouseY - cueBall.y;
    aimingAngle = Math.atan2(dy, dx);
    
    // 计算预测路径
    const predictedPath = calculatePredictedPath(cueBall, aimingAngle, powerLevel * 20);
    
    // 绘制预测路径
    for (let i = 0; i < predictedPath.length - 1; i++) {
        const current = predictedPath[i];
        const next = predictedPath[i + 1];
        
        // 设置线段样式
        switch (next.type) {
            case 'initial':
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.setLineDash([]);
                break;
            case 'cushion':
                ctx.strokeStyle = 'rgba(0, 191, 255, 0.6)';  // 深天蓝色
                ctx.setLineDash([5, 5]);
                break;
            case 'ball':
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';  // 金色
                ctx.setLineDash([8, 4, 2, 4]);
                break;
            case 'targetBallStart':
                // 目标球起始点不绘制线段
                continue;
            case 'targetBall':
                ctx.strokeStyle = 'rgba(255, 69, 0, 0.7)';  // 红橙色
                ctx.setLineDash([]);
                break;
            case 'targetBallCushion':
                ctx.strokeStyle = 'rgba(255, 140, 0, 0.7)';  // 深橙色
                ctx.setLineDash([5, 5]);
                break;
            case 'targetBallPocket':
                ctx.strokeStyle = 'rgba(50, 205, 50, 0.7)';  // 酸橙绿
                ctx.setLineDash([]);
                break;
            case 'pocket':
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';  // 绿色
                ctx.setLineDash([]);
                break;
        }
        
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        
        // 目标球路径线更粗
        if (next.type.startsWith('targetBall')) {
            ctx.lineWidth = 3;
        } else {
            ctx.lineWidth = 2;
        }
        
        ctx.stroke();
        
        // 在碰撞点绘制标记
        if (next.type === 'ball' || next.type === 'cushion') {
            ctx.beginPath();
            ctx.arc(next.x, next.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = next.type === 'ball' ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0, 191, 255, 0.8)';
            ctx.fill();
        }
        
        // 在目标球路径碰撞点绘制标记
        if (next.type === 'targetBallCushion') {
            ctx.beginPath();
            ctx.arc(next.x, next.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 140, 0, 0.8)';
            ctx.fill();
        }
        
        // 在目标球路径终点绘制箭头
        if (next.type === 'targetBall' || next.type === 'targetBallPocket') {
            const arrowSize = 8;
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            
            ctx.beginPath();
            ctx.moveTo(next.x, next.y);
            ctx.lineTo(
                next.x - arrowSize * Math.cos(angle - Math.PI/6),
                next.y - arrowSize * Math.sin(angle - Math.PI/6)
            );
            ctx.lineTo(
                next.x - arrowSize * Math.cos(angle + Math.PI/6),
                next.y - arrowSize * Math.sin(angle + Math.PI/6)
            );
            ctx.closePath();
            ctx.fillStyle = next.type === 'targetBall' ? 'rgba(255, 69, 0, 0.8)' : 'rgba(50, 205, 50, 0.8)';
            ctx.fill();
        }
    }
    
    // 重置线型
    ctx.setLineDash([]);
    
    // 绘制球杆
    drawCue(aimingAngle);
}

/**
 * 绘制球杆
 * @param {number} angle - 瞄准角度
 */
function drawCue(angle) {
    const cueDistance = BALL_RADIUS + 10 + powerLevel * 50;
    const cueStartX = cueBall.x - Math.cos(angle) * cueDistance;
    const cueStartY = cueBall.y - Math.sin(angle) * cueDistance;
    const cueEndX = cueBall.x - Math.cos(angle) * (cueDistance + 160);
    const cueEndY = cueBall.y - Math.sin(angle) * (cueDistance + 160);
    
    // 绘制球杆阴影
    ctx.beginPath();
    ctx.moveTo(cueStartX + 4, cueStartY + 4);
    ctx.lineTo(cueEndX + 4, cueEndY + 4);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // 创建球杆渐变
    const gradient = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
    gradient.addColorStop(0, '#F5F5DC');  // 浅米色尖端
    gradient.addColorStop(0.05, '#F5DEB3'); // 小麦色过渡
    gradient.addColorStop(0.1, '#D2691E');  // 巧克力色
    gradient.addColorStop(0.3, '#8B4513');  // 马鞍棕色
    gradient.addColorStop(0.7, '#A0522D');  // 赤土棕色
    gradient.addColorStop(0.9, '#654321');  // 深棕色
    gradient.addColorStop(1, '#5C4033');    // 中棕色
    
    // 绘制球杆
    ctx.beginPath();
    ctx.moveTo(cueStartX, cueStartY);
    ctx.lineTo(cueEndX, cueEndY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // 绘制球杆高光
    ctx.beginPath();
    const highlightOffset = 2;
    const highlightStartX = cueStartX - Math.sin(angle) * highlightOffset;
    const highlightStartY = cueStartY + Math.cos(angle) * highlightOffset;
    const highlightEndX = cueEndX - Math.sin(angle) * highlightOffset;
    const highlightEndY = cueEndY + Math.cos(angle) * highlightOffset;
    
    ctx.moveTo(highlightStartX, highlightStartY);
    ctx.lineTo(highlightEndX, highlightEndY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // 绘制球杆尖端
    ctx.beginPath();
    ctx.arc(cueStartX, cueStartY, 5, 0, Math.PI * 2);
    
    // 创建尖端渐变
    const tipGradient = ctx.createRadialGradient(
        cueStartX - 1, cueStartY - 1, 0,
        cueStartX, cueStartY, 5
    );
    tipGradient.addColorStop(0, '#FFFFFF');
    tipGradient.addColorStop(0.7, '#F5F5DC');
    tipGradient.addColorStop(1, '#E6E6C8');
    
    ctx.fillStyle = tipGradient;
    ctx.fill();
    
    // 绘制尖端边缘
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制球杆装饰环
    const ringPositions = [
        { pos: 0.2, width: 8, color: '#000000' },
        { pos: 0.3, width: 5, color: '#FFFFFF' },
        { pos: 0.4, width: 5, color: '#000000' },
        { pos: 0.6, width: 5, color: '#FFFFFF' },
        { pos: 0.7, width: 5, color: '#000000' },
        { pos: 0.9, width: 8, color: '#000000' }
    ];
    
    for (const ring of ringPositions) {
        const ringPos = cueDistance + (cueDistance + 160 - cueDistance) * ring.pos;
        const ringX = cueBall.x - Math.cos(angle) * ringPos;
        const ringY = cueBall.y - Math.sin(angle) * ringPos;
        
        ctx.beginPath();
        ctx.arc(ringX, ringY, ring.width/2, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.fill();
        
        // 添加环的高光
        if (ring.color === '#000000') {
            ctx.beginPath();
            ctx.arc(
                ringX - Math.sin(angle) * 1.5,
                ringY + Math.cos(angle) * 1.5,
                ring.width/6, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', init);