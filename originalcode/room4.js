// Initialize system
const eyeMask = document.getElementById('eyeMask');
const story = document.getElementById('story');
const myRoom = document.getElementById('myRoom');
const wallCanvas = document.getElementById('wallCanvas');
const sandstormCanvas = document.getElementById('sandstormCanvas');
const crackCanvas = document.getElementById('crackCanvas');

// System parameters
const SYSTEM_CONFIG = {
    WINDOW: {
        WIDTH: 250,
        HEIGHT: 250,
        MAX_SPEED: 1.8,
        FRICTION: 0.94,
        ATTRACTION: 0.035
    },
    PHASE_TIMING: {
        OBJECT_DURATION: 10,    // Random objects
        TRANSITION_DURATION: 10, // Object to face
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
        COUNT: 1500,
        SIZE_RANGE: [1, 4],
        SPEED_RANGE: [3, 5]
    },
    CRACK: {
        SEGMENTS: 50,
        GROWTH_RATE: 0.01,
        MAX_LENGTH: 800,
        OPACITY: 0.8,
        CRACK_COUNT: 15,
        BRANCH_CHANCE: 0.6,
        EDGE_POINTS: 12,
        RANDOM_EDGE_CRACKS: 30,
        ANGLE_VARIATION: Math.PI / 2,  // ±90 degrees variation
        LENGTH_VARIATION: 0.3,         // ±30% length variation
        MIN_BRANCH_LENGTH: 0.5,        // Minimum branch length ratio
        MAX_BRANCH_LENGTH: 0.8,        // Maximum branch length ratio
        GLASS_OPACITY: 0.15,          // Background glass opacity
        CRACK_OPACITY: 0.9,           // Crack line opacity
        SEGMENT_ANGLE_VARIATION: 0.25,  // Random angle variation for each segment
        SEGMENT_LENGTH_VARIATION: 0.4  // Random length variation for each segment
    }
};

class DreamSimulation {
    constructor() {
        this.windows = [];
        this.particles = [];
        this.currentPhase = 0;
        this.windowScale = 1;
        this.isExpanding = false;
        this.cracks = [];
        this.isCracking = false;

        this.isWindowExpanding = false;
        this.isWindowClicked = false;
        this.baseWindowSize = { 
            width: window.innerWidth * 0.6,
            height: window.innerHeight * 0.6 
        };

        // Add window close event listener
        window.addEventListener('beforeunload', () => {
            this.closeAllWindows();
        });
        
        // this.animateSandstorm();
        this.initCanvas();
        this.initParticles();
        this.initEventListeners();
    }

    // Initialize canvas
    initCanvas() {
        [wallCanvas, sandstormCanvas, crackCanvas].forEach(canvas => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        // Hide when initialized
        wallCanvas.style.visibility = 'hidden';
        sandstormCanvas.style.visibility = 'hidden';
        crackCanvas.style.visibility = 'hidden';
        
        this.updateSandstormMask();

        // Create default window with wall
        this.drawWall();

        window.addEventListener('resize', () => {
            this.baseWindowSize = {
                width: window.innerWidth * 0.7,
                height: window.innerHeight * 0.7
            };
            this.updateSandstormMask();
            this.drawWall();
        });
    }

    // Create the mask that serves as the window frame
    updateSandstormMask() {
        const ctx = sandstormCanvas.getContext('2d');
        ctx.save();
        
        // Create cutting path
        ctx.beginPath();
        const windowRect = this.getCurrentWindowRect();
        ctx.rect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
        ctx.clip();
        
        // Clear inside the window frame for the sandstorm
        ctx.clearRect(0, 0, sandstormCanvas.width, sandstormCanvas.height);
        ctx.restore();
    }


    // Get the current position and size of the window
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
    
        // Only draw the window frame with no background
        const windowRect = this.getCurrentWindowRect();
        ctx.fillStyle = 'rgb(255, 255, 255, 0.15)';
        ctx.fillRect(windowRect.x, windowRect.y, wallCanvas.width, wallCanvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 20;
        ctx.strokeRect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);

        // Semitransparent mask
        ctx.fillStyle = 'rgb(255, 242, 226)';
        ctx.fillRect(0, 0, wallCanvas.width, windowRect.y); // Top
        ctx.fillRect(0, windowRect.y - 10, windowRect.x, windowRect.height + 10); // Left
        ctx.fillRect(
            windowRect.x + windowRect.width, 
            windowRect.y - 10, 
            wallCanvas.width - (windowRect.x + windowRect.width), 
            windowRect.height + 10
        ); // Right
        ctx.fillRect(0, windowRect.y + windowRect.height, wallCanvas.width, wallCanvas.height); // Bottom

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

    // Window click event
    handleWindowClick() {
        console.log("Window clicked - start expansion");
        this.isWindowClicked = true;
        this.isWindowExpanding = true;
        sandstormCanvas.style.visibility = 'visible';
        this.animateWindowExpand();
    }

    // Window expansion animation
    animateWindowExpand() {
        if (!this.isWindowExpanding) return;

        this.windowScale *= 1.005;
        
        sandstormCanvas.style.clipPath = this.getWindowClipPath();

        this.drawWall();

        if (this.windowScale < 5) {
            requestAnimationFrame(() => this.animateWindowExpand());
        } 

        if (this.windowScale > 1.7) {
            wallCanvas.style.visibility = 'hidden';
        }

        if (this.windowScale > 5) {
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

    // Calculate the cutting path
    getWindowClipPath() {
        const insetValue = `${50 - 30 * this.windowScale}%`; // Dynamic calculation
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
        let createdCount = 0;
        
        const createNextWindow = () => {
            if (createdCount >= count) return;

            // Clear out already closed windows
            this.windows = this.windows.filter(w => !w.popup.closed);
            
            // Create new windows
            const win = this.createWindow(type, createdCount);
            
            if (type === 'face') {
                const oldWin = this.windows.find(w => 
                    !w.popup.closed && 
                    w.type !== 'face' // Replace those not-face windows
                );
                
                if(oldWin) {
                    // Accurate replacement
                    const idx = this.windows.indexOf(oldWin);
                    oldWin.popup.close();
                    this.windows.splice(idx, 1); // ✅ Splice out old windows
                } else if(this.windows.length >= SYSTEM_CONFIG.MAX_WINDOWS) {
                    // When reach the limit, replace the oldest window
                    const oldestFace = this.windows
                        .filter(w => w.type === 'face')
                        .sort((a,b) => a.created - b.created)[0];
                    if(oldestFace) {
                        const idx = this.windows.indexOf(oldestFace);
                        this.windows.splice(idx, 1);
                        oldestFace.popup.close();
                    }
                }
            }

            this.windows.push(win);
            createdCount++;

            // Delay for 500ms
            setTimeout(createNextWindow, 500);
        };

        // Start the creating process
        createNextWindow();
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
            `width=${width},height=${height},left=${x},top=${y},resizable=yes`
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
        win.vx += (Math.random() - 0.5) * 0.3;
        win.vy += (Math.random() - 0.5) * 0.3;
        
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
        
        // Adjust particle movement based on scaling ratio
        const scaleFactor = this.isWindowExpanding ? 
            Math.min(1 / this.windowScale, 1) : 1;

        this.particles.forEach(p => {
            // Adjust particle position based on scaling ratio
            p.x += Math.cos(p.angle) * p.speed * scaleFactor;
            p.y += Math.sin(p.angle) * p.speed * scaleFactor;
            
            // Boundary
            if(p.x > sandstormCanvas.width) p.x = 0;
            if(p.x < 0) p.x = sandstormCanvas.width;
            if(p.y > sandstormCanvas.height) p.y = 0;
            if(p.y < 0) p.y = sandstormCanvas.height;
            
            ctx.fillStyle = `rgba(198, 163, 113, ${p.size/5})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // requestAnimationFrame(() => this.animateSandstorm());
    }

    // Phase changing
    transitionPhase(newPhase) {
        this.currentPhase = newPhase;
        switch(newPhase) {
            case 1: // Keep the original logic of transition
            setTimeout(() => this.triggerFaceWindowsScaleUp(), 5000);
            break;
                
            case 2: // Close all windows
            this.closeAllWindows();
            break;
        }
    }

    // Trigger face window scaling up
    triggerFaceWindowsScaleUp() {
        this.windows.forEach(win => {
            if (!win.popup.closed && win.type === 'face') {
                try {
                    // Send message to scale
                    win.popup.postMessage({ 
                        action: 'scaleUp',
                        duration: 1500  // Duration of animation
                    }, '*');
                    // win.popup.resizeTo(300,300);
                } catch(e) {
                    console.error('Failed to send message:', e);
                }
            }
        });
    }

    // Create a new crack
    createCrack(x, y, angle = null, length = null, depth = 0) {
        const crackAngle = angle || Math.random() * Math.PI * 2;
        const baseLength = length || Math.random() * SYSTEM_CONFIG.CRACK.MAX_LENGTH;
        const crackLength = baseLength * (1 + (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.LENGTH_VARIATION);
        const segments = [];
        
        let currentX = x;
        let currentY = y;
        let currentAngle = crackAngle;
        
        for (let i = 0; i < SYSTEM_CONFIG.CRACK.SEGMENTS; i++) {
            // Add random variation to segment length
            const segmentLength = (crackLength / SYSTEM_CONFIG.CRACK.SEGMENTS) * 
                (1 + (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.SEGMENT_LENGTH_VARIATION);
            
            // Add random variation to segment angle
            currentAngle += (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.SEGMENT_ANGLE_VARIATION;
            
            // Calculate next point
            const nextX = currentX + Math.cos(currentAngle) * segmentLength;
            const nextY = currentY + Math.sin(currentAngle) * segmentLength;
            
            segments.push({
                x: currentX,
                y: currentY,
                nextX,
                nextY,
                opacity: 0,
                length: segmentLength,
                angle: currentAngle
            });
            
            currentX = nextX;
            currentY = nextY;
        }
        
        this.cracks.push({
            segments,
            growth: 0,
            angle: crackAngle
        });

        // Create multiple branch cracks with varying angles and lengths
        if (Math.random() < SYSTEM_CONFIG.CRACK.BRANCH_CHANCE && depth < 3) {
            const branchCount = Math.floor(Math.random() * 3) + 1; // 1-3 branches
            for (let i = 0; i < branchCount; i++) {
                const branchPoint = Math.floor(Math.random() * segments.length);
                const branchX = segments[branchPoint].x;
                const branchY = segments[branchPoint].y;
                
                // Calculate branch angle with random variation
                const branchAngle = segments[branchPoint].angle + 
                    (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.ANGLE_VARIATION;
                
                // Calculate branch length with random variation
                const branchLengthRatio = SYSTEM_CONFIG.CRACK.MIN_BRANCH_LENGTH + 
                    Math.random() * (SYSTEM_CONFIG.CRACK.MAX_BRANCH_LENGTH - SYSTEM_CONFIG.CRACK.MIN_BRANCH_LENGTH);
                const branchLength = crackLength * branchLengthRatio;
                
                this.createCrack(branchX, branchY, branchAngle, branchLength, depth + 1);
            }
        }
    }

    // Animate cracks
    animateCracks() {
        if (!this.isCracking) return;

        const ctx = crackCanvas.getContext('2d');
        ctx.clearRect(0, 0, crackCanvas.width, crackCanvas.height);

        // Draw glass background
        const windowRect = this.getCurrentWindowRect();
        ctx.fillStyle = `rgba(255, 255, 255, ${SYSTEM_CONFIG.CRACK.GLASS_OPACITY})`;
        ctx.fillRect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);

        this.cracks.forEach(crack => {
            crack.growth = Math.min(1, crack.growth + SYSTEM_CONFIG.CRACK.GROWTH_RATE);
            
            crack.segments.forEach((segment, index) => {
                const segmentProgress = index / crack.segments.length;
                if (segmentProgress <= crack.growth) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${SYSTEM_CONFIG.CRACK.CRACK_OPACITY * (1 - segmentProgress)})`;
                    ctx.lineWidth = 2;
                    ctx.moveTo(segment.x, segment.y);
                    ctx.lineTo(segment.nextX, segment.nextY);
                    ctx.stroke();
                }
            });
        });

        if (this.cracks.some(crack => crack.growth < 1)) {
            requestAnimationFrame(() => this.animateCracks());
        }
    }

    // Start cracking effect
    startCracking() {
        this.isCracking = true;
        crackCanvas.style.visibility = 'visible';
        crackCanvas.style.opacity = '1';

        const windowRect = this.getCurrentWindowRect();
        const centerX = windowRect.x + windowRect.width / 2;
        const centerY = windowRect.y + windowRect.height / 2;

        // Create initial cracks from the center with random angles
        for (let i = 0; i < SYSTEM_CONFIG.CRACK.CRACK_COUNT; i++) {
            const baseAngle = (Math.PI * 2 * i) / SYSTEM_CONFIG.CRACK.CRACK_COUNT;
            const angleVariation = (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.ANGLE_VARIATION;
            this.createCrack(centerX, centerY, baseAngle + angleVariation);
        }

        // Create cracks from multiple points along each edge
        const createEdgeCracks = (startX, startY, endX, endY, count) => {
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;
                const baseAngle = Math.atan2(centerY - y, centerX - x);
                const angleVariation = (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.ANGLE_VARIATION;
                this.createCrack(x, y, baseAngle + angleVariation);
            }
        };

        // Create cracks along each edge
        const pointsPerEdge = SYSTEM_CONFIG.CRACK.EDGE_POINTS;
        
        // Top edge
        createEdgeCracks(
            windowRect.x, windowRect.y,
            windowRect.x + windowRect.width, windowRect.y,
            pointsPerEdge
        );
        
        // Right edge
        createEdgeCracks(
            windowRect.x + windowRect.width, windowRect.y,
            windowRect.x + windowRect.width, windowRect.y + windowRect.height,
            pointsPerEdge
        );
        
        // Bottom edge
        createEdgeCracks(
            windowRect.x + windowRect.width, windowRect.y + windowRect.height,
            windowRect.x, windowRect.y + windowRect.height,
            pointsPerEdge
        );
        
        // Left edge
        createEdgeCracks(
            windowRect.x, windowRect.y + windowRect.height,
            windowRect.x, windowRect.y,
            pointsPerEdge
        );

        // Add random cracks from the edges
        for (let i = 0; i < SYSTEM_CONFIG.CRACK.RANDOM_EDGE_CRACKS; i++) {
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            switch(edge) {
                case 0: // top
                    x = windowRect.x + Math.random() * windowRect.width;
                    y = windowRect.y;
                    break;
                case 1: // right
                    x = windowRect.x + windowRect.width;
                    y = windowRect.y + Math.random() * windowRect.height;
                    break;
                case 2: // bottom
                    x = windowRect.x + Math.random() * windowRect.width;
                    y = windowRect.y + windowRect.height;
                    break;
                case 3: // left
                    x = windowRect.x;
                    y = windowRect.y + Math.random() * windowRect.height;
                    break;
            }
            
            // Create cracks with varying angles for more natural look
            const baseAngle = Math.atan2(centerY - y, centerX - x);
            const angleVariation = (Math.random() - 0.5) * SYSTEM_CONFIG.CRACK.ANGLE_VARIATION;
            const angle = baseAngle + angleVariation;
            this.createCrack(x, y, angle);
        }

        this.animateCracks();
    }

    // Close all windows
    closeAllWindows() {
        this.windows.forEach(win => {
            try {
                if(win.popup && !win.popup.closed) {
                    win.popup.close();
                }
            } catch(e) {
                console.log('Closing window error:', e);
            }
        });
        this.windows = []; // Clear window array
        
        // Force to close all possibly remaining windows
        if(window.opener) {
            window.opener.postMessage('CLOSE_ALL_WINDOWS', '*');
        }

        // Start the cracking effect after windows are closed
        setTimeout(() => this.startCracking(), 500);
    }
    
}

// Start the system
const dreamSim = new DreamSimulation();