// Space Invaders Game Module
// Modular game logic with exposed API for integration with site

const SpaceInvadersGame = (function() {
  'use strict';

  // Game state
  let canvas, ctx, scoreEl, messageEl;
  let WIDTH, HEIGHT;
  let gameOver = false;
  let gamePaused = false;
  let score = 0;
  let animationId = null;
  
  // Player ship
  const player = {
    width: 48,
    height: 12,
    x: 0,
    y: 0,
    speed: 5,
    color: '#61dafb',
    alive: true
  };

  // Bullets
  const playerBullets = [];
  const enemyBullets = [];

  // Enemy grid
  const enemies = [];
  const ENEMY_ROWS = 4;
  const ENEMY_COLS = 8;
  const ENEMY_WIDTH = 36;
  const ENEMY_HEIGHT = 18;
  const ENEMY_H_GAP = 18;
  const ENEMY_V_GAP = 20;
  
  let enemyGroup = {
    x: 60,
    y: 60,
    vx: 1.2,
    vy: 0,
    direction: 1
  };

  let lastEnemyShotTime = 0;
  let enemyShotInterval = 1000;

  // Input handling
  const input = {
    left: false,
    right: false,
    shoot: false
  };

  // Audio context (lazy initialization)
  let audioCtx = null;
  let audioMuted = false;

  // --- Audio Functions ---
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function ensureAudio() {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function playTone(freq, duration = 0.1, type = 'sine', gain = 0.06) {
    if (audioMuted) return;
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.stop(ctx.currentTime + duration + 0.02);
  }

  function playPlayerLaser() {
    ensureAudio();
    playTone(1200, 0.06, 'sawtooth', 0.06);
  }

  function playEnemyLaser() {
    ensureAudio();
    playTone(600, 0.12, 'square', 0.06);
  }

  function playWinSound() {
    ensureAudio();
    playTone(800, 0.12, 'sine', 0.06);
    setTimeout(() => playTone(1000, 0.12, 'sine', 0.06), 140);
    setTimeout(() => playTone(1200, 0.2, 'sine', 0.08), 300);
  }

  function playLoseSound() {
    ensureAudio();
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, ctx.currentTime);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.stop(ctx.currentTime + 0.55);
  }

  // --- Game Initialization ---
  function createEnemies() {
    enemies.length = 0;
    for (let r = 0; r < ENEMY_ROWS; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        enemies.push({
          row: r,
          col: c,
          x: c * (ENEMY_WIDTH + ENEMY_H_GAP),
          y: r * (ENEMY_HEIGHT + ENEMY_V_GAP),
          alive: true
        });
      }
    }
  }

  function resetGame() {
    // Reset player
    player.x = WIDTH / 2 - 24;
    player.y = HEIGHT - 40;
    player.alive = true;

    // Clear bullets
    playerBullets.length = 0;
    enemyBullets.length = 0;

    // Reset enemies
    createEnemies();
    enemyGroup = {
      x: 60,
      y: 60,
      vx: 1.2,
      vy: 0,
      direction: 1
    };

    // Reset game state
    score = 0;
    gameOver = false;
    gamePaused = false;
    lastEnemyShotTime = 0;

    if (scoreEl) scoreEl.textContent = 'Score: 0';
    if (messageEl) messageEl.textContent = 'Destroy all the invaders!';

    // Restart animation loop
    if (animationId) cancelAnimationFrame(animationId);
    lastTime = performance.now();
    loop(lastTime);
  }

  // --- Collision Detection ---
  function rectsIntersect(a, b) {
    return a.x < b.x + b.width && 
           a.x + a.width > b.x && 
           a.y < b.y + b.height && 
           a.y + a.height > b.y;
  }

  // --- Game Actions ---
  function playerShoot() {
    if (!player.alive || gameOver || gamePaused) return;
    const now = Date.now();
    if (playerBullets.length > 0) {
      const last = playerBullets[playerBullets.length - 1];
      if (now - last.time < 200) return;
    }
    playerBullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y - 8,
      width: 4,
      height: 8,
      speed: 7,
      time: now
    });
    try { playPlayerLaser(); } catch (e) { }
  }

  function enemyShoot() {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) return;
    const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const sx = enemyGroup.x + shooter.x + ENEMY_WIDTH / 2;
    const sy = enemyGroup.y + shooter.y + ENEMY_HEIGHT;
    enemyBullets.push({
      x: sx - 3,
      y: sy,
      width: 6,
      height: 10,
      speed: 3
    });
    try { playEnemyLaser(); } catch (e) { }
  }

  // --- Game Loop ---
  function update(delta) {
    if (gameOver || gamePaused) return;

    // Player movement
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));

    // Player shooting
    if (input.shoot) {
      playerShoot();
      input.shoot = false;
    }

    // Update bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const b = playerBullets[i];
      b.y -= b.speed;
      if (b.y + b.height < 0) playerBullets.splice(i, 1);
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      b.y += b.speed;
      if (b.y > HEIGHT) enemyBullets.splice(i, 1);
    }

    // Update enemies
    enemyGroup.x += enemyGroup.vx * enemyGroup.direction;

    const aliveEnemies = enemies.filter(e => e.alive);
    let leftEdge = enemyGroup.x + Math.min(...aliveEnemies.map(e => e.x));
    let rightEdge = enemyGroup.x + Math.max(...aliveEnemies.map(e => e.x + ENEMY_WIDTH));

    if (rightEdge >= WIDTH - 10 && enemyGroup.direction === 1) {
      enemyGroup.direction = -1;
      enemyGroup.y += 18;
    } else if (leftEdge <= 10 && enemyGroup.direction === -1) {
      enemyGroup.direction = 1;
      enemyGroup.y += 18;
    }

    // Enemy shooting
    if (Date.now() - lastEnemyShotTime > enemyShotInterval) {
      enemyShoot();
      lastEnemyShotTime = Date.now();
    }

    // Collisions: player bullets with enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const b = playerBullets[i];
      const hit = enemies.find(e => e.alive && rectsIntersect(
        { x: b.x, y: b.y, width: b.width, height: b.height },
        { x: enemyGroup.x + e.x, y: enemyGroup.y + e.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT }
      ));
      if (hit) {
        hit.alive = false;
        playerBullets.splice(i, 1);
        score += 10;
        if (scoreEl) scoreEl.textContent = 'Score: ' + score;
        enemyGroup.vx *= 1.02;
      }
    }

    // Collisions: enemy bullets with player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      if (rectsIntersect(
        { x: b.x, y: b.y, width: b.width, height: b.height },
        { x: player.x, y: player.y, width: player.width, height: player.height }
      )) {
        enemyBullets.splice(i, 1);
        player.alive = false;
        endGame('Game Over! You were hit.');
      }
    }

    // Check if enemies reached bottom
    const lowestEnemyY = Math.max(...aliveEnemies.map(e => enemyGroup.y + e.y), -Infinity);
    if (lowestEnemyY + ENEMY_HEIGHT >= player.y) {
      endGame('Game Over! Enemies reached you.');
    }

    // Win condition
    if (enemies.every(e => !e.alive)) {
      endGame('You Win! All enemies destroyed.', true);
    }
  }

  function endGame(message, isWin = false) {
    gameOver = true;
    
    // Play sound
    try {
      isWin ? playWinSound() : playLoseSound();
    } catch (e) { }

    // Update high score if available
    if (typeof StorageManager !== 'undefined') {
      const isNewHigh = StorageManager.updateHighScore(score);
      if (isNewHigh) {
        message += ' 🏆 NEW HIGH SCORE!';
      }
    }

    if (messageEl) {
      messageEl.innerHTML = message;
    }

    // Dispatch custom event for UI to handle
    const event = new CustomEvent('gameEnd', {
      detail: { score, isWin, message }
    });
    window.dispatchEvent(event);
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw player
    if (player.alive) {
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(player.x + player.width / 2 - 6, player.y - 6, 12, 6);
    }

    // Draw player bullets
    ctx.fillStyle = '#fffc6b';
    for (const b of playerBullets) ctx.fillRect(b.x, b.y, b.width, b.height);

    // Draw enemies
    for (const e of enemies) {
      if (!e.alive) continue;
      const ex = enemyGroup.x + e.x;
      const ey = enemyGroup.y + e.y;
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(ex, ey, ENEMY_WIDTH, ENEMY_HEIGHT);
      ctx.fillStyle = '#000';
      ctx.fillRect(ex + 6, ey + 4, 6, 6);
      ctx.fillRect(ex + ENEMY_WIDTH - 12, ey + 4, 6, 6);
    }

    // Draw enemy bullets
    ctx.fillStyle = '#ff8c42';
    for (const b of enemyBullets) ctx.fillRect(b.x, b.y, b.width, b.height);

    // Draw pause overlay
    if (gamePaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#61dafb';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
    }
  }

  // Animation loop
  let lastTime = performance.now();
  function loop(now) {
    const delta = now - lastTime;
    update(delta);
    draw();
    lastTime = now;
    animationId = requestAnimationFrame(loop);
  }

  // --- Input Handlers ---
  function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        input.shoot = true;
      }
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if (e.key === 'p' || e.key === 'P') togglePause();
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
      if (e.code === 'Space') input.shoot = false;
    });

    canvas.addEventListener('click', () => canvas.focus());

    // --- Touch Controls ---
    let touchStartX = null;
    let touchStartY = null;
    let isTouching = false;
    let lastTouchShootTime = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameOver || gamePaused) return;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchStartX = touch.clientX - rect.left;
      touchStartY = touch.clientY - rect.top;
      isTouching = true;

      // Shoot on touch start (tap to shoot)
      const now = Date.now();
      if (now - lastTouchShootTime > 250) { // Prevent too rapid firing
        input.shoot = true;
        lastTouchShootTime = now;
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (gameOver || gamePaused || !isTouching) return;

      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      // Calculate horizontal drag distance
      if (touchStartX !== null) {
        const deltaX = touchX - touchStartX;
        
        // Move player based on drag direction and distance
        // Scale the movement for smooth control
        const movementSpeed = 0.8;
        player.x += deltaX * movementSpeed;
        
        // Clamp player position
        player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));
        
        // Update touch start position for continuous movement
        touchStartX = touchX;
        touchStartY = touchY;
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      isTouching = false;
      touchStartX = null;
      touchStartY = null;
      input.left = false;
      input.right = false;
    });

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      isTouching = false;
      touchStartX = null;
      touchStartY = null;
      input.left = false;
      input.right = false;
    });
  }

  // --- Public API ---
  function init(canvasId, scoreElementId, messageElementId) {
    canvas = document.getElementById(canvasId);
    scoreEl = document.getElementById(scoreElementId);
    messageEl = document.getElementById(messageElementId);

    if (!canvas) {
      console.error('Canvas element not found');
      return false;
    }

    ctx = canvas.getContext('2d');
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    // Initialize player position
    player.x = WIDTH / 2 - 24;
    player.y = HEIGHT - 40;

    createEnemies();
    setupInputHandlers();
    
    lastTime = performance.now();
    loop(lastTime);

    return true;
  }

  function togglePause() {
    if (gameOver) return;
    gamePaused = !gamePaused;
    
    const event = new CustomEvent('gamePause', {
      detail: { paused: gamePaused }
    });
    window.dispatchEvent(event);
  }

  function toggleMute() {
    audioMuted = !audioMuted;
    if (audioMuted) {
      if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    } else {
      ensureAudio();
    }

    const event = new CustomEvent('gameMute', {
      detail: { muted: audioMuted }
    });
    window.dispatchEvent(event);
  }

  function getScore() {
    return score;
  }

  function isGameOver() {
    return gameOver;
  }

  function isPaused() {
    return gamePaused;
  }

  function isMuted() {
    return audioMuted;
  }

  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  // Return public API
  return {
    init,
    reset: resetGame,
    togglePause,
    toggleMute,
    getScore,
    isGameOver,
    isPaused,
    isMuted,
    destroy
  };
})();
