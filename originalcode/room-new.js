// Initialize System
const eyeMask = document.getElementById('eyeMask');
const story = document.getElementById('story');
const myRoom = document.getElementById('myRoom');
const windowFrames = document.getElementById('windowFrames');

const wallCanvas = document.getElementById('wallCanvas');
const sandstormCanvas = document.getElementById('sandstormCanvas');

wallCanvas.style.visibility = 'hidden';
sandstormCanvas.style.visibility = 'hidden';

let windowScale = 1;
let isWindowExpanding = false;

// System Parameters
const SYSTEM_CONFIG = {
    WINDOW: {
        WIDTH: 200,
        HEIGHT: 150,
        MAX_SPEED: 1.8,
        FRICTION: 0.94,
        ATTRACTION: 0.035
    },
    PHASE_TIMING: {
        OBJECT_DURATION: 10,    // Random Objects
        TRANSITION_DURATION: 5, // Object to Face
        FACE_DURATION: 0        // Human Face
    },
    FACE_LAYOUT: [
        { x: 0.35, y: 0.28 },  // LeftEye
        { x: 0.65, y: 0.28 },  // RightEye
        { x: 0.5,  y: 0.42 },  // Nose
        { x: 0.25, y: 0.5 },  // LeftEar
        { x: 0.75, y: 0.5 },  // RightEar
        { x: 0.5,  y: 0.7 }    // Mouth
    ],
    PARTICLES: {
        COUNT: 2000,
        SIZE_RANGE: [1, 4],
        SPEED_RANGE: [1, 4]
    }
};

// Set up both wall canvas and sandstorm canvas
function resizeCanvases() {
    wallCanvas.width = window.innerWidth;
    wallCanvas.height = window.innerHeight;
    sandstormCanvas.width = window.innerWidth;
    sandstormCanvas.height = window.innerHeight;
}

resizeCanvases();
window.addEventListener('resize', resizeCanvases);

// Draw window inside
function drawWall() {
    const ctx = wallCanvas.getContext('2d');

    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, wallCanvas.width, wallCanvas.height);

    let windowWidth = wallCanvas.width * 0.6 * windowScale;
    let windowHeight = wallCanvas.height * 0.6 * windowScale;
    let windowX = (wallCanvas.width - windowWidth) / 2;
    let windowY = (wallCanvas.height - windowHeight) / 2;

    ctx.clearRect(windowX, windowY, windowWidth, windowHeight);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
}

// Set up sandstorm particles
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * sandstormCanvas.width;
        this.y = Math.random() * sandstormCanvas.height;
        this.size = Math.random() * (SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[1] - SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[0]) + SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[0];
        // this.speedX = Math.random() * 8 - 4;
        // this.speedY = Math.random() * 8 - 4;
        this.speed = Math.random() * (SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[1] - SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[0]) + SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[0];
        this.angle = Math.random() * Math.PI * 2;
        // this.opacity = Math.random() * 0.7 + 0.2;
    }

    update() {
        // Particle movement
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if(this.x > sandstormCanvas.width) {
            this.x = 0;
        }
        if(this.x < 0) {
            this.x = sandstormCanvas.width;
        }
        if(this.y > sandstormCanvas.height) {
            this.y = 0;
        }
        if(this.y < 0) {
            this.y = sandstormCanvas.height;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(198, 163, 113, ${this.size/5})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// Push particles
const particles = [];
for (let i = 0; i < SYSTEM_CONFIG.PARTICLES.COUNT; i++) {
    particles.push(new Particle());
}

// Sandstorm particle animation
function animateSandstorm() {
    const ctx = sandstormCanvas.getContext('2d');
    ctx.clearRect(0, 0, sandstormCanvas.width, sandstormCanvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
    });

    requestAnimationFrame(animateSandstorm);
}

function animateWindowExpand() {
    if (!isWindowExpanding || windowScale >= 10) return;
    
    windowScale += 0.004;
    drawWall();

    if (windowScale < 10) { 
        requestAnimationFrame(animateWindowExpand);
    } else {
        wallCanvas.style.visibility = 'hidden';
        sandstormCanvas.style.zIndex = "1"; 
    }
}

function eventListeners() {
    wallCanvas.addEventListener('click', () => startSimulation());
    eyeMask.addEventListener('animationend', () => startIntro());
}

// Black turning to white (opening animation)
function startIntro() {
    myRoom.style.visibility = 'visible';
    story.textContent = "The sandstorm is approaching...";
    story.style.opacity = 1;

    setTimeout(() => {
        myRoom.style.visibility = 'hidden';
        story.style.opacity = 0;

        setTimeout(() => {
            wallCanvas.style.visibility = 'visible';
            sandstormCanvas.style.visibility = 'visible';
        }, 100);
    }, 3000);
}

// Start sandstorm animation with flying windows
function startSimulation() {
    console.log("window got clicked");
    isWindowExpanding = true;
    animateWindowExpand();
    // wallCanvas.style.visibility = 'hidden';
    sandstormCanvas.style.visibility = 'visible';
    spawnMovingPopups(6, 'object');

    setTimeout(() => transitionPhase(1), SYSTEM_CONFIG.PHASE_TIMING.OBJECT_DURATION * 1000);
    setTimeout(() => transitionPhase(2), 
        (SYSTEM_CONFIG.PHASE_TIMING.OBJECT_DURATION + SYSTEM_CONFIG.PHASE_TIMING.TRANSITION_DURATION) * 1000);
}

const newWindows = [];
const windows = [];

function spawnMovingPopups(count, type) {
    // setInterval(() => {
        for(let i = 0; i < count; i++) {
            const win = createWindow(type, i);
            newWindows.push(win);
        }
    // }, 1500);

    if (type === 'face') {
        // Replace old windows
        windows.forEach(w => w.popup.close());
        windows = newWindows;
    } else {
        windows.push(...newWindows);
    }
}

function createWindow(type, index) {
    const width = SYSTEM_CONFIG.WINDOW.WIDTH;
    const height = SYSTEM_CONFIG.WINDOW.HEIGHT;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    let x = Math.random() * (screenWidth - 300);
    let y = Math.random() * (screenHeight - 200);

    
    let popup = window.open(
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

function animateSystem() {
    animateWindows();
    animateSandstorm();
    requestAnimationFrame(() => animateSystem());
}

function animateWindows() {
    // windows = windows.filter(win => !win.popup.closed);
        
    windows.forEach(win => {
        // Phase logics
        switch(currentPhase) {
            case 0: // Object phase: random movement
                updateObjectMovement(win);
                break;
                
            case 1: // Transition phase: mixed movement
                updateTransitionMovement(win);
                break;
                
            case 2: // Face phase: set position
                updateFaceMovement(win);
                break;
        }
        
        // Update window position
        win.x = Math.max(0, Math.min(screen.width - SYSTEM_CONFIG.WINDOW.WIDTH, win.x));
        win.y = Math.max(0, Math.min(screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT, win.y));
        win.popup.moveTo(Math.round(win.x), Math.round(win.y));
    });
}

function updateObjectMovement(win) {
    // Random movement
    win.vx += (Math.random() - 0.5) * 0.15;
    win.vy += (Math.random() - 0.5) * 0.15;
    
    // Boundary bouncing
    if(win.x <= 0 || win.x >= screen.width - SYSTEM_CONFIG.WINDOW.WIDTH) win.vx *= -0.8;
    if(win.y <= 0 || win.y >= screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT) win.vy *= -0.8;
    
    // Applied speed
    win.x += win.vx;
    win.y += win.vy;
}

function updateTransitionMovement(win) {
    // Gradually replaced with face emojis
    if(win.type === 'object' && Math.random() < 0.02) {
        win.popup.close();
        this.windows[this.windows.indexOf(win)] = this.createWindow('face', win.index);
        return;
    }
    
    // Move to target positions
    const target = SYSTEM_CONFIG.FACE_LAYOUT[win.index % 6];
    const tx = target.x * screen.width;
    const ty = target.y * screen.height;
    
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

function updateFaceMovement(win) {
    const target = SYSTEM_CONFIG.FACE_LAYOUT[win.index % 6];
    win.x = target.x * screen.width;
    win.y = target.y * screen.height;
}

function transitionPhase(newPhase) {
    currentPhase = newPhase;
    if(newPhase === 2) {
        spawnMovingPopups(6, 'face');
    }
}

animateSystem();
eventListeners();