type Data = {
  states: number[][];
  maxRewards: number;
};

const fps = 10;
const gridSize = 10; // 10x10
const cellSize = 40;
const boxesCount = gridSize * gridSize;
let timer: number | null = null;
let running = false;

// two cells
let c1 = 1; // top left
const c2 = boxesCount; // bottom right

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = gridSize * cellSize;
canvas.height = gridSize * cellSize;

const maxRewardsSpan = document.getElementById(
  "stats-rewards"
) as HTMLSpanElement;

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const getCoordinates = (s: number) => {
  s--;
  return [(s % gridSize) * cellSize, Math.floor(s / gridSize) * cellSize];
};

const draw = () => {
  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw grid
  ctx.beginPath();
  for (let i = 0; i <= gridSize; i++) {
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, gridSize * cellSize);
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(gridSize * cellSize, i * cellSize);
  }
  ctx.strokeStyle = "#ccc";
  ctx.stroke();
  ctx.closePath();

  // draw c2
  ctx.fillStyle = "green";
  const coord2 = getCoordinates(c2);
  ctx.fillRect(coord2[0], coord2[1], cellSize, cellSize);

  // draw c1
  ctx.fillStyle = "red";
  const coord1 = getCoordinates(c1);
  ctx.fillRect(coord1[0], coord1[1], cellSize, cellSize);

  // draw status
  if (!running) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("STOPPED", canvas.width / 2, canvas.height / 2);
  }
};

draw();

const start = async () => {
  running = true;
  const url = import.meta.env.VITE_BACKEND_URL + "/train";

  const res = await fetch(url);
  const { states, maxRewards } = (await res.json()) as Data;

  maxRewardsSpan.innerText = maxRewards.toString();

  const skip = states.length / 20;
  const ms = 1000 / fps;
  let i = 0;
  let j = 0;
  timer = setInterval(() => {
    if (i >= states.length && timer !== null) {
      stop();
      return;
    }

    c1 = states[i][j++];
    draw();

    if (j === states[i].length) {
      j = 0;
      if (i === 0) i = -1; // first & last iterations must always run
      i += skip;
    }
  }, ms);
};

const stop = () => {
  if (timer !== null) clearInterval(timer);
  running = false;
  draw();
};

document.getElementById("start-btn")!.onclick = start;
document.getElementById("stop-btn")!.onclick = stop;
window.onload = start;
