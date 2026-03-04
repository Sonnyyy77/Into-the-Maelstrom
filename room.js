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
        getObjectDuration: function() {
            switch(loopCount) {
                case 0: return 11.5;  // First loop
                case 1: return 10;   // Second loop
                case 2: return 10;  // Third loop
                default: return 10; // Later loops
            }
        },
        getTransitionDuration: function() {
            switch(loopCount) {
                case 0: return 14;  // First loop
                case 1: return 13;  // Second loop
                case 2: return 13;  // Third loop
                default: return 13; // Later loops
            }
        }
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
        COUNT: 400,
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
        GLASS_OPACITY: 0.10,          // Background glass opacity
        CRACK_OPACITY: 0.9,           // Crack line opacity
        SEGMENT_ANGLE_VARIATION: 0.25,  // Random angle variation for each segment
        SEGMENT_LENGTH_VARIATION: 0.4  // Random length variation for each segment
    },
    WALL_DECORATIONS: {
        SIZES: [0.15, 0.03, 0.2, 0.35, 0.4, 0.25], // Different sizes for each emoji
        OPACITY: 1,
        LOOP_DECORATIONS: [
            ['🕐', '♾️'], // Loop 1
            ['🕑', '♾️', '🖼️'], // Loop 2
            ['🕒', '♾️', '🖼️', '🪞'], // Loop 3
            ['🕓', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 4
            ['🕔', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 5
            ['🕕', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 6
            ['🕖', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 7
            ['🕗', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 8
            ['🕘', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 9
            ['🕙', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 10
            ['🕚', '♾️', '🖼️', '🪞', '🪑', '🧳'], // Loop 11
            ['🕛', '♾️', '🖼️', '🪞', '🪑', '🧳']// Loop 12
            
        ],
        POSITIONS: [
            { x: 0.77, y: 0.05 }, // Right wall top
            { x: 0.77, y: 0.08 }, // Right wall top
            { x: 0.23, y: 0.25 }, // Left wall top
            { x: 0.77, y: 0.7 }, // Right wall middle
            { x: 0.28, y: 1.2 }, // Left wall bottom
            { x: 0.72, y: 1.25 }  // Right wall bottom
        ]
    }
};

// Global variables
let dreamSim;
let eyeMask;
let story;
let myRoom;
let wallCanvas;
let sandstormCanvas;
let crackCanvas;
let maskCanvas;
let loopCount = 0;
let sandstormSound;
let crackingSound;
let earthquakeSound;

// Initialize loop count
function initLoopCount() {
    // Check if coming from home page
    const fromHomePage = localStorage.getItem('fromHomePage');
    if (fromHomePage === 'true') {
        // Reset loop count if coming from home page
        loopCount = 0;
        localStorage.removeItem('fromHomePage');
    } else {
        // Get current loop count or initialize to 0
        loopCount = parseInt(localStorage.getItem('loopCount')) || 0;
    }
    // Update loop count display
    updateLoopCountDisplay();
}

// Update loop count display
function updateLoopCountDisplay() {
    const loopCountElement = document.getElementById('loopCount');
    if (loopCountElement) {
        loopCountElement.textContent = `Loop ${loopCount + 1}`;
    }
}

// Increment loop count
function incrementLoopCount() {
    loopCount++;
    localStorage.setItem('loopCount', loopCount.toString());
    updateLoopCountDisplay();
}

// Preload any assets
function preload() {
    // Add any assets you need to load here
}

function setup() {
    // Initialize loop count
    initLoopCount();
    
    // Create canvas
    const canvas = createCanvas(windowWidth, windowHeight);
    
    // Only set parent if the container exists
    const container = document.getElementById('canvas-container');
    if (container) {
        canvas.parent('canvas-container');
    }
    
    // Initialize DOM elements
    eyeMask = document.getElementById('eyeMask');
    story = document.getElementById('story');
    myRoom = document.getElementById('myRoom');
    wallCanvas = document.getElementById('wallCanvas');
    sandstormCanvas = document.getElementById('sandstormCanvas');
    crackCanvas = document.getElementById('crackCanvas');
    sandstormSound = document.getElementById('sandstormSound');
    sandstormSound.volume = 0; // Start with no volume
    sandstormSound.play(); // Start playing but muted
    crackingSound = document.getElementById('crackingSound');
    earthquakeSound = document.getElementById('earthquakeSound');
    
    // Create and initialize mask canvas
    maskCanvas = document.createElement('canvas');
    maskCanvas.id = 'maskCanvas';
    maskCanvas.style.position = 'absolute';
    maskCanvas.style.top = '0';
    maskCanvas.style.left = '0';
    maskCanvas.style.pointerEvents = 'none';
    maskCanvas.style.zIndex = '2'; // Place between sandstorm and crack canvas
    document.body.appendChild(maskCanvas);
    
    // Initialize simulation
    dreamSim = new DreamSimulation();
}

function draw() {
    background(0, 0, 0, 5);
    dreamSim.update();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    dreamSim.resize();
}

class DreamSimulation {
    constructor() {
        this.windows = [];
        this.particles = [];
        this.currentPhase = 0;
        this.windowScale = 1;
        this.emojiScale = 1;
        this.isExpanding = false;
        this.cracks = [];
        this.isCracking = false;
        this.isWindowExpanding = false;
        this.isWindowClicked = false;
        this.isInIntroPhase = true;
        this.introComplete = false;
        this.crackingComplete = false; // Add flag to track cracking phase completion
        this.baseWindowSize = { 
            width: windowWidth * 0.5,
            height: windowHeight * 0.5 
        };
        this.maskProgress = 0;
        this.maskAnimationSpeed = 0.003;
        this.maskSpeedVariation = 0.001;
        this.currentSpeed = this.maskAnimationSpeed;
        this.maskTilt = 0;
        this.maskTiltVariation = 0.1;
        this.finalTilt = null;
        this.subtitleWindow = null;
        this.decorationRotations = [];
        this.hoveredDecoration = null;
        this.sandstormSound = document.getElementById('sandstormSound');
        this.sandstormSound.volume = 0; // Start with no volume
        this.sandstormSound.play(); // Start playing but muted

        // Add window close event listener
        window.addEventListener('beforeunload', () => {
            this.closeAllWindows();
            // this.subtitleWindow.close();
        });
        
        this.initCanvas();
        this.initParticles();
        this.initEventListeners();
        this.createSubtitleWindow();
    }

    // Initialize canvas
    initCanvas() {
        [wallCanvas, sandstormCanvas, crackCanvas].forEach(canvas => {
            canvas.width = windowWidth;
            canvas.height = windowHeight;
        });
        
        // Set initial visibility
        wallCanvas.style.visibility = 'visible';
        wallCanvas.style.pointerEvents = 'auto'; // Ensure canvas can receive mouse events
        sandstormCanvas.style.visibility = 'hidden';
        crackCanvas.style.visibility = 'hidden';
        
        this.updateSandstormMask();
        this.drawWall();

        // Add resize handler
        window.addEventListener('resize', () => {
            this.baseWindowSize = {
                width: windowWidth * 0.5,
                height: windowHeight * 0.5
            };
            this.updateSandstormMask();
            this.drawWall();
        });
    }

    // Initialize particles using p5.js random function
    initParticles() {
        for(let i = 0; i < SYSTEM_CONFIG.PARTICLES.COUNT; i++) {
            this.particles.push({
                x: random(sandstormCanvas.width),
                y: random(sandstormCanvas.height),
                size: random(SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[0], SYSTEM_CONFIG.PARTICLES.SIZE_RANGE[1]),
                angle: random(TWO_PI),
                speed: random(SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[0] * 0.5, SYSTEM_CONFIG.PARTICLES.SPEED_RANGE[1] * 0.5),
                rotationSpeed: random(0.02, 0.05),
                height: random(height),
                baseRadius: random(width * 0.4, width * 0.6),
                upwardSpeed: random(0.3, 1.0),
                offsetAngle: random(TWO_PI),
                opacity: random(50, 200),
                jitterX: 0,
                jitterY: 0,
                jitterRange: random(3, 8)
            });
        }

        console.log(this.particles);
    }

    // Update method for the main animation loop
    update() {
        if (!this.isWindowClicked) {
            this.animateSandstorm();
            return;
        }

        this.animateWindows();
        this.animateSandstorm();
        if (this.isCracking) {
            this.animateCracks();
        }
    }

    // Resize handler
    resize() {
        this.baseWindowSize = {
            width: windowWidth * 0.5,
            height: windowHeight * 0.5
        };
        this.updateSandstormMask();
        this.drawWall();
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
            x: (windowWidth - this.baseWindowSize.width * this.windowScale) / 2,
            y: (windowHeight - this.baseWindowSize.height * this.windowScale) / 2,
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
        ctx.fillRect(0, windowRect.y - 10, windowRect.x, windowRect.height + 20); // Left
        ctx.fillRect(
            windowRect.x + windowRect.width, 
            windowRect.y - 10, 
            wallCanvas.width - (windowRect.x + windowRect.width), 
            windowRect.height + 20
        ); // Right
        ctx.fillRect(0, windowRect.y + windowRect.height, wallCanvas.width, wallCanvas.height); // Bottom

        // Calculate center point
        const centerX = (windowRect.x + windowRect.width) / 2;
        const centerY = (windowRect.y + windowRect.height) / 2;

        // Top
        ctx.beginPath();
        const topLeftX = centerX + (windowRect.x / 2 - centerX) * (1 + (this.windowScale - 1) * 1.003);
        const topLeftY = centerY + (windowRect.y / 2 - centerY) * (1 + (this.windowScale - 1) * 1.003);
        const topRightX = centerX + (windowRect.x * 1.5 + windowRect.width - centerX) * (1 + (this.windowScale - 1) * 1.003);
        const topRightY = centerY + (windowRect.y / 2 - centerY) * (1 + (this.windowScale - 1) * 1.003);
        ctx.moveTo(topLeftX, topLeftY);
        ctx.lineTo(topRightX, topRightY);
        ctx.lineTo(wallCanvas.width, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgb(253, 220, 179)';
        ctx.fill();

        // Left
        ctx.beginPath();
        const bottomLeftX = centerX + (windowRect.x / 2 - centerX) * (1 + (this.windowScale - 1) * 1.003);
        const bottomLeftY = centerY + (windowRect.y * 1.5 + windowRect.height - centerY) * (1 + (this.windowScale - 1) * 1.003);
        ctx.moveTo(topLeftX, topLeftY);
        ctx.lineTo(bottomLeftX, bottomLeftY);
        ctx.lineTo(0, wallCanvas.height);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgb(222, 193, 156)';
        ctx.fill();

        // Right
        ctx.beginPath();
        const bottomRightX = centerX + (windowRect.x * 1.5 + windowRect.width - centerX) * (1 + (this.windowScale - 1) * 1.003);
        const bottomRightY = centerY + (windowRect.y * 1.5 + windowRect.height - centerY) * (1 + (this.windowScale - 1) * 1.003);
        ctx.moveTo(topRightX, topRightY);
        ctx.lineTo(bottomRightX, bottomRightY);
        ctx.lineTo(wallCanvas.width, wallCanvas.height);
        ctx.lineTo(wallCanvas.width, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgb(222, 193, 156)';
        ctx.fill();

        // Bottom
        ctx.beginPath();
        ctx.moveTo(bottomLeftX, bottomLeftY);
        ctx.lineTo(bottomRightX, bottomRightY);
        ctx.lineTo(wallCanvas.width, wallCanvas.height);
        ctx.lineTo(0, wallCanvas.height);
        ctx.closePath();
        ctx.fillStyle = 'rgb(253, 220, 179)';
        ctx.fill();

        // Draw decorations based on current loop
        const decorations = SYSTEM_CONFIG.WALL_DECORATIONS.LOOP_DECORATIONS[loopCount] || [];
        decorations.forEach((emoji, index) => {
            const pos = SYSTEM_CONFIG.WALL_DECORATIONS.POSITIONS[index % SYSTEM_CONFIG.WALL_DECORATIONS.POSITIONS.length];
            const size = SYSTEM_CONFIG.WALL_DECORATIONS.SIZES[index % SYSTEM_CONFIG.WALL_DECORATIONS.SIZES.length];
            
            // Calculate position based on which wall the emoji is on
            let x, y;
            let isLeftWall = pos.x < 0.5; // Check if decoration is on left wall
            if (isLeftWall) { // Left wall
                const wallWidth = windowRect.x;
                x = windowRect.x - (wallWidth * pos.x * 4) + wallWidth - 100 * (1 + Math.sqrt(this.windowScale - 1) * 0.8);
                y = windowRect.y + (windowRect.height * pos.y) * (1 + Math.sqrt(this.windowScale - 1) * 0.3);
            } else { // Right wall
                const wallWidth = wallCanvas.width - (windowRect.x + windowRect.width);
                x = windowRect.x + windowRect.width + (wallWidth * (1 - pos.x) * 4) - wallWidth + 100 * (1 + Math.sqrt(this.windowScale - 1) * 0.8);
                y = windowRect.y + (windowRect.height * pos.y) * (1 + Math.sqrt(this.windowScale - 1) * 0.3);
            }
            
            // Calculate emoji size based on window scale
            const baseSize = windowRect.width * size;
            const emojiSize = baseSize * Math.pow(this.windowScale, 1/4) * 0.8;
            
            // Initialize rotation if not exists
            if (!this.decorationRotations[index]) {
                this.decorationRotations[index] = 0;
            }
            
            // Update rotation if hovered
            if (this.hoveredDecoration === index) {
                this.decorationRotations[index] = Math.min(10, this.decorationRotations[index] + 2);
            } else {
                this.decorationRotations[index] = Math.max(0, this.decorationRotations[index] - 2);
            }
            
            // Draw emoji with rotation
            ctx.save();
            ctx.translate(x, y);
            // Apply negative rotation for left wall decorations
            const rotationAngle = isLeftWall ? -this.decorationRotations[index] : this.decorationRotations[index];
            ctx.rotate(rotationAngle * Math.PI / 180);
            ctx.font = `${emojiSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(255, 255, 255, ${SYSTEM_CONFIG.WALL_DECORATIONS.OPACITY})`;
            ctx.fillText(emoji, 0, 0);
            ctx.restore();
        });
    }

    // Event listening
    initEventListeners() {
        // Only detect clicks within the window area
        wallCanvas.addEventListener('click', (e) => {
            // Only handle clicks if intro is complete
            if (!this.introComplete) return;
            
            const rect = wallCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const windowRect = this.getCurrentWindowRect();
            
            // Check if click is within window bounds
            if (mouseX >= windowRect.x && 
                mouseX <= windowRect.x + windowRect.width && 
                mouseY >= windowRect.y && 
                mouseY <= windowRect.y + windowRect.height) {
                
                if (!this.isWindowClicked) {
                    this.handleWindowClick();
                }
            }
        });
        
        // Only add intro event listener if we're in intro phase
        if (this.isInIntroPhase) {
            eyeMask.addEventListener('animationend', () => this.startIntro());
        }
        
        // Add mouse move listener for decoration hover
        wallCanvas.addEventListener('mousemove', (e) => {
            this.handleDecorationHover(e);
            this.drawWall(); // Redraw to update rotations
        });
        wallCanvas.addEventListener('mouseleave', () => {
            this.handleDecorationLeave();
            this.drawWall(); // Redraw to update rotations
        });
    }

    handleDecorationHover(e) {
        const rect = wallCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const decorations = SYSTEM_CONFIG.WALL_DECORATIONS.LOOP_DECORATIONS[loopCount] || [];
        const windowRect = this.getCurrentWindowRect();
        
        let foundHover = false;
        
        decorations.forEach((emoji, index) => {
            const pos = SYSTEM_CONFIG.WALL_DECORATIONS.POSITIONS[index % SYSTEM_CONFIG.WALL_DECORATIONS.POSITIONS.length];
            const size = SYSTEM_CONFIG.WALL_DECORATIONS.SIZES[index % SYSTEM_CONFIG.WALL_DECORATIONS.SIZES.length];
            
            // Calculate position based on which wall the emoji is on
            let x, y;
            let isLeftWall = pos.x < 0.5; // Check if decoration is on left wall
            if (isLeftWall) { // Left wall
                const wallWidth = windowRect.x;
                x = windowRect.x - (wallWidth * pos.x * 4) + wallWidth - 100 * (1 + Math.sqrt(this.windowScale - 1) * 0.8);
                y = windowRect.y + (windowRect.height * pos.y) * (1 + Math.sqrt(this.windowScale - 1) * 0.5);
            } else { // Right wall
                const wallWidth = wallCanvas.width - (windowRect.x + windowRect.width);
                x = windowRect.x + windowRect.width + (wallWidth * (1 - pos.x) * 4) - wallWidth + 100 * (1 + Math.sqrt(this.windowScale - 1) * 0.8);
                y = windowRect.y + (windowRect.height * pos.y) * (1 + Math.sqrt(this.windowScale - 1) * 0.5);
            }
            
            const baseSize = windowRect.width * size;
            const emojiSize = baseSize * Math.pow(this.windowScale, 1/4) * 0.8;
            
            // Check if mouse is within emoji bounds
            const emojiRadius = emojiSize / 2;
            const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
            
            if (distance < emojiRadius) {
                foundHover = true;
                if (this.hoveredDecoration !== index) {
                    this.hoveredDecoration = index;
                    // Initialize rotation if not exists
                    if (!this.decorationRotations[index]) {
                        this.decorationRotations[index] = 0;
                    }
                }
            }
        });
        
        if (!foundHover) {
            this.hoveredDecoration = null;
        }
    }

    handleDecorationLeave() {
        this.hoveredDecoration = null;
    }

    handleWindowClick() {
        console.log("Window clicked - start expansion");
        this.isWindowClicked = true;
        this.isWindowExpanding = true;
        this.isInIntroPhase = false; // Set intro phase to false when window is clicked
        sandstormCanvas.style.visibility = 'visible';
        this.animateWindowExpand();
        this.hideSubtitle();
    }

    // Window expansion animation
    animateWindowExpand() {
        if (!this.isWindowExpanding) return;

        this.windowScale *= 1.005;
        this.emojiScale *= 1.01;
        
        sandstormCanvas.style.clipPath = this.getWindowClipPath();

        this.drawWall();

        // Update sandstorm sound volume based on window scale
        const maxVolume = 0.2; // Maximum volume
        const minScale = 1; // Minimum scale when sound starts
        const maxScale = 5; // Scale when sound is at max volume
        const volume = Math.min(maxVolume, 
            (this.windowScale - minScale) / (maxScale - minScale) * maxVolume);
        sandstormSound.volume = volume;

        if (this.windowScale < 5) {
            requestAnimationFrame(() => this.animateWindowExpand());
        } 

        // Only hide wall canvas when window scale is larger
        if (this.windowScale > 2.05) {
            wallCanvas.style.visibility = 'hidden';
        }

        if (this.windowScale > 5) {
            this.startSimulation();
        }
    }

    // Opening animation
    startIntro() {
        myRoom.style.visibility = 'visible';
        
        // Add event listener for eye mask animation end
        eyeMask.addEventListener('animationend', () => {
            // After eye mask animation ends, move it to back
            eyeMask.style.zIndex = '0';
        }, { once: true });
        
        setTimeout(() => {
            myRoom.style.visibility = 'hidden';
            wallCanvas.style.visibility = 'visible';
            sandstormCanvas.style.visibility = 'visible';

            this.drawWall();
            sandstormCanvas.style.clipPath = this.getWindowClipPath();
    
            setTimeout(() => {
                this.animateSandstorm();
                this.animateSystem();
            }, 100);
        }, 2000);

        //Script for intro
        if (loopCount === 0 && this.isInIntroPhase) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.showSubtitle(text);
                    }
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.hideSubtitle();
                    }
                }, delay);
            };

            showSubtitleIfVisible("The sandstorm is approaching...", 0);
            hideSubtitleIfVisible(2000);
            showSubtitleIfVisible("Where am I?", 4000);
            hideSubtitleIfVisible(6500);
            showSubtitleIfVisible("What is this place?", 7500);
            hideSubtitleIfVisible(10000);
            showSubtitleIfVisible("I need to get out of here...", 11000);
            hideSubtitleIfVisible(13500);
            showSubtitleIfVisible("Let's double click the window in the room...", 14500);
        }

        if (loopCount === 1 && this.isInIntroPhase) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.showSubtitle(text);
                    }
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.hideSubtitle();
                    }
                }, delay);
            };

            showSubtitleIfVisible("Did I escape?", 0);
            hideSubtitleIfVisible(2000);
            showSubtitleIfVisible("Oh no, I've been here before...", 4000);
            hideSubtitleIfVisible(6000);
            showSubtitleIfVisible("It's the same storm. The same room.", 7000);
            hideSubtitleIfVisible(9000);
            showSubtitleIfVisible("But something's off...", 10000);
            hideSubtitleIfVisible(12000);
            showSubtitleIfVisible("Should I click the window again?", 13000);
        }

        if (loopCount === 2 && this.isInIntroPhase) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.showSubtitle(text);
                    }
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.hideSubtitle();
                    }
                }, delay);
            };

            showSubtitleIfVisible("I'm back... again?", 0);
            hideSubtitleIfVisible(2000);
            showSubtitleIfVisible("I know this place now.", 4000);
            hideSubtitleIfVisible(6000);
            showSubtitleIfVisible("The storm doesn't scare me anymore.", 7000);
            hideSubtitleIfVisible(9000);
            showSubtitleIfVisible("Let it come.", 10000);
            hideSubtitleIfVisible(12000);
            showSubtitleIfVisible("Let's click the window again...", 13000);
        }

        if (loopCount >= 3 && this.isInIntroPhase) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.showSubtitle(text);
                    }
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    if (wallCanvas.style.visibility !== 'hidden') {
                        this.hideSubtitle();
                    }
                }, delay);
            };

            showSubtitleIfVisible("The sandstorm is still out there.", 0);
            hideSubtitleIfVisible(2000);
            showSubtitleIfVisible("But the room... it has changed.", 4000);
            hideSubtitleIfVisible(5500);
            showSubtitleIfVisible("A chair I don't remember.", 7000);
            hideSubtitleIfVisible(8500);
            showSubtitleIfVisible("The clock also seems different.", 10000);
            hideSubtitleIfVisible(11500);
            showSubtitleIfVisible("What if I click the window again?", 13000);
        }

        // Set introComplete flag after the last subtitle
        if (loopCount === 0) {
            setTimeout(() => {
                this.introComplete = true;
            }, 14500);
        } else {
            setTimeout(() => {
                this.introComplete = true;
            }, 13000);
        }
        
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
        }, 1500);

        // Begin animation system
        this.animateSystem();
        
        // Phase control
        setTimeout(() => this.transitionPhase(1), SYSTEM_CONFIG.PHASE_TIMING.getObjectDuration() * 1000);
        setTimeout(() => this.transitionPhase(2), 
            (SYSTEM_CONFIG.PHASE_TIMING.getObjectDuration() + SYSTEM_CONFIG.PHASE_TIMING.getTransitionDuration()) * 1000);
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
                    this.windows.splice(idx, 1); // Splice out old windows
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

        //Script for object
        if (loopCount === 0) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("What is happening here?", 500);
            hideSubtitleIfVisible(3000);
            showSubtitleIfVisible("Why are these windows all flying around?", 4000);
            hideSubtitleIfVisible(6500);
            showSubtitleIfVisible("When are they going to stop?", 7500);
            hideSubtitleIfVisible(10000);
            showSubtitleIfVisible("It's turning into a human face...", 11000);
            hideSubtitleIfVisible(13500);
            showSubtitleIfVisible("It's approaching me...", 14500);
            hideSubtitleIfVisible(17000);
            showSubtitleIfVisible("Please stop!!!", 18000);
            hideSubtitleIfVisible(20500);
        }

        if (loopCount === 1) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("They're back — the flying windows.", 500);
            hideSubtitleIfVisible(2500);
            showSubtitleIfVisible("What are they?", 3500);
            hideSubtitleIfVisible(5500);
            showSubtitleIfVisible("A chair. A clock. A mirror?", 6500);
            hideSubtitleIfVisible(8500);
            showSubtitleIfVisible("Are they watching me?", 9500);
            hideSubtitleIfVisible(11500);
            showSubtitleIfVisible("No... they see me.", 12500);
            hideSubtitleIfVisible(14500);
            showSubtitleIfVisible("What do they want from me?", 15500);
            hideSubtitleIfVisible(17500);
        }

        if (loopCount === 2) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("Here they are... all the fragments.", 500);
            hideSubtitleIfVisible(2500);
            showSubtitleIfVisible("They don't chase me anymore.", 3500);
            hideSubtitleIfVisible(5500);
            showSubtitleIfVisible("They just float. Drift.", 6500);
            hideSubtitleIfVisible(8500);
            showSubtitleIfVisible("The face is forming. I see it clearly now.", 9500);
            hideSubtitleIfVisible(12500);
            showSubtitleIfVisible("It's not angry. It just is.", 12500);
            hideSubtitleIfVisible(14500);
            showSubtitleIfVisible("Like it's always been waiting.", 15500);
            hideSubtitleIfVisible(17500);
        }

        if (loopCount >= 3) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("The windows are back — now I know what they are.", 500);
            hideSubtitleIfVisible(2500);
            showSubtitleIfVisible("They're the objects from the room.", 3500);
            hideSubtitleIfVisible(5500);
            showSubtitleIfVisible("They're all in the air now.", 6500);
            hideSubtitleIfVisible(8500);
            showSubtitleIfVisible("They're tracing circles around me.", 9500);
            hideSubtitleIfVisible(11500);
            showSubtitleIfVisible("The familiar face is back.", 12500);
            hideSubtitleIfVisible(14500);
            showSubtitleIfVisible("Maybe I should face it.", 15500);
            hideSubtitleIfVisible(17500);
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
        // Adjust speed based on loop count
        let speedMultiplier = 1;
        if (loopCount === 0) {
            speedMultiplier = 1;
        } else if (loopCount === 1) {
            speedMultiplier = 1.2;
        } else if (loopCount === 2) {
            speedMultiplier = 0.75;
        } else if (loopCount >= 3) {
            speedMultiplier = 0.5;
        }

        // Random movement with adjusted speed
        win.vx += (Math.random() - 0.5) * 0.3 * speedMultiplier;
        win.vy += (Math.random() - 0.5) * 0.3 * speedMultiplier;
        
        // Bouncing at boundary
        if(win.x <= 0 || win.x >= screen.width - SYSTEM_CONFIG.WINDOW.WIDTH) win.vx *= -0.8;
        if(win.y <= 0 || win.y >= screen.height - SYSTEM_CONFIG.WINDOW.HEIGHT) win.vy *= -0.8;
        
        // Applied speed
        win.x += win.vx * speedMultiplier;
        win.y += win.vy * speedMultiplier;
    }

    updateTransitionMovement(win) {
        // Adjust speed based on loop count
        let speedMultiplier = 1;
        let attractionMultiplier = 1;
        if (loopCount === 0) {
            speedMultiplier = 1;
            attractionMultiplier = 1;
        } else if (loopCount === 1) {
            speedMultiplier = 1.2;
            attractionMultiplier = 1.2;
        } else if (loopCount === 2) {
            speedMultiplier = 0.75;
            attractionMultiplier = 0.75;
        } else if (loopCount >= 3) {
            speedMultiplier = 0.5;
            attractionMultiplier = 0.5;
        }

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
        
        win.vx += (tx - win.x) * SYSTEM_CONFIG.WINDOW.ATTRACTION * attractionMultiplier;
        win.vy += (ty - win.y) * SYSTEM_CONFIG.WINDOW.ATTRACTION * attractionMultiplier;
        
        // Speed constraints
        win.vx = Math.max(-SYSTEM_CONFIG.WINDOW.MAX_SPEED * speedMultiplier, 
            Math.min(SYSTEM_CONFIG.WINDOW.MAX_SPEED * speedMultiplier, win.vx));
        win.vy = Math.max(-SYSTEM_CONFIG.WINDOW.MAX_SPEED * speedMultiplier, 
            Math.min(SYSTEM_CONFIG.WINDOW.MAX_SPEED * speedMultiplier, win.vy));
            
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
        // Clear with more transparent fade effect for longer trails
        background(0, 0, 0, 10);
        
        // Adjust particle movement based on scaling ratio
        const scaleFactor = this.isWindowExpanding ? 
            min(1 / this.windowScale, 1) : 1;

        // Calculate moving tornado center with slower movement
        const time = millis() * 0.0005;
        // Reduce centerRadius to keep tornado more centered
        const centerRadius = min(width, height) * 0.15;
        
        // Add jitter to center position
        const jitterAmount = 8;
        const centerJitterX = noise(time * 2) * jitterAmount - jitterAmount/2;
        const centerJitterY = noise(time * 2 + 100) * jitterAmount - jitterAmount/2;
        
        // Keep tornado centered with smaller movement range
        const tornadoCenterX = width/2 + cos(time * 0.2) * centerRadius + centerJitterX;
        const tornadoCenterY = height/2 + sin(time * 0.2) * centerRadius + centerJitterY;
        
        // Adjust speeds based on loop count
        let rotationSpeedMultiplier = 1;
        let upwardSpeedMultiplier = 1;
        let jitterRangeMultiplier = 1;
        
        if (loopCount === 0) {
            // First few loops - normal speed
            rotationSpeedMultiplier = 1;
            upwardSpeedMultiplier = 1;
            jitterRangeMultiplier = 1;
        } else if (loopCount === 1) {
            // Middle loops - faster
            rotationSpeedMultiplier = 1.2;
            upwardSpeedMultiplier = 1.2;
            jitterRangeMultiplier = 1.2;
        } else if (loopCount === 2) {
            // Later loops - even faster
            rotationSpeedMultiplier = 0.75;
            upwardSpeedMultiplier = 0.75;
            jitterRangeMultiplier = 0.75;
        } else if (loopCount >= 3) {
            // Final loops - fastest
            rotationSpeedMultiplier = 0.5;
            upwardSpeedMultiplier = 0.5;
            jitterRangeMultiplier = 0.5;
        }
        
        this.particles.forEach(p => {
            // Update particle angle with adjusted rotation speed
            p.angle += p.rotationSpeed * 0.7 * rotationSpeedMultiplier;
            
            // Calculate radius based on height (funnel shape)
            const heightRatio = p.height / height;
            const currentRadius = p.baseRadius * (1 - heightRatio * 0.8);
            
            // Update jitter values with adjusted range
            p.jitterX = lerp(p.jitterX, random(-p.jitterRange, p.jitterRange) * jitterRangeMultiplier, 0.1);
            p.jitterY = lerp(p.jitterY, random(-p.jitterRange, p.jitterRange) * jitterRangeMultiplier, 0.1);
            
            // Add circular offset with adjusted movement
            const offsetX = cos(p.offsetAngle + time * 0.5) * currentRadius * 0.3 + p.jitterX;
            const offsetY = sin(p.offsetAngle + time * 0.5) * currentRadius * 0.3 + p.jitterY;
            
            // Calculate new position with tornado motion and jitter
            p.x = tornadoCenterX + cos(p.angle) * currentRadius + offsetX;
            p.y = p.height + offsetY;
            
            // Move particle upward at adjusted speed
            p.height -= p.upwardSpeed * 0.7 * upwardSpeedMultiplier;
            
            // Reset particle when it reaches the top
            if (p.height < 0) {
                p.height = height;
                p.x = random(width);
                p.y = height;
                p.angle = random(TWO_PI);
                p.offsetAngle = random(TWO_PI);
                p.opacity = random(50, 200);
                p.jitterX = 0;
                p.jitterY = 0;
                p.jitterRange = random(3, 8); // Reset jitter range
            }
            
            // Draw particle with random opacity
            stroke(198, 163, 113, p.opacity);
            strokeWeight(random(1, 5));
            point(p.x, p.y);
        });
    }

    // Phase changing
    transitionPhase(newPhase) {
        this.currentPhase = newPhase;
        switch(newPhase) {
            case 1: // Keep the original logic of transition
            setTimeout(() => this.triggerFaceWindowsScaleUp(), 4000);
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
        const baseLength = length || random() * SYSTEM_CONFIG.CRACK.MAX_LENGTH;
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
        console.log('Starting cracking effect...');
        this.isCracking = true;
        this.crackingComplete = false; // Reset cracking complete flag
        crackCanvas.style.visibility = 'visible';
        crackCanvas.style.opacity = '1';
        maskCanvas.style.visibility = 'visible';

        // Play cracking sound once
        crackingSound.currentTime = 0; // Reset to start
        crackingSound.play();

        // Set z-index to ensure crack canvas is on top
        crackCanvas.style.zIndex = '10';
        maskCanvas.style.zIndex = '9';
        wallCanvas.style.zIndex = '8';
        sandstormCanvas.style.zIndex = '7';

        // Make sure crack canvas is clickable
        crackCanvas.style.pointerEvents = 'auto';

        // Keep sandstorm sound playing and adjust volume based on mask progress
        const updateSoundVolume = () => {
            // Volume decreases as mask covers more of the screen
            const targetVolume = 0.2 * (1 - this.maskProgress);
            sandstormSound.volume = Math.max(0, targetVolume);
            
            if (this.isCracking) {
                requestAnimationFrame(updateSoundVolume);
            }
        };
        updateSoundVolume();

        // Function to fade out earthquake sound
        const fadeOutEarthquakeSound = () => {
            if (earthquakeSound.volume > 0) {
                earthquakeSound.volume = Math.max(0, earthquakeSound.volume - 0.01);
                requestAnimationFrame(fadeOutEarthquakeSound);
            } else {
                earthquakeSound.pause();
                earthquakeSound.currentTime = 0;
                earthquakeSound.volume = 0.5; // Reset volume for next time
            }
        };

        // Function to download text file
        const downloadTextFile = () => {
            const text = "Are you truly awake?";
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Get current time and format it as YYMMDD-HHMMSS
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
            a.download = `message_${timestamp}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // Add timeout for automatic closure after 30 seconds
        this.inactivityTimeout = setTimeout(() => {
            console.log('Inactivity timeout reached, closing windows...');
            // Close subtitle window first
            if (this.subtitleWindow && !this.subtitleWindow.closed) {
                this.subtitleWindow.close();
            }
            this.closeAllWindows();
            // Send message to home page
            if (window.opener) {
                window.opener.postMessage({ 
                    type: 'showMessage',
                    text: 'Are you truly awake?'
                }, '*');
            }
            // Download text file before closing
            downloadTextFile();
            // Close the room window
            window.close();
        }, 25000);

        // Reset timeout on any interaction
        const resetTimeout = () => {
            // Only reset timeout if cracking phase is complete
            if (!this.crackingComplete) return;
            
            clearTimeout(this.inactivityTimeout);
            countdown = 25;
            countdownElement.textContent = `${countdown}s`;
            this.inactivityTimeout = setTimeout(() => {
                console.log('Inactivity timeout reached, closing windows...');
                // Close subtitle window first
                if (this.subtitleWindow && !this.subtitleWindow.closed) {
                    this.subtitleWindow.close();
                }
                this.closeAllWindows();
                if (window.opener) {
                    window.opener.postMessage({ 
                        type: 'showMessage',
                        text: 'Are you truly awake?'
                    }, '*');
                }
                // Download text file before closing
                downloadTextFile();
                window.close();
            }, 25000);
        };

        // Add event listeners to reset timeout
        // document.addEventListener('mousemove', resetTimeout);
        document.addEventListener('click', resetTimeout);
        document.addEventListener('keydown', resetTimeout);

        const windowRect = this.getCurrentWindowRect();
        const centerX = windowRect.x + windowRect.width / 2;
        const centerY = windowRect.y + windowRect.height / 2;

        // Initialize mask canvas
        maskCanvas.width = windowWidth;
        maskCanvas.height = windowHeight;
        const maskCtx = maskCanvas.getContext('2d');

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

        // Start mask animation with delay
        setTimeout(() => {
            const animateMask = () => {
                const windowRect = this.getCurrentWindowRect();
                const currentBottomY = windowRect.y + windowRect.height * (1 - this.maskProgress);

                let targetY;
                if (loopCount < 3) {
                    targetY = windowRect.y + windowRect.height * 0.35;
                }
                if (loopCount >= 3) {
                    targetY = windowRect.y + windowRect.height * 0.45;
                }
                
                if (currentBottomY > targetY) {
                    // Update tilt while moving
                    this.maskTilt += (Math.random() - 0.5) * 0.05;
                    this.maskTilt = Math.max(-this.maskTiltVariation, 
                        Math.min(this.maskTiltVariation, this.maskTilt));
                    
                    this.currentSpeed = this.maskAnimationSpeed + 
                        (Math.random() - 0.5) * this.maskSpeedVariation;
                    this.maskProgress += this.currentSpeed;

                    // Play earthquake sound if not already playing
                    if (earthquakeSound.paused) {
                        earthquakeSound.currentTime = 0;
                        earthquakeSound.volume = 0.5;
                        earthquakeSound.play();
                    }
                } else if (this.finalTilt === null) {
                    // Set final tilt when stopping
                    this.finalTilt = this.maskTilt;
                    
                    // Fade out earthquake sound
                    fadeOutEarthquakeSound();
                    
                    console.log('Mask stopped moving, adding click handler...');
                    // Remove any existing click handlers first
                    crackCanvas.removeEventListener('click', this.handleCrackClick);
                    
                    // Add click handler that checks crackingComplete
                    this.handleCrackClick = () => {
                        if (!this.crackingComplete) return;
                        console.log('Crack canvas clicked!');
                        incrementLoopCount(); // Increment loop count before refresh
                        window.location.reload();
                    };
                    crackCanvas.addEventListener('click', this.handleCrackClick);

                    // Start countdown after mask stops moving
                    let countdown = 25;
                    const countdownElement = document.getElementById('countdown');
                    countdownElement.style.visibility = 'hidden';
                    
                    const updateCountdown = () => {
                        countdownElement.textContent = `${countdown}s`;
                        countdown--;
                        
                        if (countdown >= 0) {
                            setTimeout(updateCountdown, 1000);
                        }
                    };
                    
                    updateCountdown();

                    // Add timeout for automatic closure after 30 seconds
                    this.inactivityTimeout = setTimeout(() => {
                        console.log('Inactivity timeout reached, closing windows...');
                        // Close subtitle window first
                        if (this.subtitleWindow && !this.subtitleWindow.closed) {
                            this.subtitleWindow.close();
                        }
                        this.closeAllWindows();
                        // Send message to home page
                        if (window.opener) {
                            window.opener.postMessage({ 
                                type: 'showMessage',
                                text: 'Are you truly awake?'
                            }, '*');
                        }
                        // Download text file before closing
                        downloadTextFile();
                        window.close();
                    }, 25000);

                    // Reset timeout on any interaction
                    const resetTimeout = () => {
                        clearTimeout(this.inactivityTimeout);
                        countdown = 25;
                        countdownElement.textContent = `${countdown}s`;
                        this.inactivityTimeout = setTimeout(() => {
                            console.log('Inactivity timeout reached, closing windows...');
                            // Close subtitle window first
                            if (this.subtitleWindow && !this.subtitleWindow.closed) {
                                this.subtitleWindow.close();
                            }
                            this.closeAllWindows();
                            if (window.opener) {
                                window.opener.postMessage({ 
                                    type: 'showMessage',
                                    text: 'Are you truly awake?'
                                }, '*');
                            }
                            // Download text file before closing
                            downloadTextFile();
                            window.close();
                        }, 25000);
                    };

                    // Add event listeners to reset timeout
                    // document.addEventListener('mousemove', resetTimeout);
                    document.addEventListener('click', resetTimeout);
                    document.addEventListener('keydown', resetTimeout);
                }
                
                // Use final tilt if set, otherwise use current tilt
                const currentTilt = this.finalTilt !== null ? this.finalTilt : this.maskTilt;
                
                this.drawMask();
                requestAnimationFrame(animateMask);
            };
            animateMask();
        }, 2000); // 2 second delay

        //Script for cracking glass
        if (loopCount === 0) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("The glass is breaking...", 2000);
            hideSubtitleIfVisible(4500);
            showSubtitleIfVisible("The room is sinking...", 5500);
            hideSubtitleIfVisible(8000);
            showSubtitleIfVisible("There's a breach left...", 9000);
            hideSubtitleIfVisible(11500);
            showSubtitleIfVisible("Let's click to escape...", 12500);
            
            // Set crackingComplete flag after the last subtitle
            setTimeout(() => {
                this.crackingComplete = true;
            }, 12500);
        }

        if (loopCount === 1) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("The glass can't hold.", 2000);
            hideSubtitleIfVisible(4000);
            showSubtitleIfVisible("The ground is pulling me down.", 5000);
            hideSubtitleIfVisible(7000);
            showSubtitleIfVisible("I can't escape this loop.", 8000);
            hideSubtitleIfVisible(10000);
            showSubtitleIfVisible("There it is again — the breach...", 11000);
            hideSubtitleIfVisible(13000);
            showSubtitleIfVisible("Should I trust it again? Let's click.", 14000);
            
            // Set crackingComplete flag after the last subtitle
            setTimeout(() => {
                this.crackingComplete = true;
            }, 14000);
        }

        if (loopCount === 2) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("The glass breaks like before.", 2000);
            hideSubtitleIfVisible(4000);
            showSubtitleIfVisible("The room sinks like before.", 5000);
            hideSubtitleIfVisible(7000);
            showSubtitleIfVisible("But this time, I'm not afraid.", 8000);
            hideSubtitleIfVisible(10000);
            showSubtitleIfVisible("I could reach for the breach...", 11000);
            hideSubtitleIfVisible(13000);
            showSubtitleIfVisible("Or... just stay.", 14000);
            
            // Set crackingComplete flag after the last subtitle
            setTimeout(() => {
                this.crackingComplete = true;
            }, 14000);
        }

        if (loopCount >= 3) {
            const showSubtitleIfVisible = (text, delay) => {
                setTimeout(() => {
                    this.showSubtitle(text);
                }, delay);
            };

            const hideSubtitleIfVisible = (delay) => {
                setTimeout(() => {
                    this.hideSubtitle();
                }, delay);
            };

            showSubtitleIfVisible("The glass shatters again.", 2000);
            hideSubtitleIfVisible(4000);
            showSubtitleIfVisible("The breach is wider now.", 5000);
            hideSubtitleIfVisible(7000);
            showSubtitleIfVisible("But maybe I'm meant to stay still.", 8000);
            hideSubtitleIfVisible(10000);
            showSubtitleIfVisible("Maybe stillness is the way out.", 11000);

            // Set crackingComplete flag after the last subtitle
            setTimeout(() => {
                this.crackingComplete = true;
            }, 11000);
        }

        this.animateCracks();
    }

    drawMask() {
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        const windowRect = this.getCurrentWindowRect();
        // const maskHeight = maskCanvas.height * this.maskProgress;
        
        // Use final tilt if set, otherwise use current tilt
        const currentTilt = this.finalTilt !== null ? this.finalTilt : this.maskTilt;
        
        // Draw black mask covering everything except the window
        maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        
        // Top mask
        maskCtx.fillRect(0, 0, maskCanvas.width, windowRect.y);
        
        // Left mask
        maskCtx.fillRect(0, windowRect.y, windowRect.x, windowRect.height);
        
        // Right mask
        maskCtx.fillRect(
            windowRect.x + windowRect.width,
            windowRect.y,
            maskCanvas.width - (windowRect.x + windowRect.width),
            windowRect.height
        );
        
        // Bottom mask with tilt
        const centerX = windowRect.x + windowRect.width / 2;
        const bottomMaskY = Math.min(
            windowRect.y + windowRect.height,
            windowRect.y + windowRect.height * (1 - this.maskProgress)
        );
        
        // Calculate tilted bottom edge
        const tiltOffset = Math.tan(currentTilt) * maskCanvas.width;
        const leftY = bottomMaskY - tiltOffset / 2;
        const rightY = bottomMaskY + tiltOffset / 2;
        
        // Draw tilted bottom mask
        maskCtx.beginPath();
        maskCtx.moveTo(0, leftY);
        maskCtx.lineTo(maskCanvas.width, rightY);
        maskCtx.lineTo(maskCanvas.width, maskCanvas.height);
        maskCtx.lineTo(0, maskCanvas.height);
        maskCtx.closePath();
        maskCtx.fill();
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

        if (loopCount === 0) {
            setTimeout(() => {
                this.showSubtitle("It finally stopped...");
            }, 500);
            setTimeout(() => {
                this.hideSubtitle();
            }, 2000);
        }
        // Start the cracking effect after windows are closed
        setTimeout(() => this.startCracking(), 3000);
    }

    // Create subtitle window
    createSubtitleWindow() {
        const width = windowWidth * 0.7;
        const height = 120;
        const x = (screen.width - width) / 2;
        const y = screen.height - height - 95;
        
        this.subtitleWindow = window.open(
            './subtitle.html',
            'subtitle',
            `width=${width},height=${height},left=${x},top=${y},resizable=no,scrollbars=no,status=no`
        );

        // Add subtle window movement
        setInterval(() => {
            if (this.subtitleWindow && !this.subtitleWindow.closed) {
                const offsetX = random() * 4 - 2;
                const offsetY = random() * 4 - 2;
                this.subtitleWindow.moveTo(x + offsetX, y + offsetY);
            }
        }, 50);
    }

    // Show subtitle text
    showSubtitle(text) {
        if (this.subtitleWindow && !this.subtitleWindow.closed) {
            this.subtitleWindow.postMessage({ text }, '*');
        }
    }

    // Hide subtitle
    hideSubtitle() {
        if (this.subtitleWindow && !this.subtitleWindow.closed) {
            this.subtitleWindow.postMessage({ hide: true }, '*');
        }
    }
}