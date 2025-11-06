const CSIZE = 500;
const RADIUS = CSIZE / 20 / 2; // 20 cells fit in canvas
const DIAMETER = RADIUS * 2;
const COC = RADIUS / 2; // change of coordinates
const FPI = 20;
const MAX_ITR = 1000; // max iterations

type Props = {
  CircelRadius: number;
  Circles: { x: number; y: number }[];
};

export default class Game {
  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.ctx.canvas.width = CSIZE;
    this.ctx.canvas.height = CSIZE;
  }

  start() {
    const props: Props = {
      CircelRadius: RADIUS,
      Circles: [
        { x: RADIUS, y: CSIZE - RADIUS },
        { x: CSIZE - RADIUS, y: RADIUS },
      ],
    };

    this.render(props);

    let i = 0;
    const handle = window.setInterval(() => {
      i++;
      if (i > MAX_ITR && handle !== null) {
        clearInterval(handle);
      } else {
        this.update(props, handle);
      }
    }, 1000 / FPI);
  }

  private render(props: Props) {
    this.ctx.clearRect(0, 0, CSIZE, CSIZE);

    props.Circles.forEach((circle) => {
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, props.CircelRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = "white";
      this.ctx.fill();
      this.ctx.closePath();
    });
  }

  private update(props: Props, intervalHandle: number) {
    const [c1, c2] = props.Circles;

    if (Math.hypot(c1.x - c2.x, c1.y - c2.y) <= DIAMETER) {
      clearInterval(intervalHandle);
    }

    c1.x += COC;
    c1.y -= COC;

    c2.x -= COC;
    c2.y += COC;

    this.render(props);
  }
}
