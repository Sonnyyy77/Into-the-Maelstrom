let particles = [];
const maxParticles = 500;
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
let bgMusic; // Add background music variable
let oscillationOffset = 0; // Add this at the top with other global variables
let mainLetterPoints = [];
let nameLetterPoints = [];

// Array of text to display
const textArray = [
    // { text: 'INTO THE MAELSTROM', size: 105, duration: 7000 }
    { text: 'INTO THE MAELSTROM', size: 80, duration: 7000 }
    // { text: 'SONNY YAN', size: 80, duration: 7000 }
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
    
    // Hide default cursor for the entire document
    document.body.style.cursor = 'none';
    
    // Create cursor particle
    // cursorParticle = new Particle();
    // cursorParticle.maxSpeed = 0;
    
    // Set the fade-in start time
    fadeInStartTime = millis() + fadeInDelay;

    // Create a copy of textArray and shuffle it
    textConfigs = [...textArray];
    shuffleArray(textConfigs);
    
    // Randomize text properties
    textConfigs = textConfigs.map(config => ({
        ...config
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
    // Calculate center position
    let x = windowWidth / 2;
    let y = windowHeight / 2;
    
    return { x, y };
}

function updateLetterPoints() {
    const mainConfig = textConfigs[0];
    // const nameConfig = textConfigs[1];
    
    // Set fixed positions for both texts
    mainConfig.x = 280; // Fixed pixel position from left 190
    mainConfig.y = 450; // Fixed pixel position from top 450
    // nameConfig.x = 520; // Fixed pixel position from left
    // nameConfig.y = 550; // Fixed pixel position from top
    
    // Update points for each text separately
    mainLetterPoints = font.textToPoints(mainConfig.text, mainConfig.x, mainConfig.y, mainConfig.size);
    // nameLetterPoints = font.textToPoints(nameConfig.text, nameConfig.x, nameConfig.y, nameConfig.size);
    
    // Combine points in the correct order
    nextLetterPoints = [...mainLetterPoints];
    
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

    // Update oscillation offset
    oscillationOffset += 0.02; // Adjust this value to change oscillation speed

    // Update cursor particle position to follow mouse
    // cursorParticle.pos.x = mouseX;
    // cursorParticle.pos.y = mouseY;
    
    // Update pulse phase only if not hovering button
    if (!isHoveringButton) {
        cursorPulsePhase += cursorPulseSpeed;
    }
    let pulseValue = isHoveringButton ? 1 : (sin(cursorPulsePhase) + 1) / 2;
    
    // Always keep text visible
    if (!isAbsorbing) {
        // Update letter points to maintain text visibility
        updateLetterPoints();
        
        // Keep transition progress at 1 to maintain text visibility
        transitionProgress = 1;
        isFormingLetter = true;
        isFreeMovement = false;
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
                } else {
                    // Calculate target position based on transition progress
                    let targetX = lerp(particle.pos.x, targetPoint.x, transitionProgress);
                    let targetY = lerp(particle.pos.y, targetPoint.y, transitionProgress);
                    
                    // Add subtle oscillation to the target position
                    let oscillationX = sin(oscillationOffset + i * 0.1) * 2; // Adjust amplitude (2) to change oscillation size
                    let oscillationY = cos(oscillationOffset + i * 0.1) * 2;
                    
                    targetX += oscillationX;
                    targetY += oscillationY;
                    
                    // During transition, combine flow field/flocking with letter formation
                    if (transitionProgress < 1) {
                        particle.follow(flowField);
                        particle.flock(particles);
                        
                        // Add force towards letter position
                        let target = createVector(targetX, targetY);
                        let force = p5.Vector.sub(target, particle.pos);
                        force.mult(0.02);
                        particle.applyForce(force);
                    } else {
                        // Create continuous oscillation around target position
                        let target = createVector(targetX, targetY);
                        let force = p5.Vector.sub(target, particle.pos);
                        
                        // Add spring-like behavior
                        let distance = force.mag();
                        force.normalize();
                        force.mult(distance * 0.1); // Spring constant
                        
                        // Add some randomness to create organic movement
                        force.add(createVector(random(-0.1, 0.1), random(-0.1, 0.1)));
                        
                        particle.applyForce(force);
                    }
                    
                    // Reduce damping to allow more oscillation
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
            // particle.attractToMouse();
        }
        
        particle.update();
        particle.display();
    }
    
    // Display cursor particle with enhanced glow and pulse effect
    // push();
    // blendMode(ADD);
    
    // // Apply fade-in effect to opacity
    // const opacity = fadeInProgress * 255;
    
    // // Calculate pulse-based sizes and opacities
    // let outerSize = lerp(15, 25, pulseValue);
    // let middleSize = lerp(10, 18, pulseValue);
    // let innerSize = lerp(5, 10, pulseValue);
    
    // let outerOpacity = lerp(30, 70, pulseValue);
    // let middleOpacity = lerp(50, 100, pulseValue);
    // let innerOpacity = lerp(80, 150, pulseValue);
    
    // // Draw outer glow for cursor
    // noStroke();
    // fill(255, 255, 255, outerOpacity * (opacity / 255));
    // circle(cursorParticle.pos.x, cursorParticle.pos.y, outerSize);
    
    // // Draw middle glow for cursor
    // fill(255, 255, 255, middleOpacity * (opacity / 255));
    // circle(cursorParticle.pos.x, cursorParticle.pos.y, middleSize);
    
    // // Draw inner glow for cursor
    // fill(255, 255, 255, innerOpacity * (opacity / 255));
    // circle(cursorParticle.pos.x, cursorParticle.pos.y, innerSize);
    
    // pop();
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
        circle(this.pos.x, this.pos.y, 8);
        
        // Draw inner glow
        fill(255, 255, 255, 80 * (opacity / 255));
        circle(this.pos.x, this.pos.y, 4);
        
        pop();
    }
}