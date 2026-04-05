const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameOverSound = new Audio("gameover.mp3");
let gameOverPlayed = false;

let levelCompleteSound = new Audio("dumdum.mp3");
let levelSoundPlayed = false;

let finalWinSound = new Audio("win.mp3");
let finalWinPlayed = false;

let fireworkInterval = null;
let fireworksRunning = false;

// Game variables
let ballRadius = 10;
let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 1.5, dy: -1.5 }];
let paddleHeight = 10;
let paddleWidth = 100;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let gameOver = false;
let levelCompleted = false;
let level = 1;
const maxLevel = 1; // Set this to your desired final level
let speedIncreaseInterval = 3; 

// Ball count and lives
let ballCount = 1;
let lives = 5;

// Brick variables
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;
let bricks = [];

// Power-up variables
let powerUps = [];
const powerUpWidth = 20;
const powerUpHeight = 20;
const powerUpSpeed = 2;
const powerUpTypes = {
    FLAME: 'flame',
    SPLIT: 'split'
};
let powerUpEffects = {
    [powerUpTypes.FLAME]: { active: false, startTime: 0 },
    [powerUpTypes.SPLIT]: { active: false }
};

function createPowerUp(x, y, type) {
    return {
        x,
        y,
        dx: Math.random() * 2 - 1,
        dy: powerUpSpeed,
        type
    };
}

function setupBricks() {
    const numberOfBricks = level * 5;
    const rows = Math.ceil(numberOfBricks / 5);
    const columns = Math.min(numberOfBricks, 5);

    bricks = [];
    for (let c = 0; c < columns; c++) {
        bricks[c] = [];
        for (let r = 0; r < rows; r++) {
            if (r * columns + c < numberOfBricks) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }
    }
}

setupBricks();

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === 'r' || e.key === 'R') {
        if (gameOver || levelCompleted) {
            restartGame();
        }
    } else if (e.key === ' ' && levelCompleted) {
        if (level < maxLevel) {
            levelSoundPlayed = false;
            levelCompleteSound.pause();
            levelCompleteSound.currentTime = 0;
            document.getElementById("levelCompleteGif").style.display = "none";

            level++;
            // Slightly increase base speed for next level
            let newSpeed = 1.5 + (level * 0.2);
            balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: newSpeed, dy: -newSpeed }];
            setupBricks();
            levelCompleted = false;
            draw();
        }
    } else if (e.key === 'q' || e.key === 'Q') {
        if (levelCompleted) {
            document.location.reload();
        }
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = 'skyblue';
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            if (bricks[c][r] && bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === powerUpTypes.FLAME ? (Date.now() % 500 < 250 ? 'red' : 'pink') : 'orange';
        ctx.beginPath();
        ctx.rect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
        ctx.fill();
        ctx.closePath();
    });
}

function drawLives() {
    ctx.font = '16px Arial';
    ctx.fillStyle = 'orange';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + lives, 8, 20);
}

function drawLevel() {
    ctx.font = '16px Arial';
    ctx.fillStyle = 'yellow';
    ctx.textAlign = 'right';
    ctx.fillText('Level: ' + level, canvas.width - 8, 20);
}

function collisionDetection() {
    let activeBricks = 0;
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                activeBricks++;
                balls.forEach(ball => {
                    if (ball.x > brick.x && ball.x < brick.x + brickWidth && ball.y > brick.y && ball.y < brick.y + brickHeight) {
                        if (!powerUpEffects[powerUpTypes.FLAME].active) {
                            ball.dy = -ball.dy;
                        }
                        brick.status = 0;
                        if (Math.random() < 0.2) {
                            const type = Math.random() < 0.5 ? powerUpTypes.FLAME : powerUpTypes.SPLIT;
                            powerUps.push(createPowerUp(brick.x, brick.y, type));
                        }
                    }
                });
            }
        }
    }
    if (activeBricks === 0) {
        levelCompleted = true;
    }

    powerUps = powerUps.filter(powerUp => {
        powerUp.x += powerUp.dx;
        powerUp.y += powerUp.dy;
        if (powerUp.y > canvas.height) return false;
        if (powerUp.x > paddleX && powerUp.x < paddleX + paddleWidth && powerUp.y > canvas.height - paddleHeight) {
            if (powerUp.type === powerUpTypes.FLAME) {
                powerUpEffects[powerUpTypes.FLAME].active = true;
                powerUpEffects[powerUpTypes.FLAME].startTime = Date.now();
            } else if (powerUp.type === powerUpTypes.SPLIT) {
                ballCount++;
                balls.push({ x: paddleX + paddleWidth / 2, y: canvas.height - 35, dx: -2, dy: -2 });
            }
            return false;
        }
        return true;
    });

    if (powerUpEffects[powerUpTypes.FLAME].active && Date.now() - powerUpEffects[powerUpTypes.FLAME].startTime > 2000) {
        powerUpEffects[powerUpTypes.FLAME].active = false;
    }
}

function restartGame() {
    level = 1;
    lives = 5;
    ballCount = 1;
    balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 1.5, dy: -1.5 }];
    paddleX = (canvas.width - paddleWidth) / 2;
    gameOver = false;
    levelCompleted = false;
    powerUps = [];
    gameOverPlayed = false;
    levelSoundPlayed = false;
    finalWinPlayed = false;
    fireworksRunning = false;
    clearInterval(fireworkInterval);
    
    // Hide UI elements
    document.getElementById("gameOverGif").style.display = "none";
    document.getElementById("levelCompleteGif").style.display = "none";
    document.getElementById("finalWinGif").style.display = "none";
    document.getElementById("finalText").style.display = "none";
    document.getElementById("fireworksCanvas").style.display = "none";
    
    // Reset and Hide Video
    const videoCont = document.getElementById("videoContainer");
    const v = document.getElementById("winVideo");
    if (videoCont) {
        videoCont.style.display = "none";
        v.pause();
        v.currentTime = 0;
    }

    // Audio Resets
    gameOverSound.pause();
    gameOverSound.currentTime = 0;
    levelCompleteSound.pause();
    levelCompleteSound.currentTime = 0;
    finalWinSound.pause();
    finalWinSound.currentTime = 0;

    setupBricks();
    draw();
}

function draw() {
    // 1. CLEAR CANVAS AT THE START OF EVERY FRAME
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. CHECK FOR LEVEL COMPLETE / FINAL WIN
    if (levelCompleted) {
        if (level === maxLevel) {
            // --- FINAL WIN STATE (SUPERMAN VIDEO) ---
            const videoCont = document.getElementById("videoContainer");
            const v = document.getElementById("winVideo");

            if (videoCont.style.display !== "block") {
                videoCont.style.display = "block";

                v.muted = true;
                v.currentTime = 0;

                v.play().catch(e => console.log("Video blocked:", e));
            }

            document.getElementById("finalText").style.display = "block";
            document.getElementById("fireworksCanvas").style.display = "block";
            document.getElementById("finalWinGif").style.display = "block";

            if (!fireworksRunning) {
                fireworksRunning = true;
                fireworkInterval = setInterval(createFirework, 500);
                updateFireworks();
            }

            if (!finalWinPlayed) {
                finalWinSound.play();
                finalWinPlayed = true;
            }
        } else {
            // --- NORMAL LEVEL TRANSITION ---
            ctx.font = '18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`Level ${level} Completed! Press SPACE to continue`, canvas.width / 2, canvas.height / 2 - 40);
            document.getElementById("levelCompleteGif").style.display = "block";
            
            if (!levelSoundPlayed) {
                levelCompleteSound.play();
                levelSoundPlayed = true;
            }
        }
        // Stop the ball/paddle logic while win screens are active
        return; 
    }

    // 3. CHECK FOR GAME OVER (LOSS)
    if (gameOver) {
        ctx.font = '18px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over. Press R to Restart', canvas.width / 2, canvas.height / 2);
        document.getElementById("gameOverGif").style.display = "block";
        
        if (!gameOverPlayed) {
            gameOverSound.play();
            gameOverPlayed = true;
        }
        return;
    }

    // 4. NORMAL GAMEPLAY LOGIC
    drawBricks();
    balls.forEach(drawBall);
    drawPaddle();
    drawPowerUps();
    drawLives();
    drawLevel();
    collisionDetection();

    balls.forEach(ball => {
        // Wall Bounce
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - ballRadius) {
            // Paddle Hit
            if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                let hitPosition = (ball.x - paddleX) / paddleWidth;
                let angle = (hitPosition - 0.5) * 2 * Math.PI / 3;
                let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.cos(angle) * speed;
            } else {
                // Ball Lost
                if (balls.length > 1) {
                    balls.splice(balls.indexOf(ball), 1);
                } else {
                    lives--;
                    if (lives > 0) {
                        ball.x = canvas.width / 2;
                        ball.y = canvas.height - 30;
                        ball.dx = 1.5;
                        ball.dy = -1.5;
                        paddleX = (canvas.width - paddleWidth) / 2;
                    } else {
                        gameOver = true;
                    }
                }
            }
        }
        ball.x += ball.dx;
        ball.y += ball.dy;
    });

    // Paddle Movement
    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
    if (leftPressed && paddleX > 0) paddleX -= 7;

    requestAnimationFrame(draw);
}

draw();

// FIREWORKS
const fwCanvas = document.getElementById("fireworksCanvas");
const fwCtx = fwCanvas.getContext("2d");
fwCanvas.width = canvas.width;
fwCanvas.height = canvas.height;
let particles = [];

function createFirework() {
    let x = Math.random() * fwCanvas.width;
    let y = Math.random() * fwCanvas.height / 2;
    for (let i = 0; i < 30; i++) {
        particles.push({ x, y, dx: (Math.random() - 0.5) * 5, dy: (Math.random() - 0.5) * 5, life: 80 });
    }
}

function updateFireworks() {
    if (!fireworksRunning) return;
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    particles.forEach((p, i) => {
        p.x += p.dx; p.y += p.dy; p.life--;
        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        fwCtx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.7)`;
        fwCtx.fill();
        if (p.life <= 0) particles.splice(i, 1);
    });
    requestAnimationFrame(updateFireworks);
}