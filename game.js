// Galaxia Clone - Space Shooter Game (Enhanced Graphics)
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
    width: 50,
    height: 60,
    speed: 6,
    canShoot: true,
    shootCooldown: 200,
    lastShot: 0,
    invincible: false
};

// Arrays
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let enemyBullets = [];

// Input
const keys = {};

// Initialize starfield background
function initStars() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5,
            speed: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.8 + 0.2
        });
    }
}

// Draw starfield with twinkling
function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.y += star.speed;
        star.alpha = 0.5 + Math.sin(Date.now() * 0.003 + star.x) * 0.4;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Draw player with glow and detail
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Glow
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    
    // Main body
    ctx.fillStyle = player.invincible ? '#ff0' : '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -player.height/2);
    ctx.lineTo(-player.width/2, player.height/2);
    ctx.lineTo(player.width/2, player.height/2);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, -5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing details
    ctx.strokeStyle = '#0099cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-player.width/2 + 5, player.height/2 - 10);
    ctx.lineTo(-player.width/2 + 15, player.height/2);
    ctx.moveTo(player.width/2 - 5, player.height/2 - 10);
    ctx.lineTo(player.width/2 - 15, player.height/2);
    ctx.stroke();
    
    // Engine glow
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(-12, player.height/2);
    ctx.lineTo(0, player.height/2 + 20 + Math.random() * 10);
    ctx.lineTo(12, player.height/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Draw bullets with trail
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 14);
        ctx.restore();
    });
}

// Draw enemy bullets
function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.save();
        ctx.fillStyle = '#ff0066';
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 6;
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 10);
        ctx.restore();
    });
}

// Draw enemies with more detail
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        // Glow
        ctx.shadowColor = enemy.color || '#ff3399';
        ctx.shadowBlur = 15;
        
        // Body (hexagonal shape)
        ctx.fillStyle = enemy.color || '#ff0066';
        ctx.strokeStyle = '#ff66cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI/2;
            const x = Math.cos(angle) * enemy.size;
            const y = Math.sin(angle) * enemy.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

// Draw explosions with multiple particle types
function drawParticles() {
    particles.forEach((p, index) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        
        // Color and glow
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = p.life;
        
        if (p.type === 'spark') {
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        } else if (p.type === 'orb') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        }
        
        ctx.restore();
        
        // Update
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015 + p.decay;
        p.size *= 0.97;
        
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
            speed: 12
        });
        // Muzzle flash particle
        createExplosion(player.x, player.y - player.height/2, '#00ff00', 3, 'spark');
        player.lastShot = now;
    }
}

// Spawn enemy with variation
function spawnEnemy() {
    const size = 30 + Math.min(game.level * 2, 20);
    const colors = ['#ff0066', '#ff3366', '#ff6666', '#ff99cc', '#cc66ff'];
    enemies.push({
        x: Math.random() * (canvas.width - size * 2) + size,
        y: -size,
        width: size,
        height: size,
        speed: 0.8 + game.level * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: size,
        shootTimer: 0,
        shootInterval: 2000 - Math.min(game.level * 100, 1500)
    });
}

// Enemy shooting (new!)
function enemyShoot(enemy) {
    enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.height/2,
        width: 4,
        height: 10,
        speed: 4,
        vx: (Math.random() - 0.5) * 2
    });
}

// Create explosion with multiple particle types
function createExplosion(x, y, color = '#ff8c00', count = 20, type = 'orb') {
    for (let i = 0; i < count; i++) {
        const speed = Math.random() * 4 + 1;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 6 + 2,
            color: color,
            life: 1,
            decay: Math.random() * 0.01 + 0.005,
            type: type
        });
    }
    // Add smaller sparks
    for (let i = 0; i < 10; i++) {
        const speed = Math.random() * 6 + 2;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 3 + 1,
            color: '#ffffff',
            life: 0.8,
            decay: 0.02,
            type: 'spark'
        });
    }
}

// Check collisions
function checkCollisions() {
    // Player bullets vs Enemies
    bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (bullet.x > enemy.x - enemy.width/2 &&
                bullet.x < enemy.x + enemy.width/2 &&
                bullet.y > enemy.y - enemy.height/2 &&
                bullet.y < enemy.y + enemy.height/2) {
                
                createExplosion(enemy.x, enemy.y, enemy.color, 25);
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                game.score += 100;
                updateUI();
            }
        });
    });
    
    // Enemy bullets vs Player
    enemyBullets.forEach((bullet, bi) => {
        if (Math.abs(bullet.x - player.x) < (player.width/2) &&
            Math.abs(bullet.y - player.y) < (player.height/2)) {
            enemyBullets.splice(bi, 1);
            if (!player.invincible) {
                createExplosion(player.x, player.y, '#ff0000', 30);
                game.lives--;
                updateUI();
                if (game.lives <= 0) gameOver();
                else {
                    player.invincible = true;
                    setTimeout(() => player.invincible = false, 2000);
                }
            }
        }
    });
    
    // Enemies vs Player
    enemies.forEach((enemy, ei) => {
        if (Math.abs(enemy.x - player.x) < (enemy.width/2 + player.width/2) &&
            Math.abs(enemy.y - player.y) < (enemy.height/2 + player.height/2)) {
            
            createExplosion(enemy.x, enemy.y, enemy.color, 25);
            enemies.splice(ei, 1);
            if (!player.invincible) {
                createExplosion(player.x, player.y, '#ff0000', 30);
                game.lives--;
                updateUI();
                if (game.lives <= 0) gameOver();
                else {
                    player.invincible = true;
                    setTimeout(() => player.invincible = false, 2000);
                }
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
    
    // Clear with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();
    
    // Move and draw bullets
    bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        if (bullet.y < -bullet.height) bullets.splice(i, 1);
    });
    
    // Move and draw enemy bullets
    enemyBullets.forEach((bullet, i) => {
        bullet.y += bullet.speed;
        bullet.x += bullet.vx;
        if (bullet.y > canvas.height + bullet.height) enemyBullets.splice(i, 1);
    });
    
    // Move and draw enemies
    enemies.forEach((enemy, i) => {
        enemy.y += enemy.speed;
        
        // Enemy shooting (if level > 1)
        if (game.level > 1) {
            enemy.shootTimer += 16;
            if (enemy.shootTimer > enemy.shootInterval) {
                enemyShoot(enemy);
                enemy.shootTimer = 0;
            }
        }
        
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
    drawEnemyBullets();
    drawEnemies();
    drawParticles();
    
    // Spawn enemies
    if (Math.random() < 0.015 + game.level * 0.003) {
        spawnEnemy();
    }
    
    // Level up every 1000 points
    const newLevel = Math.floor(game.score / 1000) + 1;
    if (newLevel !== game.level) {
        game.level = newLevel;
        // Flash effect for level up
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
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
    enemyBullets = [];
    player.x = canvas.width / 2;
    player.invincible = false;
    
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
