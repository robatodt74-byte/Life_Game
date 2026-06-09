const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");

const toggleRunButton = document.querySelector("#toggleRun");
const stepButton = document.querySelector("#step");
const randomizeButton = document.querySelector("#randomize");
const clearButton = document.querySelector("#clear");
const speedInput = document.querySelector("#speed");
const densityInput = document.querySelector("#density");
const generationText = document.querySelector("#generation");
const aliveText = document.querySelector("#alive");

const columns = 96;
const rows = 64;
const cellSize = canvas.width / columns;

let cells = new Uint8Array(columns * rows);
let buffer = new Uint8Array(columns * rows);
let generation = 0;
let running = false;
let timerId = null;
let drawing = false;
let drawValue = 1;

function index(x, y) {
  return y * columns + x;
}

function countNeighbors(x, y) {
  let count = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;

      const nx = (x + dx + columns) % columns;
      const ny = (y + dy + rows) % rows;
      count += cells[index(nx, ny)];
    }
  }

  return count;
}

function stepSimulation() {
  let alive = 0;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const i = index(x, y);
      const neighbors = countNeighbors(x, y);
      const survives = cells[i] === 1 && (neighbors === 2 || neighbors === 3);
      const born = cells[i] === 0 && neighbors === 3;
      buffer[i] = survives || born ? 1 : 0;
      alive += buffer[i];
    }
  }

  [cells, buffer] = [buffer, cells];
  generation += 1;
  updateStats(alive);
  draw();
}

function draw() {
  ctx.fillStyle = "#090a0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#171a20";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= columns; x += 1) {
    const px = Math.round(x * cellSize) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
  }
  for (let y = 0; y <= rows; y += 1) {
    const py = Math.round(y * cellSize) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
  }
  ctx.stroke();

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (cells[index(x, y)] === 0) continue;

      const px = x * cellSize;
      const py = y * cellSize;
      const neighbors = countNeighbors(x, y);
      ctx.fillStyle = neighbors === 3 ? "#d6f26a" : "#48d597";
      ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
    }
  }
}

function updateStats(alive = countAlive()) {
  generationText.textContent = String(generation);
  aliveText.textContent = String(alive);
}

function countAlive() {
  let alive = 0;
  for (const cell of cells) alive += cell;
  return alive;
}

function randomize() {
  const threshold = Number(densityInput.value) / 100;
  for (let i = 0; i < cells.length; i += 1) {
    cells[i] = Math.random() < threshold ? 1 : 0;
  }
  generation = 0;
  updateStats();
  draw();
}

function clearBoard() {
  cells.fill(0);
  generation = 0;
  updateStats(0);
  draw();
}

function scheduleRun() {
  window.clearInterval(timerId);
  if (!running) return;

  const delay = Number(speedInput.max) + Number(speedInput.min) - Number(speedInput.value);
  timerId = window.setInterval(stepSimulation, delay);
}

function setRunning(nextRunning) {
  running = nextRunning;
  toggleRunButton.textContent = running ? "停止" : "再生";
  scheduleRun();
}

function pointerCell(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((event.clientX - rect.left) * scaleX / cellSize);
  const y = Math.floor((event.clientY - rect.top) * scaleY / cellSize);

  if (x < 0 || x >= columns || y < 0 || y >= rows) return null;
  return index(x, y);
}

function paintCell(event) {
  const i = pointerCell(event);
  if (i === null) return;

  cells[i] = drawValue;
  updateStats();
  draw();
}

toggleRunButton.addEventListener("click", () => setRunning(!running));
stepButton.addEventListener("click", stepSimulation);
randomizeButton.addEventListener("click", randomize);
clearButton.addEventListener("click", clearBoard);
speedInput.addEventListener("input", scheduleRun);

canvas.addEventListener("pointerdown", (event) => {
  const i = pointerCell(event);
  if (i === null) return;

  drawing = true;
  drawValue = cells[i] === 1 ? 0 : 1;
  canvas.setPointerCapture(event.pointerId);
  paintCell(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (drawing) paintCell(event);
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
});

canvas.addEventListener("pointercancel", () => {
  drawing = false;
});

randomize();
