let particles = [];
const maxParticles = 300;
let flowField;
let cols, rows;
let zoff = 0;
let isTransitioning = false;
let blackHoleActive = false;
let blackHolePosition = null;
let blackHoleStrength = 0;
let fadeToBlack = 0;
let initialBgColor;
let targetBgColor;
let font;
let letterPoints = [];
let currentTextIndex = 0;
let lastTextChange = 0;
let textConfigs;
let isFormingLetter = true;
let transitionProgress = 0;
let transitionDuration = 4000; // 4 seconds for transition
let letterParticles = [];
let nextLetterPoints = [];
let isFreeMovement = false;
let freeMovementDuration = 2500; // 2.5 seconds of free movement
let lastPhaseChange = 0;
let hasStartedTransition = false;
let noiseOffset = 0;
let isAbsorbing = false;
let fadeInProgress = 0; // Add fade-in progress variable
let fadeInDuration = 2000; // 3 seconds fade-in duration
let fadeInDelay = 1000; // 1 second delay before fade-in starts
let fadeInStartTime = 0; // Time when fade-in should start
let cursorParticle;
let cursorPulseSpeed = 0.05; // Speed of the pulse animation
let cursorPulsePhase = 0; // Phase of the pulse animation
let isHoveringButton = false;
let hintSuckingInProgress = false;
let bgMusic; // Add background music variable

// Array of text to display
const textArray = [
    { text: 'DREAM', size: 100, duration: 7000 },
    { text: 'ANXIETY', size: 100, duration: 7000 },
    { text: 'ESCAPE', size: 100, duration: 7000 },
    { text: 'TRAPPED', size: 100, duration: 7000 },
    { text: 'CONTROL', size: 100, duration: 7000 },
    { text: 'LOST', size: 100, duration: 7000 },
    { text: 'FEAR', size: 100, duration: 7000 },
    { text: 'CHAOS', size: 100, duration: 7000 }
];

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function preload() {
    font = loadFont('assets/Roboto-VariableFont_wdth,wght.ttf');
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('particles-container');
    
    // Initialize background music
    bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.5; // Set volume to 50%
    
    // Play music when user interacts with the page
    const playMusic = () => {
        bgMusic.play();
        document.removeEventListener('click', playMusic);
        document.removeEventListener('keypress', playMusic);
    };
    
    // Add event listeners for first interaction
    document.addEventListener('click', playMusic);
    document.addEventListener('keypress', playMusic);
    
    // Hide default cursor for the entire document
    document.body.style.cursor = 'none';
    
    // Create cursor particle
    cursorParticle = new Particle();
    cursorParticle.maxSpeed = 0;
    
    // Set the fade-in start time
    fadeInStartTime = millis() + fadeInDelay;

    // Create a copy of textArray and shuffle it
    textConfigs = [...textArray];
    shuffleArray(textConfigs);
    
    // Randomize text properties
    textConfigs = textConfigs.map(config => ({
        ...config,
        size: random(100, 120), // Random size between 100 and 120
        duration: random(7000, 8000) // Random duration between 7 and 8 seconds
    }));
    
    // Take only 6 random texts from the shuffled array
    textConfigs = textConfigs.slice(0, 6);
    
    console.log('Shuffled text sequence:', textConfigs.map(config => 
        `${config.text} (size: ${Math.round(config.size)}, duration: ${Math.round(config.duration/1000)}s)`
    ));

    // Initialize letter points with first text configuration
    updateLetterPoints();
    
    // Initialize colors
    initialBgColor = color(10, 10, 42);
    targetBgColor = color(0, 0, 0);
    
    // Initialize flow field
    cols = floor(windowWidth / 20);
    rows = floor(windowHeight / 20);
    flowField = new Array(cols * rows);
    
    // Create particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }

    // Show button after 25 seconds
    setTimeout(() => {
        document.getElementById('myButton').classList.add('fade-in');
    }, 25000);

    // Add keypress event listener for 'e' key to show button immediately
    document.addEventListener('keypress', function(event) {
        if (event.key === 'e' || event.key === 'E') {
            document.getElementById('myButton').classList.add('fade-in');
        }
    });
}

function getRandomTextPosition() {
    // Generate random position within specified bounds
    let x = random(100, windowWidth - 500);
    let y = random(200, windowHeight - 200);
    
    return { x, y };
}

function updateLetterPoints() {
    const config = textConfigs[currentTextIndex];
    
    // Get random position for the text
    let position = getRandomTextPosition();
    config.x = position.x;
    config.y = position.y;
    
    nextLetterPoints = font.textToPoints(config.text, config.x, config.y, config.size);
    console.log('Updating letter points for:', config.text, 'at position:', config.x, config.y);
    
    // Create or update letter particles
    while (letterParticles.length < nextLetterPoints.length) {
        letterParticles.push(new Particle());
    }
    while (letterParticles.length > nextLetterPoints.length) {
        letterParticles.pop();
    }
}

function draw() {
    // Update fade-in progress
    if (millis() >= fadeInStartTime && fadeInProgress < 1) {
        fadeInProgress = min(1, (millis() - fadeInStartTime) / fadeInDuration);
    }
    // Fade in the window hint in sync with particles (only when not absorbing or sucking)
    if (!isAbsorbing && !hintSuckingInProgress) {
        const hintEl = document.getElementById('window-hint');
        if (hintEl && hintEl.style.visibility !== 'hidden') {
            hintEl.style.opacity = String(fadeInProgress);
        }
    }

    // Update cursor particle position to follow mouse
    cursorParticle.pos.x = mouseX;
    cursorParticle.pos.y = mouseY;
    
    // Update pulse phase only if not hovering button
    if (!isHoveringButton) {
        cursorPulsePhase += cursorPulseSpeed;
    }
    let pulseValue = isHoveringButton ? 1 : (sin(cursorPulsePhase) + 1) / 2;
    
    // Only update text states if not absorbing
    if (!isAbsorbing) {
        // Check if it's time to change text
        if (!hasStartedTransition && millis() - lastTextChange >= textConfigs[currentTextIndex].duration) {
            console.log('Duration ended for:', textConfigs[currentTextIndex].text);
            isFormingLetter = false;
            transitionProgress = 0;
            isFreeMovement = true;
            lastPhaseChange = millis();
            hasStartedTransition = true;
        }

        // Check if free movement phase should end
        if (isFreeMovement && millis() - lastPhaseChange >= freeMovementDuration) {
            console.log('Free movement ended, changing to next text');
            isFreeMovement = false;
            currentTextIndex = (currentTextIndex + 1) % textConfigs.length;
            lastTextChange = millis();
            updateLetterPoints();
            isFormingLetter = true;
            transitionProgress = 0;
            hasStartedTransition = false;
        }

        // Update transition progress
        if (isFormingLetter) {
            transitionProgress = min(1, transitionProgress + (deltaTime / transitionDuration));
        } else if (!isFreeMovement) {
            transitionProgress = max(0, transitionProgress - (deltaTime / transitionDuration));
        }
    }

    // Update noise offset for random movement
    noiseOffset += 0.05;

    // Smooth color transition using lerpColor
    let currentBgColor = lerpColor(initialBgColor, targetBgColor, fadeToBlack);
    background(currentBgColor);
    
    // Update flow field
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let angle = noise(xoff, yoff, zoff) * TWO_PI * 4;
            let v = p5.Vector.fromAngle(angle);
            v.setMag(1);
            flowField[index] = v;
            xoff += 0.1;
        }
        yoff += 0.1;
    }
    zoff += 0.01;

    // Update and display letter particles
    for (let i = letterParticles.length - 1; i >= 0; i--) {
        let particle = letterParticles[i];
        let targetPoint = nextLetterPoints[i];
        
        if (targetPoint) {
            if (isAbsorbing) {
                // During absorption, only apply black hole force
                if (blackHoleActive && blackHolePosition) {
                    let force = p5.Vector.sub(blackHolePosition, particle.pos);
                    let distance = force.mag();
                    force.normalize();
                    force.mult(blackHoleStrength * (1 / (distance * 0.1 + 1)));
                    particle.applyForce(force);
                    
                    if (distance < 5) {
                        letterParticles.splice(i, 1);
                    }
                }
            } else {
                if (isFreeMovement) {
                    // During free movement, particles follow the flow field and flock
                    particle.follow(flowField);
                    particle.flock(particles);
                    particle.attractToMouse();
                } else {
                    // Calculate target position based on transition progress
                    let targetX = lerp(particle.pos.x, targetPoint.x, transitionProgress);
                    let targetY = lerp(particle.pos.y, targetPoint.y, transitionProgress);
                    
                    // During transition, combine flow field/flocking with letter formation
                    if (transitionProgress < 1) {
                        // Follow flow field and flock with other particles
                        particle.follow(flowField);
                        particle.flock(particles);
                        particle.attractToMouse();
                        
                        // Add force towards letter position
                        let target = createVector(targetX, targetY);
                        let force = p5.Vector.sub(target, particle.pos);
                        force.mult(0.03); // Reduced force to allow more flow field influence
                        particle.applyForce(force);
                    } else {
                        // Once transition is complete, stay at letter position
                        let target = createVector(targetX, targetY);
                        let force = p5.Vector.sub(target, particle.pos);
                        force.mult(0.15);
                        particle.applyForce(force);
                    }
                    
                    // Add damping to reduce oscillation
                    particle.vel.mult(0.95);
                }
            }
            
            particle.update();
            
            // Draw particle with glow effect
            push();
            blendMode(ADD);
            
            // Apply fade-in effect to opacity
            const opacity = fadeInProgress * 255;
            
            // Draw outer glow
            noStroke();
            fill(255, 255, 255, 30 * (opacity / 255));
            circle(particle.pos.x, particle.pos.y, 12);
            
            // Draw middle glow
            fill(255, 255, 255, 50 * (opacity / 255));
            circle(particle.pos.x, particle.pos.y, 8);
            
            // Draw inner glow
            fill(255, 255, 255, 80 * (opacity / 255));
            circle(particle.pos.x, particle.pos.y, 4);
            
            pop();
        }
    }

    // Update and display regular particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        
        // Apply black hole effect if active
        if (blackHoleActive && blackHolePosition) {
            let force = p5.Vector.sub(blackHolePosition, particle.pos);
            let distance = force.mag();
            force.normalize();
            force.mult(blackHoleStrength * (1 / (distance * 0.1 + 1)));
            particle.applyForce(force);
            
            if (distance < 5) {
                particles.splice(i, 1);
            }
        } else {
            particle.follow(flowField);
            particle.flock(particles);
            particle.attractToMouse();
        }
        
        particle.update();
        particle.display();
    }
    
    // Display cursor particle with enhanced glow and pulse effect
    push();
    blendMode(ADD);
    
    // Apply fade-in effect to opacity
    const opacity = fadeInProgress * 255;
    
    // Calculate pulse-based sizes and opacities
    let outerSize = lerp(20, 30, pulseValue);
    let middleSize = lerp(12, 20, pulseValue);
    let innerSize = lerp(6, 10, pulseValue);
    
    let outerOpacity = lerp(30, 70, pulseValue);
    let middleOpacity = lerp(50, 100, pulseValue);
    let innerOpacity = lerp(80, 150, pulseValue);
    
    // Draw outer glow for cursor
    noStroke();
    fill(255, 255, 255, outerOpacity * (opacity / 255));
    circle(cursorParticle.pos.x, cursorParticle.pos.y, outerSize);
    
    // Draw middle glow for cursor
    fill(255, 255, 255, middleOpacity * (opacity / 255));
    circle(cursorParticle.pos.x, cursorParticle.pos.y, middleSize);
    
    // Draw inner glow for cursor
    fill(255, 255, 255, innerOpacity * (opacity / 255));
    circle(cursorParticle.pos.x, cursorParticle.pos.y, innerSize);
    
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    cols = floor(width / 20);
    rows = floor(height / 20);
    flowField = new Array(cols * rows);
}

class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 5;
        this.prevPos = this.pos.copy();
        this.color = color(255, 255, 255, 100);
        this.flockRadius = 50;
        this.separationRadius = 20;
        this.mouseAttractRadius = 200;
        this.mouseRepelRadius = 20;
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.prevPos = this.pos.copy();
        this.pos.add(this.vel);
        this.acc.mult(0);

        // Wrap around edges
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.y > height) this.pos.y = 0;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    follow(flowField) {
        let x = floor(this.pos.x / 20);
        let y = floor(this.pos.y / 20);
        let index = x + y * cols;
        
        if (index >= 0 && index < flowField.length) {
            let force = flowField[index];
            this.applyForce(force);
        }
    }

    flock(particles) {
        let steering = createVector(0, 0);
        let cohesion = createVector(0, 0);
        let separation = createVector(0, 0);
        let alignment = createVector(0, 0);
        let count = 0;

        for (let other of particles) {
            if (other === this) continue;

            let d = p5.Vector.dist(this.pos, other.pos);
            
            // Separation
            if (d < this.separationRadius) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize();
                diff.div(d);
                separation.add(diff);
            }

            // Cohesion and Alignment
            if (d < this.flockRadius) {
                cohesion.add(other.pos);
                alignment.add(other.vel);
                count++;
            }
        }

        // Apply separation
        if (separation.mag() > 0) {
            separation.normalize();
            separation.mult(2);
            steering.add(separation);
        }

        // Apply cohesion
        if (count > 0) {
            cohesion.div(count);
            let cohesionForce = p5.Vector.sub(cohesion, this.pos);
            cohesionForce.normalize();
            cohesionForce.mult(0.5);
            steering.add(cohesionForce);
        }

        // Apply alignment
        if (count > 0) {
            alignment.div(count);
            alignment.normalize();
            alignment.mult(0.5);
            steering.add(alignment);
        }

        this.applyForce(steering);
    }

    attractToMouse() {
        let mousePos = createVector(mouseX, mouseY);
        let d = p5.Vector.dist(this.pos, mousePos);
        
        if (d < this.mouseAttractRadius) {
            let force = p5.Vector.sub(mousePos, this.pos);
            force.normalize();
            
            // Calculate force strength based on distance
            let strength;
            if (d < this.mouseRepelRadius) {
                // Repulsion when very close to mouse
                strength = 3 * (1 - d/this.mouseRepelRadius);
                force.mult(-strength); // Negative force for repulsion
            } else {
                // Attraction when further from mouse
                strength = 4 * (1 - d/this.mouseAttractRadius);
                force.mult(strength);
            }
            
            this.applyForce(force);
        }
    }

    display() {
        push();
        // Set blend mode for glow effect
        blendMode(ADD);
        
        // Apply fade-in effect to opacity
        const opacity = fadeInProgress * 255;
        
        // Draw outer glow
        noStroke();
        fill(255, 255, 255, 30 * (opacity / 255));
        circle(this.pos.x, this.pos.y, 12);
        
        // Draw middle glow
        fill(255, 255, 255, 50 * (opacity / 255));
        circle(this.pos.x, this.pos.y, 6);
        
        // Draw inner glow
        fill(255, 255, 255, 80 * (opacity / 255));
        circle(this.pos.x, this.pos.y, 4);
        
        pop();
    }
}

// Button interaction
const startButton = document.querySelector('.start-button');

startButton.addEventListener('click', function() {
    if (isTransitioning) return;
    isTransitioning = true;
    isAbsorbing = true; // Set absorbing state

    // Add shrinking animation instead of dissolving
    startButton.classList.add('shrinking');

    // Get button center position for black hole
    const rect = startButton.getBoundingClientRect();
    blackHolePosition = createVector(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
    );
    blackHoleActive = true;
    blackHoleStrength = 0;
    fadeToBlack = 0;

    // Fade out the window hint in place when entering the dream
    const hintEl = document.getElementById('window-hint');
    if (hintEl) {
        hintSuckingInProgress = true;
        const duration = 600;
        const startTime = performance.now();
        function fadeHint() {
            const t = (performance.now() - startTime) / duration;
            if (t >= 1) {
                hintEl.style.visibility = 'hidden';
                hintEl.style.opacity = '0';
                hintSuckingInProgress = false;
                return;
            }
            hintEl.style.opacity = String(1 - t);
            requestAnimationFrame(fadeHint);
        }
        requestAnimationFrame(fadeHint);
    }

    // Animate black hole strength and background fade
    let strengthInterval = setInterval(() => {
        blackHoleStrength += 0.1; // Slower increase for more dramatic effect
        fadeToBlack += 0.007; // Slower fade to black
        if (blackHoleStrength >= 15) { // Increased maximum strength
            clearInterval(strengthInterval);
        }
    }, 50);

    // Check for particle absorption and open window when complete
    let checkInterval = setInterval(() => {
        if (particles.length === 0 && letterParticles.length === 0) {
            clearInterval(checkInterval);
            // Add 0.5s delay before opening the room page
            setTimeout(() => {
                // Set flag to indicate coming from home page
                localStorage.setItem('fromHomePage', 'true');
                
                const width = window.innerWidth * 0.9;
                const height = window.innerHeight * 0.83;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 4;

                const newWindow = window.open('room.html', '', `width=${width},height=${height},top=${top},left=${left}`);

                // Add subtle window movement
                setInterval(() => {
                    const offsetX = Math.random() * 4 - 2;
                    const offsetY = Math.random() * 4 - 2;
                    newWindow.moveTo(left + offsetX, top + offsetY);
                }, 50);
            }, 500); // 500ms delay
        }
    }, 100); // Check every 100ms
});

// Add message handling for window messages
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'showMessage') {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = event.data.text;
        messageContainer.classList.add('visible');
        
        // Hide the button when message is shown
        document.getElementById('myButton').style.display = 'none';
        
        // Fade out particles
        fadeToBlack = 1;
    }
});

// Add event listeners for button hover
document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.querySelector('.start-button');
    
    startButton.addEventListener('mouseenter', function() {
        isHoveringButton = true;
    });
    
    startButton.addEventListener('mouseleave', function() {
        isHoveringButton = false;
    });
});

