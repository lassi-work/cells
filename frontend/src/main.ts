/**
 * [X, y]
 */
export type Coordinate = [number, number];

type TrainingData = {
  states: Coordinate[][];
  maxRewards: number;
};

type BestStatesData = {
  states: Coordinate[];
  rewards: number;
};

const fps = 10;
const gridSize = 10; // 10x10
const cellSize = 40;
let timer: number | null = null;
let running = false;

// two cells
let c1: Coordinate = [0, 0]; // top left
const c2: Coordinate = [gridSize - 1, gridSize - 1]; // bottom right

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = gridSize * cellSize;
canvas.height = gridSize * cellSize;

const maxRewardsSpan = document.getElementById(
  "stats-rewards"
) as HTMLSpanElement;
const currentRoundSpan = document.getElementById(
  "current-round"
) as HTMLSpanElement;
const allowDecayCheckbox = document.getElementById(
  "decayE"
) as HTMLInputElement;
const roundsInput = document.getElementById("rounds") as HTMLInputElement;
const trainingBlocker = document.getElementById(
  "training-blocker"
) as HTMLDivElement;
const withoutTrainingCheckbox = document.getElementById(
  "without-training"
) as HTMLInputElement;

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

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
  ctx.fillRect(c2[0] * cellSize, c2[1] * cellSize, cellSize, cellSize);

  // draw c1
  ctx.fillStyle = "red";
  ctx.fillRect(c1[0] * cellSize, c1[1] * cellSize, cellSize, cellSize);

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

const train = async (): Promise<TrainingData> => {
  trainingBlocker.style.display = "flex";

  const decayE = allowDecayCheckbox.checked;
  const rounds = parseInt(roundsInput.value) || 2000;
  const url = `${
    import.meta.env.VITE_BACKEND_URL
  }/train?decayE=${decayE}&rounds=${rounds}`;

  const res = await fetch(url);
  const json = await res.json();
  trainingBlocker.style.display = "none";
  return json;
};

const getBestStates = async (): Promise<BestStatesData> => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/best-states`);
  const json = (await res.json()) as BestStatesData;
  return json;
};

const start = async () => {
  running = true;
  let states: Coordinate[][] = [];
  let maxRewards = 0;

  if (withoutTrainingCheckbox.checked) {
    const data = await getBestStates();
    states = [data.states];
    maxRewards = data.rewards;
  } else {
    const data = await train();
    states = data.states;
    maxRewards = data.maxRewards;
  }

  maxRewardsSpan.innerText = maxRewards.toString();

  play(states);
};

const stop = () => {
  if (timer !== null) clearInterval(timer);
  running = false;
  draw();
  currentRoundSpan.innerText = "unknown";
};

const play = (states: Coordinate[][]) => {
  const skip = states.length === 1 ? 2 : Math.floor(states.length / 20);
  const ms = 1000 / fps;
  let i = 0;
  let j = 0;

  currentRoundSpan.innerText = (i + 1).toString();

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
      currentRoundSpan.innerText = (i + 1).toString();
    }
  }, ms);
};

document.getElementById("start-btn")!.onclick = start;
document.getElementById("stop-btn")!.onclick = stop;
document.getElementById("train-btn")!.onclick = train;
