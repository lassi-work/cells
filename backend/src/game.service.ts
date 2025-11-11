import { Injectable } from '@nestjs/common';

export enum Action {
  Left,
  Right,
  Down,
  Up,
}

@Injectable()
export class GameService {
  private readonly targetReward: number = 18 * 13;
  private readonly distanceRewards: number[];
  private readonly gridSize = 10;
  private readonly boxesCount = this.gridSize * this.gridSize;
  private readonly hittingWallPenalty: number;
  private readonly targetState = this.boxesCount;

  private readonly actions: Record<Action, (s: number) => number> = {
    [Action.Left]: (s) => (s % this.gridSize === 1 ? s : s - 1),
    [Action.Right]: (s) => (s % this.gridSize > 0 ? s + 1 : s),
    [Action.Down]: (s) =>
      s < this.boxesCount - this.gridSize ? s + this.gridSize : s,
    [Action.Up]: (s) => (s > this.gridSize ? s - this.gridSize : s),
  };

  constructor() {
    this.distanceRewards = this.generateDistanceRewards();
    this.hittingWallPenalty = Math.min(...this.distanceRewards.slice(1)) - 1;
  }

  getRewards(oldS: number, s: number): number {
    if (oldS === s) return this.hittingWallPenalty;
    if (s === this.targetState) return this.targetReward;
    return this.distanceRewards[s];
  }

  performAction(a: Action, s: number) {
    return this.actions[a](s);
  }

  private generateDistanceRewards() {
    const _r: number[] = [];
    const targetX = this.targetState % this.gridSize || this.gridSize;
    let targetY = Math.floor(this.targetState / this.gridSize);
    if (targetX !== this.gridSize) targetY += 1;

    for (let i = 1; i <= this.boxesCount; i++) {
      const x = i % this.gridSize || this.gridSize;
      let y = Math.floor(i / this.gridSize);
      if (x !== this.gridSize) y += 1;

      const distance = Math.hypot(targetX - x, targetY - y);
      _r[i] = -distance;
    }

    return _r;
  }
}
