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

function resizeCanvases() {
    wallCanvas.width = window.innerWidth;
    wallCanvas.height = window.innerHeight;
    sandstormCanvas.width = window.innerWidth;
    sandstormCanvas.height = window.innerHeight;
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

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

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * sandstormCanvas.width;
        this.y = Math.random() * sandstormCanvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 8 - 4;
        this.speedY = Math.random() * 8 - 4;
        this.opacity = Math.random() * 0.7 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > sandstormCanvas.width || this.y < 0 || this.y > sandstormCanvas.height) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(198, 163, 113, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

const particles = [];
for (let i = 0; i < 1500; i++) {
    particles.push(new Particle());
}

function animateSandstorm() {
    const ctx = sandstormCanvas.getContext('2d');
    ctx.clearRect(0, 0, sandstormCanvas.width, sandstormCanvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
    });

    requestAnimationFrame(animateSandstorm);
}

function animateWindowExpand() {
    if (!isWindowExpanding) return;
    
    windowScale += 0.004;
    drawWall();

    if (windowScale < 10) { 
        requestAnimationFrame(animateWindowExpand);
    } else {
        wallCanvas.style.visibility = 'hidden';
        sandstormCanvas.style.zIndex = "1"; 
    }
}

wallCanvas.addEventListener("click", () => {
    console.log("window got clicked");
    isWindowExpanding = true;
    animateWindowExpand();
    // wallCanvas.style.visibility = 'hidden';
    sandstormCanvas.style.visibility = 'visible';
    spawnMovingPopups();
});

let popups = [];

function spawnMovingPopups() {
    setInterval(() => {
        if (popups.length < 5) {
            createMovingPopup();
        }
    }, 1500);
}

function createMovingPopup() {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    let x = Math.random() * (screenWidth - 300);
    let y = Math.random() * (screenHeight - 200);

    let popup = window.open("ranobj.html", "", `width=200,height=150,left=${x},top=${y}`);
    if (!popup) return;

    let dx = Math.random() * 4 - 2;
    let dy = Math.random() * 4 - 2;

    let moveInterval = setInterval(() => {
        if (popup.closed) {
            clearInterval(moveInterval);
            popups = popups.filter(p => p !== popup);
            return;
        }

        x += dx * 10;
        y += dy * 10;

        if (x <= 0 || x >= screenWidth - 300) dx *= -1;
        if (y <= 0 || y >= screenHeight - 200) dy *= -1;

        popup.moveTo(x, y);
    }, 50);

    setTimeout(() => {
        if (!popup.closed) {
            popup.close();
        }
    }, 5000);

    popups.push(popup);
}


drawWall();
animateSandstorm();

eyeMask.addEventListener('animationend', () => {
    myRoom.style.visibility = 'visible';
    story.textContent = "The storm is approaching...";
    story.style.opacity = 1;

    setTimeout(() => {
        myRoom.style.visibility = 'hidden';
        story.style.opacity = 0;

        setTimeout(() => {
            wallCanvas.style.visibility = 'visible';
            sandstormCanvas.style.visibility = 'visible';
        }, 100);
    }, 3000);
});