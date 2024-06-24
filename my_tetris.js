const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = ['cyan', 'yellow', 'purple', 'green', 'red', 'blue', 'orange'];
const SHAPES = [
  [],
  [[1, 1, 1, 1]],        // I
  [[1, 1], [1, 1]],      // O
  [[0, 1, 0], [1, 1, 1]],// T
  [[0, 1, 1], [1, 1, 0]],// S
  [[1, 1, 0], [0, 1, 1]],// Z
  [[1, 0, 0], [1, 1, 1]],// J
  [[0, 0, 1], [1, 1, 1]] // L
];

// Game state
let canvas, ctx;
let board;
let currentPiece;
let nextPiece;
let score = 0;
let level = 1;
let requestId;
let isPaused = false;
const dropInterval = 1000; // Drop every 1 second
let dropCounter = 0;
let lastTime = 0;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('pause-button').addEventListener('click', togglePause);
  
  document.addEventListener('keydown', handleKeyPress);
  initBoard();
});

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function startGame() {
  if (requestId) {
    cancelAnimationFrame(requestId);
  }
  initBoard();
  score = 0;
  level = 1;
  isPaused = false;
  currentPiece = createPiece();
  nextPiece = createPiece();
  updateScore();
  updateLevel();
  lastTime = 0;
  dropCounter = 0;
  requestId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  isPaused = !isPaused;
  if (!isPaused) {
    requestId = requestAnimationFrame(gameLoop);
  }
}

function gameLoop(time = 0) {
  if (!isPaused) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
      dropPiece();
      dropCounter = 0;
    }
    
    update();
    draw();
    requestId = requestAnimationFrame(gameLoop);
  }
}

function createPiece() {
  const typeId = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  const shape = SHAPES[typeId];
  return {
    typeId,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0
  };
}

function handleKeyPress(event) {
  if (isPaused) return;
  switch (event.keyCode) {
    case 37: // left arrow
      movePiece(-1);
      break;
    case 39: // right arrow
      movePiece(1);
      break;
    case 40: // down arrow
      dropPiece();
      break;
    case 38: // up arrow
      rotatePiece();
      break;
  }
}

function movePiece(direction) {
  currentPiece.x += direction;
  if (collides()) {
    currentPiece.x -= direction;
  }
}

function dropPiece() {
  currentPiece.y++;
  if (collides()) {
    currentPiece.y--;
    lockPiece();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    if (collides()) {
      gameOver();
    }
  }
  dropCounter = 0;
}

function rotatePiece() {
  const prevShape = currentPiece.shape;
  currentPiece.shape = rotateMatrix(currentPiece.shape);
  if (collides()) {
    currentPiece.shape = prevShape;
  }
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function update() {
  // Update game state (e.g., move pieces down over time)
  if (!isPaused) {
    dropCounter++;
    if (dropCounter > dropInterval) {
      dropPiece();
      dropCounter = 0;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPiece(currentPiece);
}

function drawBoard() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        ctx.fillStyle = COLORS[board[y][x] - 1];
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
}

function drawPiece(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        ctx.fillStyle = COLORS[piece.typeId - 1];
        ctx.fillRect((piece.x + x) * BLOCK_SIZE, (piece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    });
  });
}

function collides() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (
        currentPiece.shape[y][x] &&
        (board[currentPiece.y + y] && board[currentPiece.y + y][currentPiece.x + x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function lockPiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[currentPiece.y + y][currentPiece.x + x] = currentPiece.typeId;
      }
    });
  });
  clearLines();
}

function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(value => value !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 10;
    updateScore();
    if (score >= level * 100) {
      level++;
      updateLevel();
    }
  }
}

function updateScore() {
  document.getElementById('score').textContent = `Score: ${score}`;
}

function updateLevel() {
  document.getElementById('level').textContent = `Level: ${level}`;
}

function gameOver() {
  cancelAnimationFrame(requestId);
  alert('Game Over');
}