/**
 * 旋转系统实现
 */
class SpinSystem {
    constructor() {
        this.active = false;
        this.spinButton = null;
        this.spinInterface = null;
        this.locatorPoint = null;
        this.enlargedBall = null;
        this.hitLine = null;
        this.spinParams = null;
        
        // 旋转参数
        this.hitPointX = 0;  // 水平偏移（左右旋）
        this.hitPointY = 0;  // 垂直偏移（上下旋）
        
        this.init();
    }
    
    /**
     * 初始化旋转系统
     */
    init() {
        // 创建旋转按钮
        this.createSpinButton();
        
        // 创建旋转界面
        this.createSpinInterface();
        
        // 添加事件监听
        this.addEventListeners();
    }
    
    /**
     * 创建旋转按钮
     */
    createSpinButton() {
        this.spinButton = document.createElement('div');
        this.spinButton.className = 'spin-button';
        
        const buttonInner = document.createElement('div');
        buttonInner.className = 'spin-button-inner';
        
        const arrow = document.createElement('div');
        arrow.className = 'spin-arrow';
        
        buttonInner.appendChild(arrow);
        this.spinButton.appendChild(buttonInner);
        
        document.getElementById('game-container').appendChild(this.spinButton);
    }
    
    /**
     * 创建旋转界面
     */
    createSpinInterface() {
        this.spinInterface = document.createElement('div');
        this.spinInterface.className = 'spin-interface';
        
        // 创建放大的球
        this.enlargedBall = document.createElement('div');
        this.enlargedBall.className = 'enlarged-ball';
        
        // 创建定位点
        this.locatorPoint = document.createElement('div');
        this.locatorPoint.className = 'locator-point';
        
        // 创建击打线
        this.hitLine = document.createElement('div');
        this.hitLine.className = 'hit-line';
        
        // 创建旋转参数显示
        this.spinParams = document.createElement('div');
        this.spinParams.className = 'spin-params';
        this.spinParams.innerHTML = '<p>旋转: 无</p>';
        
        // 创建说明
        const instructions = document.createElement('div');
        instructions.className = 'spin-instructions';
        instructions.innerHTML = `
            <p>拖动黑点设置击打位置</p>
            <p>上部: 上旋 - 增加前进速度</p>
            <p>下部: 下旋 - 可能产生回拉</p>
            <p>左右: 产生侧旋</p>
            <p>点击任意处关闭</p>
        `;
        
        // 组装界面
        this.enlargedBall.appendChild(this.locatorPoint);
        this.enlargedBall.appendChild(this.hitLine);
        this.spinInterface.appendChild(this.enlargedBall);
        this.spinInterface.appendChild(instructions);
        this.spinInterface.appendChild(this.spinParams);
        
        document.getElementById('game-container').appendChild(this.spinInterface);
    }
    
    /**
     * 添加事件监听
     */
    addEventListeners() {
        // 旋转按钮点击事件
        this.spinButton.addEventListener('click', () => {
            this.toggleSpinInterface();
        });
        
        // 旋转界面点击事件（关闭界面）
        this.spinInterface.addEventListener('click', (e) => {
            if (e.target === this.spinInterface) {
                this.hideSpinInterface();
            }
        });
        
        // 定位点拖动事件
        this.locatorPoint.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e);
        });
    }
    
    /**
     * 开始拖动定位点
     * @param {MouseEvent} e - 鼠标事件
     */
    startDrag(e) {
        e.preventDefault();
        
        const moveHandler = (moveEvent) => {
            this.dragLocator(moveEvent);
        };
        
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    }
    
    /**
     * 拖动定位点
     * @param {MouseEvent} e - 鼠标事件
     */
    dragLocator(e) {
        const ballRect = this.enlargedBall.getBoundingClientRect();
        const ballCenterX = ballRect.left + ballRect.width / 2;
        const ballCenterY = ballRect.top + ballRect.height / 2;
        
        // 计算相对于球中心的位置
        let dx = e.clientX - ballCenterX;
        let dy = e.clientY - ballCenterY;
        
        // 限制在球内
        const radius = ballRect.width / 2;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > radius - 8) {
            const angle = Math.atan2(dy, dx);
            dx = (radius - 8) * Math.cos(angle);
            dy = (radius - 8) * Math.sin(angle);
        }
        
        // 更新定位点位置
        this.locatorPoint.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // 更新旋转参数
        this.hitPointX = dx / (radius - 8);  // 归一化到 [-1, 1]
        this.hitPointY = dy / (radius - 8);  // 归一化到 [-1, 1]
        
        // 更新参数显示
        this.updateSpinParams();
    }
    
    /**
     * 更新旋转参数显示
     */
    updateSpinParams() {
        let spinType = '无';
        
        if (Math.abs(this.hitPointY) > 0.2) {
            spinType = this.hitPointY < 0 ? '上旋' : '下旋';
        }
        
        if (Math.abs(this.hitPointX) > 0.2) {
            spinType += (this.hitPointX < 0 ? ' 左旋' : ' 右旋');
        }
        
        this.spinParams.innerHTML = `<p>旋转: ${spinType}</p>`;
    }
    
    /**
     * 切换旋转界面显示状态
     */
    toggleSpinInterface() {
        if (this.spinInterface.style.display === 'flex') {
            this.hideSpinInterface();
        } else {
            this.showSpinInterface();
        }
    }
    
    /**
     * 显示旋转界面
     */
    showSpinInterface() {
        this.spinInterface.style.display = 'flex';
        this.active = true;
    }
    
    /**
     * 隐藏旋转界面
     */
    hideSpinInterface() {
        this.spinInterface.style.display = 'none';
        this.active = false;
    }
    
    /**
     * 应用旋转效果到球
     * @param {Ball} ball - 要应用旋转效果的球
     */
    applySpinToBall(ball) {
        if (!ball.isCue) return;
        
        // 设置球的旋转参数
        ball.hitPointY = this.hitPointY;
        
        // 计算角速度 - 主要由垂直偏移决定
        // 负值表示上旋，正值表示下旋
        ball.angularVelocity = -this.hitPointY * 5;
        
        // 侧旋效果 - 可以在后续版本中实现
    }
    
    /**
     * 重置旋转参数
     */
    reset() {
        this.hitPointX = 0;
        this.hitPointY = 0;
        this.locatorPoint.style.transform = 'translate(-50%, -50%)';
        this.updateSpinParams();
    }
}