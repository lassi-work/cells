import { Injectable } from '@nestjs/common';

/**
 * there is a 100 blocks square grid. player is starting at (0, 0)
 * target is at (9, 9)
 * rewards are based on the distance to the target. lesser distance means higher reward
 */

/**
 * [X, y]
 */
export type Coordinate = [number, number];

export enum Action {
  Left,
  Right,
  Down,
  Up,
}

@Injectable()
export class GameService {
  readonly gridSize = 10;

  private readonly targetReward: number = 18 * 13;
  private readonly hittingWallPenalty: number;

  /**
   * An [x][y] array representing the distance rewards for each position
   * in the grid.
   */
  private readonly distanceRewards: number[][];

  private readonly _target: Coordinate = [this.gridSize - 1, this.gridSize - 1];

  /**
   * x and y can move from 0 to `gridSize - 1`. Inclusive of
   * boundaries. If a move would result in an out-of-bounds position,
   * the function returns the same coordinates.
   */
  private readonly actions: Record<Action, (c: Coordinate) => Coordinate> = {
    [Action.Left]: ([x, y]) => [x > 0 ? x - 1 : x, y],
    [Action.Right]: ([x, y]) => [x < this.gridSize - 1 ? x + 1 : x, y],
    [Action.Down]: ([x, y]) => [x, y < this.gridSize - 1 ? y + 1 : y],
    [Action.Up]: ([x, y]) => [x, y > 0 ? y - 1 : y],
  };

  constructor() {
    this.distanceRewards = this.generateDistanceRewards();
    // starting point has the least distance reward
    // hitting wall has the least reward
    this.hittingWallPenalty = this.distanceRewards[0][0] - 1;
  }

  getRewards(prevC: Coordinate, c: Coordinate): number {
    if (this.areCoordinatesEqual(prevC, c)) return this.hittingWallPenalty;
    if (this.areCoordinatesEqual(c, this._target)) return this.targetReward;
    return this.distanceRewards[c[0]][c[1]];
  }

  performAction(a: Action, c: Coordinate) {
    return this.actions[a](c);
  }

  private generateDistanceRewards(): number[][] {
    const _r: number[][] = [];

    for (let x = 0; x < this.gridSize; x++) {
      _r[x] = [];
      for (let y = 0; y < this.gridSize; y++) {
        const dx = this._target[0] - x;
        const dy = this._target[1] - y;
        _r[x][y] = -Math.hypot(dx, dy);
      }
    }

    return _r;
  }

  private areCoordinatesEqual(a: Coordinate, b: Coordinate) {
    return a[0] === b[0] && a[1] === b[1];
  }
}
