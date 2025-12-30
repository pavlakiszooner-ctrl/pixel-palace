// Simple Space Invaders-style game using HTML5 Canvas
// Controls: Left/Right arrows or A/D to move, Space to shoot

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Player ship
const player = {
  width: 48,
  height: 12,
  x: WIDTH / 2 - 24,
  y: HEIGHT - 40,
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
  direction: 1 // 1 = moving right, -1 = left
};

let score = 0;
let gameOver = false;
let lastEnemyShotTime = 0;
let enemyShotInterval = 1000; // ms

// Input handling
const input = {
  left: false,
  right: false,
  shoot: false
};

// --- Audio / sound effects (Web Audio API) ---
// Small helper SFX functions that create sounds without external files.
// We create the AudioContext lazily to respect browser autoplay policies.
let audioCtx = null;
let audioMuted = false; // toggle to silence SFX
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function ensureAudio() {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
}
// Play a short tone using an oscillator
function playTone(freq, duration = 0.1, type = 'sine', gain = 0.06) {
  if (audioMuted) return; // early out when muted
  const ctx = getAudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  // smooth decay to avoid clicks
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  o.stop(ctx.currentTime + duration + 0.02);
}
// Specific SFX
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
  // short arpeggio
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

// toggle mute button and keyboard shortcut (M)
function toggleMute() {
  audioMuted = !audioMuted;
  const btn = document.getElementById('muteBtn');
  if (btn) {
    btn.textContent = audioMuted ? '🔇' : '🔊';
    btn.setAttribute('aria-pressed', audioMuted ? 'true' : 'false');
  }
  if (audioMuted) {
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
  } else {
    ensureAudio();
  }
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') toggleMute();
});
// ensure the button (if present) toggles mute
const _muteBtnInit = document.getElementById('muteBtn');
if (_muteBtnInit) _muteBtnInit.addEventListener('click', toggleMute);

// --- Initialization ---
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

createEnemies();

// --- Helpers ---
function rectsIntersect(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// --- Game actions ---
function playerShoot() {
  if (!player.alive || gameOver) return;
  // limit rate of fire
  const now = Date.now();
  if (playerBullets.length > 0) {
    const last = playerBullets[playerBullets.length - 1];
    if (now - last.time < 200) return; // 200 ms between shots
  }
  playerBullets.push({ x: player.x + player.width / 2 - 2, y: player.y - 8, width: 4, height: 8, speed: 7, time: now });
  // small laser SFX for player's shot
  try { playPlayerLaser(); } catch (e) { /* ignore if audio not allowed */ }
}

function enemyShoot() {
  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;
  const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  // calculate shooter absolute position
  const sx = enemyGroup.x + shooter.x + ENEMY_WIDTH / 2;
  const sy = enemyGroup.y + shooter.y + ENEMY_HEIGHT;
  enemyBullets.push({ x: sx - 3, y: sy, width: 6, height: 10, speed: 3 });
  // small laser SFX for enemy shot (may be silent if audio not enabled)
  try { playEnemyLaser(); } catch (e) { /* ignore */ }
}

// --- Game loop ---
function update(delta) {
  if (gameOver) return;

  // Player movement
  if (input.left) player.x -= player.speed;
  if (input.right) player.x += player.speed;
  // Clamp
  player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));

  // Player shooting
  if (input.shoot) {
    playerShoot();
    input.shoot = false; // simple single-shot per keypress
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

  // Update enemies group horizontal movement
  enemyGroup.x += enemyGroup.vx * enemyGroup.direction;

  // Check for group edges
  const leftMost = Math.min(...enemies.filter(e => e.alive).map(e => e.x), 0);
  const rightMost = Math.max(...enemies.filter(e => e.alive).map(e => e.x + ENEMY_WIDTH), WIDTH - enemyGroup.x);
  // compute actual left and right in canvas coordinates
  let leftEdge = enemyGroup.x + Math.min(...enemies.filter(e => e.alive).map(e => e.x));
  let rightEdge = enemyGroup.x + Math.max(...enemies.filter(e => e.alive).map(e => e.x + ENEMY_WIDTH));

  if (rightEdge >= WIDTH - 10 && enemyGroup.direction === 1) {
    enemyGroup.direction = -1;
    enemyGroup.y += 18; // descend
  } else if (leftEdge <= 10 && enemyGroup.direction === -1) {
    enemyGroup.direction = 1;
    enemyGroup.y += 18; // descend
  }

  // Enemy shooting periodically
  if (Date.now() - lastEnemyShotTime > enemyShotInterval) {
    enemyShoot();
    lastEnemyShotTime = Date.now();
  }

  // Collisions: player bullets with enemies
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i];
    const hit = enemies.find(e => e.alive && rectsIntersect({ x: b.x, y: b.y, width: b.width, height: b.height }, { x: enemyGroup.x + e.x, y: enemyGroup.y + e.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT }));
    if (hit) {
      hit.alive = false;
      playerBullets.splice(i, 1);
      score += 10;
      scoreEl.textContent = 'Score: ' + score;
      // speed up enemies slightly when one is killed
      enemyGroup.vx *= 1.02;
    }
  }

  // Collisions: enemy bullets with player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (rectsIntersect({ x: b.x, y: b.y, width: b.width, height: b.height }, { x: player.x, y: player.y, width: player.width, height: player.height })) {
      enemyBullets.splice(i, 1);
      player.alive = false;
      gameOver = true;
      // lose SFX
      try { playLoseSound(); } catch (e) { /* ignore */ }
      // show a button so player can start a new game (refresh)
      messageEl.innerHTML = 'Game Over! You were hit. <button id="newGameBtn" class="new-game-btn">New Game</button>';
      const newBtn = document.getElementById('newGameBtn');
      if (newBtn) newBtn.addEventListener('click', () => location.reload());
    }
  }

  // Check if any enemy reached bottom => game over
  const lowestEnemyY = Math.max(...enemies.filter(e => e.alive).map(e => enemyGroup.y + e.y), -Infinity);
  if (lowestEnemyY + ENEMY_HEIGHT >= player.y) {
    gameOver = true;
    // lose SFX
    try { playLoseSound(); } catch (e) { /* ignore */ }
    // show a new game button so player can restart
    messageEl.innerHTML = 'Game Over! Enemies reached you. <button id="newGameBtn" class="new-game-btn">New Game</button>';
    const newBtn = document.getElementById('newGameBtn');
    if (newBtn) newBtn.addEventListener('click', () => location.reload());
  }

  // Win condition
  if (enemies.every(e => !e.alive)) {
    gameOver = true;
    // win SFX
    try { playWinSound(); } catch (e) { /* ignore */ }
    // show a new game button on win as well
    messageEl.innerHTML = 'You Win! All enemies destroyed. <button id="newGameBtn" class="new-game-btn">New Game</button>';
    const newBtn = document.getElementById('newGameBtn');
    if (newBtn) newBtn.addEventListener('click', () => location.reload());
  }
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw player
  if (player.alive) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // a small cockpit
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
    // simple 'eyes' for a sprite-ish look
    ctx.fillStyle = '#000';
    ctx.fillRect(ex + 6, ey + 4, 6, 6);
    ctx.fillRect(ex + ENEMY_WIDTH - 12, ey + 4, 6, 6);
  }

  // Draw enemy bullets
  ctx.fillStyle = '#ff8c42';
  for (const b of enemyBullets) ctx.fillRect(b.x, b.y, b.width, b.height);
}

// Timing & Loop
let lastTime = performance.now();
function loop(now) {
  const delta = now - lastTime;
  update(delta);
  draw();
  lastTime = now;
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- Input listeners ---
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = true;
  if (e.code === 'Space') input.shoot = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
  if (e.code === 'Space') input.shoot = false;
});

// Focus canvas for keyboard events when clicked
canvas.addEventListener('click', () => canvas.focus());

// --- Touch Controls for Mobile ---
let touchStartX = null;
let touchStartY = null;
let isTouching = false;
let lastTouchShootTime = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameOver) return;
  
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
  if (gameOver || !isTouching) return;

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

// Ensure the game starts with a message
messageEl.textContent = 'Destroy all the invaders!';
