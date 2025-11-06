// 10x10
const gridSize = 10;
const cellSize = 40;
const boxesCount = gridSize * gridSize;

// two cells
let c1 = 1; // top left
const c2 = boxesCount; // bottom right

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = gridSize * cellSize;
canvas.height = gridSize * cellSize;

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
};

draw();

// actions are, move left, right, down or up (0, 1, 2, 3)
enum Action {
  Left,
  Right,
  Down,
  Up,
}
// input the current state, next state is the output
const actions: Record<Action, (s: number) => number> = {
  [Action.Left]: (s) => (s % gridSize !== 1 ? s - 1 : s),
  [Action.Right]: (s) => (s % gridSize > 0 ? s + 1 : s),
  [Action.Down]: (s) => (s < boxesCount - gridSize ? s + gridSize : s),
  [Action.Up]: (s) => (s > gridSize ? s - gridSize : s),
};
const actionsCount = 4;
// perform acion on the given state
const performAction = (a: Action, s: number) => actions[a](s);

// Q values of states and actions
const q: Record<number, number[]> = {};
for (let i = 1; i <= boxesCount; i++) {
  q[i] = [];
  for (let j = 0; j < actionsCount; j++) q[i][j] = Math.random();
}

// lets see how c1 goes to c2

// rewards: every box (state) has -1 except c2 box (last state) which has 20
const rewards: number[] = [];
for (let i = 1; i <= boxesCount; i++) rewards[i] = -1;
rewards[boxesCount] = 20;

const calculateQ = (s: number, a: Action) => {
  const currentQ = q[s][a];
  const reward = rewards[s];
  const newS = performAction(a, s);
  const bestNextQ = Math.max(...q[newS]);
  const alpha = 0.1;
  const discount = 0.95;

  const newQ = currentQ + alpha * (reward + discount * bestNextQ - currentQ);
  return newQ;
};

// pick random action
const _actions = [Action.Left, Action.Right, Action.Down, Action.Up];

let count = 0;
const timer = setInterval(() => {
  count++;
  if (count > 1000) clearInterval(timer);

  const randomAction = _actions[Math.floor(Math.random() * 10) % actionsCount];
  q[c1][randomAction] = calculateQ(c1, randomAction);
  c1 = performAction(randomAction, c1);
  draw();
}, 50);
