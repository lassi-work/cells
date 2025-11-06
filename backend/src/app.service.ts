import { Injectable } from '@nestjs/common';

enum Action {
  Left,
  Right,
  Down,
  Up,
}

@Injectable()
export class AppService {
  private readonly rewards: number[] = [];
  private readonly q: Record<number, number[]> = {};
  private readonly gridSize = 10;
  private readonly boxesCount = this.gridSize * this.gridSize;
  private readonly actionsCount = 4;

  private readonly c2 = this.boxesCount;

  private readonly actions: Record<Action, (s: number) => number> = {
    [Action.Left]: (s) => (s % this.gridSize === 1 ? s : s - 1),
    [Action.Right]: (s) => (s % this.gridSize > 0 ? s + 1 : s),
    [Action.Down]: (s) =>
      s < this.boxesCount - this.gridSize ? s + this.gridSize : s,
    [Action.Up]: (s) => (s > this.gridSize ? s - this.gridSize : s),
  };

  constructor() {
    for (let i = 1; i <= this.boxesCount; i++) {
      this.q[i] = [];
      for (let j = 0; j < this.actionsCount; j++) this.q[i][j] = Math.random();
    }
  }

  train() {
    // player
    let c1 = 1; // top left

    const _actions = [Action.Left, Action.Right, Action.Down, Action.Up];
    const states: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const randomAction =
        _actions[Math.floor(Math.random() * 10) % this.actionsCount];
      this.q[c1][randomAction] = this.calculateQ(c1, this.c2, randomAction);
      c1 = this.performAction(randomAction, c1);
      states.push(c1);
    }

    return states;
  }

  private performAction(a: Action, s: number) {
    return this.actions[a](s);
  }

  private calculateQ(s: number, newS: number, a: Action) {
    const currentQ = this.q[s][a];
    const reward = this.rewards[s];
    const bestNextQ = Math.max(...this.q[newS]);
    const alpha = 0.1;
    const discount = 0.95;

    const newQ = currentQ + alpha * (reward + discount * bestNextQ - currentQ);
    return newQ;
  }
}
