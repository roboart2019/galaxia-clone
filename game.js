// Galaxia Clone - Space Shooter Game
// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let game = {
    running: false,
    score: 0,
    lives: 3,
    level: 1,
    width: canvas.width,
    height: canvas.height
};

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    speed: 5,
    canShoot: true,
    shootCooldown: 250,
    lastShot: 0,
    color: '#0ff'
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

// Input
const keys = {};

// Initialize starfield background
function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 0.5
        });
    }
}

// Draw starfield
function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Draw player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Ship body (triangle)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.height/2);
    ctx.lineTo(-player.width/2, player.height/2);
    ctx.lineTo(player.width/2, player.height/2);
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-10, player.height/2);
    ctx.lineTo(0, player.height/2 + 15);
    ctx.lineTo(10, player.height/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 5;
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 12);
    });
    ctx.shadowBlur = 0;
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        // Enemy ship (inverted triangle)
        ctx.fillStyle = enemy.color || '#f00';
        ctx.beginPath();
        ctx.moveTo(0, enemy.height/2);
        ctx.lineTo(-enemy.width/2, -enemy.height/2);
        ctx.lineTo(enemy.width/2, -enemy.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Inner detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-8, -10, 16, 8);
        
        ctx.restore();
    });
}

// Draw explosions (particles)
function drawParticles() {
    particles.forEach((p, index) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Shoot bullet
function shoot() {
    const now = Date.now();
    if (now - player.lastShot > player.shootCooldown) {
        bullets.push({
            x: player.x,
            y: player.y - player.height/2,
            width: 4,
            height: 12,
            speed: 10
        });
        player.lastShot = now;
    }
}

// Spawn enemy
function spawnEnemy() {
    const size = 30;
    enemies.push({
        x: Math.random() * (canvas.width - size * 2) + size,
        y: -size,
        width: size,
        height: size,
        speed: 1 + game.level * 0.2,
        color: `hsl(${Math.random() * 60}, 100%, 50%)` // Red to yellow hues
    });
}

// Create explosion
function createExplosion(x, y, color = '#f80', count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color: color,
            life: 1
        });
    }
}

// Check collisions
function checkCollisions() {
    // Bullets vs Enemies
    bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (bullet.x > enemy.x - enemy.width/2 &&
                bullet.x < enemy.x + enemy.width/2 &&
                bullet.y > enemy.y - enemy.height/2 &&
                bullet.y < enemy.y + enemy.height/2) {
                
                // Hit!
                createExplosion(enemy.x, enemy.y, enemy.color, 12);
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                game.score += 100;
                updateUI();
            }
        });
    });
    
    // Enemies vs Player
    enemies.forEach((enemy, ei) => {
        if (Math.abs(enemy.x - player.x) < (enemy.width/2 + player.width/2) &&
            Math.abs(enemy.y - player.y) < (enemy.height/2 + player.height/2)) {
            
            createExplosion(enemy.x, enemy.y, '#f00', 20);
            enemies.splice(ei, 1);
            game.lives--;
            updateUI();
            
            if (game.lives <= 0) {
                gameOver();
            }
        }
    });
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = `Score: ${game.score}`;
    document.getElementById('lives').textContent = `Lives: ${game.lives}`;
}

// Game loop
function gameLoop() {
    if (!game.running) return;
    
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();
    
    // Move and draw bullets
    bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        if (bullet.y < -bullet.height) bullets.splice(i, 1);
    });
    
    // Move and draw enemies
    enemies.forEach((enemy, i) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height + enemy.height) {
            enemies.splice(i, 1);
            game.lives--;
            updateUI();
            if (game.lives <= 0) gameOver();
        }
    });
    
    // Player input
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x = Math.max(player.width/2, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x = Math.min(canvas.width - player.width/2, player.x + player.speed);
    }
    if (keys[' '] && game.running) {
        shoot();
    }
    
    // Collisions
    checkCollisions();
    
    // Draw everything
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawParticles();
    
    // Spawn enemies
    if (Math.random() < 0.02 + game.level * 0.005) {
        spawnEnemy();
    }
    
    // Level up every 1000 points
    game.level = Math.floor(game.score / 1000) + 1;
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    game.running = true;
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    bullets = [];
    enemies = [];
    particles = [];
    player.x = canvas.width / 2;
    
    initStars();
    updateUI();
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    
    gameLoop();
}

// Game over
function gameOver() {
    game.running = false;
    document.getElementById('final-score').textContent = `Final Score: ${game.score}`;
    document.getElementById('game-over-screen').style.display = 'flex';
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Initial draw
initStars();
function initialRender() {
    if (game.running) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    requestAnimationFrame(initialRender);
}
initialRender();
