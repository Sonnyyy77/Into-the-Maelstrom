// Initialize system
const eyeMask = document.getElementById('eyeMask');
const story = document.getElementById('story');
const myRoom = document.getElementById('myRoom');
const wallCanvas = document.getElementById('wallCanvas');
const sandstormCanvas = document.getElementById('sandstormCanvas');

// System parameters
const SYSTEM_CONFIG = {
    WINDOW: {
        WIDTH: 200,
        HEIGHT: 200,
        MAX_SPEED: 1.8,
        FRICTION: 0.94,
        ATTRACTION: 0.035
    },
    PHASE_TIMING: {
        OBJECT_DURATION: 15,    // Random objects
        TRANSITION_DURATION: 8, // Object to face
        FACE_DURATION: 0        // Human face
    },
    MAX_WINDOWS: 6,
    FACE_LAYOUT: [
        { x: 0.4, y: 0.28 },  // Left eye
        { x: 0.6, y: 0.28 },  // Right eye
        { x: 0.5,  y: 0.5 },  // Nose
        { x: 0.3, y: 0.45 },  // Left ear
        { x: 0.7, y: 0.45 },  // Right ear
        { x: 0.5,  y: 0.7 }    // Mouth
    ],
    PARTICLES: {
        COUNT: 2000,
        SIZE_RANGE: [1, 4],
        SPEED_RANGE: [1, 4]
    }
};

class DreamSimulation {
    constructor() {
        this.windows = [];
        this.particles = [];
        this.currentPhase = 0;
        this.windowScale = 1;
        this.isExpanding = false;

        this.windowScale = 1;
        this.isWindowExpanding = false;
        this.isWindowClicked = false;
        this.baseWindowSize = { 
            width: window.innerWidth * 0.6,
            height: window.innerHeight * 0.6 
        };

        this.windowLifetime = 10000; // 10秒
        this.creationInterval = 800; // 创建间隔
        this.isCreating = false;

        this.initCanvas();
        this.initParticles();
        this.initEventListeners();
    }

    // Initialize canvas
    initCanvas() {
        [wallCanvas, sandstormCanvas].forEach(canvas => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        // 初始化时隐藏
        wallCanvas.style.visibility = 'hidden';
        sandstormCanvas.style.visibility = 'hidden';
        
        this.updateSandstormMask();

        // 绘制初始窗口框架
        this.drawWall();

        window.addEventListener('resize', () => {
            // [wallCanvas, sandstormCanvas].forEach(canvas => {
            //     canvas.width = window.innerWidth;
            //     canvas.height = window.innerHeight;
            // });
            // this.drawWall(); // 调整大小时重绘
            this.baseWindowSize = {
                width: window.innerWidth * 0.7,
                height: window.innerHeight * 0.7
            };
            this.updateSandstormMask();
            this.drawWall();
        });
    }

    // 更新沙尘暴遮罩（关键修改）
    updateSandstormMask() {
        const ctx = sandstormCanvas.getContext('2d');
        ctx.save();
        
        // 创建裁剪路径
        ctx.beginPath();
        const windowRect = this.getCurrentWindowRect();
        ctx.rect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
        ctx.clip();
        
        // 清除裁剪区域内的沙尘暴背景
        ctx.clearRect(0, 0, sandstormCanvas.width, sandstormCanvas.height);
        ctx.restore();
    }


    // 获取当前窗口框架的位置和尺寸
    getCurrentWindowRect() {
        return {
            x: (window.innerWidth - this.baseWindowSize.width * this.windowScale) / 2,
            y: (window.innerHeight - this.baseWindowSize.height * this.windowScale) / 2,
            width: this.baseWindowSize.width * this.windowScale,
            height: this.baseWindowSize.height * this.windowScale
        };
    }

    drawWall() {
        const ctx = wallCanvas.getContext('2d');
        ctx.clearRect(0, 0, wallCanvas.width, wallCanvas.height);
    
        // 仅绘制窗口边框（不再绘制背景）
        const windowRect = this.getCurrentWindowRect();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 10;
        ctx.strokeRect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
        
        // 添加半透明遮罩效果
        ctx.fillStyle = 'rgb(139, 115, 85)'; // 窗口外半透明
        ctx.fillRect(0, 0, wallCanvas.width, windowRect.y); // 顶部
        ctx.fillRect(0, windowRect.y, windowRect.x, windowRect.height); // 左侧
        ctx.fillRect(
            windowRect.x + windowRect.width, 
            windowRect.y, 
            wallCanvas.width - (windowRect.x + windowRect.width), 
            windowRect.height
        ); // 右侧
        ctx.fillRect(0, windowRect.y + windowRect.height, wallCanvas.width, wallCanvas.height); // 底部
    }

    // Initialize sandstorm particles
    initParticles() {
        for(let i = 0; i < SYSTEM_CONFIG.PARTICLES.COUNT; i++) {
            this.particles.push({
                x: Math.random() * sandstormCanvas.width,
                y: Math.random() * sandstormCanvas.height,
                size: Math.random() * (SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[1] - SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[0]) + SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[0],
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * (SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[1] - SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[0]) + SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[0]
            });
        }
    }

    // Event listening
    initEventListeners() {
        wallCanvas.addEventListener('click', () => this.startSimulation());
        wallCanvas.addEventListener('click', () => {
            if (!this.isWindowClicked) {
                this.handleWindowClick();
            }
        });
        eyeMask.addEventListener('animationend', () => this.startIntro());
    }

    // 新增窗口点击处理
    handleWindowClick() {
        console.log("Window clicked - start expansion");
        this.isWindowClicked = true;
        this.isWindowExpanding = true;
        sandstormCanvas.style.visibility = 'visible';
        this.animateWindowExpand();
    }

    // 新增窗口扩展动画（整合第一个版本的animateWindowExpand）
    animateWindowExpand() {
        if (!this.isWindowExpanding) return;

        this.windowScale += 0.008;
        
        // 更新沙尘暴裁剪区域
        sandstormCanvas.style.clipPath = this.getWindowClipPath();
        
        // 更新墙体绘制
        this.drawWall();

        if (this.windowScale < 5) {
            requestAnimationFrame(() => this.animateWindowExpand());
        } else {
            wallCanvas.style.visibility = 'hidden';
            this.startSimulation();
        }
    }

    // Opening animation
    startIntro() {
        myRoom.style.visibility = 'visible';
        story.textContent = "The sandstorm is approaching...";
        story.style.opacity = 1;
        
        setTimeout(() => {
            myRoom.style.visibility = 'hidden';
            story.style.opacity = 0;

            wallCanvas.style.visibility = 'visible';
            sandstormCanvas.style.visibility = 'visible';

            this.drawWall();
            sandstormCanvas.style.clipPath = this.getWindowClipPath();
    
            setTimeout(() => {
                this.animateSandstorm();
                this.animateSystem();
            }, 100);
        }, 3000);

        this.animateSystem();
    }

    // 新增裁剪路径计算方法
    getWindowClipPath() {
        const insetValue = `${50 - 30 * this.windowScale}%`; // 动态计算
        return `inset(
            ${insetValue} 
            ${insetValue} 
            ${insetValue} 
            ${insetValue}
        )`;
    }

    // Main process
    startSimulation() {
        if(this.isExpanding) return;
        this.isExpanding = true;
        
        // Create flying popup windows
        setTimeout(() => {
            this.createWindows(6, 'object');
        }, 1000);

        
        // Begin animation system
        this.animateSystem();
        
        // Phase control
        setTimeout(() => this.transitionPhase(1), SYSTEM_CONFIG.PHASE_TIMING.OBJECT_DURATION * 1000);
        setTimeout(() => this.transitionPhase(2), 
            (SYSTEM_CONFIG.PHASE_TIMING.OBJECT_DURATION + SYSTEM_CONFIG.PHASE_TIMING.TRANSITION_DURATION) * 1000);
    }

    // Create window groups
    createWindows(count, type) {
        if(this.isCreating) return;
        this.isCreating = true;
        
        let created = 0;
        const createNext = () => {
            if(created >= count || this.windows.length >= SYSTEM_CONFIG.MAX_WINDOWS) {
                this.isCreating = false;
                return;
            }

            const win = this._createWindow(type, created);
            this._setupWindowLifecycle(win);
            
            created++;
            setTimeout(createNext, this.creationInterval);
        };
        
        createNext();
    }

    // 私有方法创建单个窗口
    _createWindow(type, index) {
        const win = {
            // ...原有窗口属性
            timeoutId: null,
            createdAt: Date.now()
        };

        // 设置自动关闭定时器（仅第一阶段）
        if(this.currentPhase === 0) {
            win.timeoutId = setTimeout(() => {
                this._replaceWindow(win);
            }, this.windowLifetime);
        }

        this.windows.push(win);
        return win;
    }

    // 窗口生命周期管理
    _setupWindowLifecycle(win) {
        win.popup.onbeforeunload = () => {
            clearTimeout(win.timeoutId);
            this._replaceWindow(win);
        };
    }

    // 替换窗口逻辑
    _replaceWindow(oldWin) {
        if(this.currentPhase !== 0) return;
        
        const index = this.windows.indexOf(oldWin);
        if(index > -1) this.windows.splice(index, 1);
        
        if(this.windows.length < SYSTEM_CONFIG.MAX_WINDOWS) {
            this.createWindows(1, 'object');
        }
    }

    // Create single window
    createWindow(type, index) {
        const width = SYSTEM_CONFIG.WINDOW.WIDTH;
        const height = SYSTEM_CONFIG.WINDOW.HEIGHT;
        const x = Math.random() * (screen.width - width);
        const y = Math.random() * (screen.height - height);
        
        const popup = window.open(
            `./ranobj.html?type=${type}&index=${index}`,
            `win_${Date.now()}`,
            `width=${width},height=${height},left=${x},top=${y}`
        );
        
        return {
            popup,
            type,
            index,
            x,
            y,
            vx: (Math.random() - 0.5) * SYSTEM_CONFIG.WINDOW.MAX_SPEED,
            vy: (Math.random() - 0.5) * SYSTEM_CONFIG.WINDOW.MAX_SPEED,
            targetX: null,
            targetY: null
        };
    }

    // Animation loop
    animateSystem() {
        if (!this.isWindowClicked) {
            this.animateSandstorm();
            requestAnimationFrame(() => this.animateSystem());
            return;
        }

        this.animateWindows();
        this.animateSandstorm();
        requestAnimationFrame(() => this.animateSystem());
    }

    // Window animation
    animateWindows() {
        this.windows = this.windows.filter(win => !win.popup.closed);
        
        this.windows.forEach(win => {
            // Phase logics
            switch(this.currentPhase) {
                case 0: // Object: free movement
                    this.updateObjectMovement(win);
                    break;
                    
                case 1: // Transition: mixed movement
                    this.updateTransitionMovement(win);
                    break;
                    
                case 2: // Human face: set position
                    this.updateFaceMovement(win);
                    break;
            }
            
            // Update window position
            win.x = Math.max(0, Math.min(screen.width - SYSTEM_CONFIG.WINDOW.WIDTH, win.x));
            win.y = Math.max(0, Math.min(screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT, win.y));
            win.popup.moveTo(Math.round(win.x), Math.round(win.y));
        });
    }

    updateObjectMovement(win) {
        // Random movement
        win.vx += (Math.random() - 0.5) * 0.15;
        win.vy += (Math.random() - 0.5) * 0.15;
        
        // Bouncing at boundary
        if(win.x <= 0 || win.x >= screen.width - SYSTEM_CONFIG.WINDOW.WIDTH) win.vx *= -0.8;
        if(win.y <= 0 || win.y >= screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT) win.vy *= -0.8;
        
        // Applied speed
        win.x += win.vx;
        win.y += win.vy;
    }

    updateTransitionMovement(win) {
        // Gradually replaced with face emojis
        if(win.type === 'object' && Math.random() < 0.02) {
            win.popup.close();
            this.windows[this.windows.indexOf(win)] = this.createWindow('face', win.index);
            return;
        }
        
        // Moving to target position
        const target = SYSTEM_CONFIG.FACE_LAYOUT[win.index % 6];
        const tx = target.x * screen.width - SYSTEM_CONFIG.WINDOW.WIDTH * 0.5;
        const ty = target.y * screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT * 0.5;
        
        win.vx += (tx - win.x) * SYSTEM_CONFIG.WINDOW.ATTRACTION;
        win.vy += (ty - win.y) * SYSTEM_CONFIG.WINDOW.ATTRACTION;
        
        // Speed constraints
        win.vx = Math.max(-SYSTEM_CONFIG.WINDOW.MAX_SPEED, 
            Math.min(SYSTEM_CONFIG.WINDOW.MAX_SPEED, win.vx));
        win.vy = Math.max(-SYSTEM_CONFIG.WINDOW.MAX_SPEED, 
            Math.min(SYSTEM_CONFIG.WINDOW.MAX_SPEED, win.vy));
            
        win.x += win.vx;
        win.y += win.vy;
    }

    updateFaceMovement(win) {
        const target = SYSTEM_CONFIG.FACE_LAYOUT[win.index % 6];
        win.x = target.x * screen.width - SYSTEM_CONFIG.WINDOW.WIDTH * 0.5;
        win.y = target.y * screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT * 0.5;
    }

    // Sandstorm animation
    animateSandstorm() {
        // if (wallCanvas.style.visibility !== 'visible') return;
        const ctx = sandstormCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, sandstormCanvas.width, sandstormCanvas.height);
        
        // 根据当前缩放比例调整粒子运动
        const scaleFactor = this.isWindowExpanding ? 
            Math.min(1 / this.windowScale, 1) : 1;

        this.particles.forEach(p => {
            // 粒子位置根据缩放比例调整
            p.x += Math.cos(p.angle) * p.speed * scaleFactor;
            p.y += Math.sin(p.angle) * p.speed * scaleFactor;
            
            // 边界处理（考虑缩放后的视觉效果）
            if(p.x > sandstormCanvas.width) p.x = 0;
            if(p.x < 0) p.x = sandstormCanvas.width;
            if(p.y > sandstormCanvas.height) p.y = 0;
            if(p.y < 0) p.y = sandstormCanvas.height;
            
            ctx.fillStyle = `rgba(198, 163, 113, ${p.size/5})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // requestAnimationFrame(() => this.animateSandstorm());
    }

    // Wall expansion (not working)
    animateWallExpansion() {
        if(!this.isExpanding || this.windowScale >= 10) return;
        
        this.windowScale += 0.004;
        const ctx = wallCanvas.getContext('2d');
        ctx.clearRect(0, 0, wallCanvas.width, wallCanvas.height);
        
        // Create expanding window
        const w = wallCanvas.width * 0.6 * this.windowScale;
        const h = wallCanvas.height * 0.6 * this.windowScale;
        const x = (wallCanvas.width - w)/2;
        const y = (wallCanvas.height - h)/2;
        
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, wallCanvas.width, wallCanvas.height);
        ctx.clearRect(x, y, w, h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 10;
        ctx.strokeRect(x, y, w, h);
    }

    // Phase changing
    transitionPhase(newPhase) {
        this.currentPhase = newPhase;
        
        // 清除所有自动关闭定时器
        this.windows.forEach(win => clearTimeout(win.timeoutId));
        
        switch(newPhase) {
            case 1:
                // 开始过渡到人脸
                this._startFaceTransition();
                break;
            case 2:
                this._finalizeFaceLayout();
                break;
        }
    }

        // 新增人脸过渡方法
    _startFaceTransition() {
        this.windows.forEach((win, index) => {
            // 保留原有窗口但转换为face类型
            win.type = 'face';
            win.popup.location.reload(); // 重新加载页面显示face emoji
            
            // 设置目标位置
            const target = SYSTEM_CONFIG.FACE_LAYOUT[index % 6];
            win.targetX = target.x * screen.width - SYSTEM_CONFIG.WINDOW.WIDTH * 0.5;
            win.targetY = target.y * screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT * 0.5;
        });
    }

    // 新增关闭所有窗口的方法
    closeAllWindows() {
        this.windows.forEach(win => {
            try {
                if(win.popup && !win.popup.closed) {
                    win.popup.close();
                }
            } catch(e) {
                console.log('窗口关闭异常:', e);
            }
        });
        this.windows = []; // 清空窗口数组
        
        // 强制关闭所有可能残留的弹窗
        if(window.opener) {
            window.opener.postMessage('CLOSE_ALL_WINDOWS', '*');
        }
    }
    
}

// Start the system
const dreamSim = new DreamSimulation();