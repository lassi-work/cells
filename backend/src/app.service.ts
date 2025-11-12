import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Configurations from './types/configurations';
import * as fs from 'node:fs';
import { GameService, Action, Coordinate } from './game.service';

type StorageData = {
  q?: number[][][];
};

export type TrainParams = {
  decayE: boolean;
  rounds?: number;
};

@Injectable()
export class AppService {
  /**
   * [x][y][action]
   */
  private readonly q: number[][][] = [];
  private readonly gridSize = 10;
  private readonly actionsCount = 4;
  private readonly maxIterationsPerRound = 18;
  private readonly defaultRounds = 2000;

  constructor(
    private readonly configs: ConfigService<Configurations>,
    private readonly game: GameService,
  ) {
    const storeData = this.getStorageData();
    this.q = storeData.q || this.generateQs();
  }

  train(p: TrainParams) {
    p.rounds ??= this.defaultRounds;
    console.log(`Decay e: ${p.decayE}`);
    console.log(`Rounds: ${p.rounds}`);

    let e = 1;
    let maxRewards = -Infinity;
    const states: Array<Coordinate[]> = []; // array of coordinates arrays

    const decay = this.generateDecayFunction(
      e,
      0.25 * p.rounds,
      0.8 * p.rounds,
    );

    console.log('Starting training...');
    for (let i = 0; i < p.rounds; i++) {
      process.stdout.write(`\rTraining round ${i + 1} / ${p.rounds}`);
      if (p.decayE) e = decay(e, i);

      let c: Coordinate = [0, 0]; // player - top left

      states[i] = [];
      states[i].push(c);

      let roundRewards = 0;

      for (let j = 0; j < this.maxIterationsPerRound; j++) {
        const action = this.chooseAction(c, e);
        const nextS = this.game.performAction(action, c);
        this.q[c[0]][c[1]][action] = this.calculateQ(c, nextS, action);
        roundRewards += this.game.getRewards(c, nextS);
        c = nextS;
        states[i].push(c);
      }

      if (roundRewards > maxRewards) maxRewards = roundRewards;
    }
    console.log('\nTraining completed.');

    this.saveStorageData();

    return { maxRewards, states };
  }

  getBestStates() {
    const states: Coordinate[] = [];
    let c: Coordinate = [0, 0]; // player - top left
    let rewards = 0;

    for (let i = 0; i < this.maxIterationsPerRound; i++) {
      const action = this.chooseAction(c);
      const prevC = c;
      c = this.game.performAction(action, c);
      rewards += this.game.getRewards(prevC, c);
      states.push(c);
    }

    return { rewards, states };
  }

  /**
   * Get next best action.
   * @param c Current coordinate
   */
  private chooseAction(c: Coordinate): Action;
  /**
   * Get next best action or random action based on epsilon.
   * @param c Current coordinate
   * @param e Epsilon value between 0 and 1
   */
  private chooseAction(c: Coordinate, e: number): Action;
  private chooseAction(c: Coordinate, e: number = -1): Action {
    if (Math.random() <= e) {
      return Math.floor(Math.random() * 10) % this.actionsCount;
    } else {
      const qValues = this.q[c[0]][c[1]];
      let maxIdx = 0;
      for (let i = 1; i < this.actionsCount; i++)
        if (qValues[maxIdx] < qValues[i]) maxIdx = i;
      return maxIdx;
    }
  }

  private generateDecayFunction(e: number, start: number, end: number) {
    const rate = e / (end - start);
    return (e: number, round: number) => {
      if (round < start) return e;
      if (round >= end) return 0;
      return e - rate;
    };
  }

  private calculateQ(c: Coordinate, nextC: Coordinate, a: Action) {
    const currentQ = this.q[c[0]][c[1]][a];
    const reward = this.game.getRewards(c, nextC);
    const bestNextQ = Math.max(...this.q[nextC[0]][nextC[1]]);
    const alpha = 0.1;
    const discount = 0.95;

    const newQ = currentQ + alpha * (reward + discount * bestNextQ - currentQ);
    return newQ;
  }

  private getStorageData(): StorageData {
    const storeFile = this.configs.get<string>('STORE_FILE');
    if (!storeFile) throw new Error('STORE_FILE is not defined');
    const content = fs.readFileSync(storeFile);
    const json = JSON.parse(content.toString()) as StorageData;
    return json;
  }

  private saveStorageData() {
    const data: StorageData = {
      q: this.q,
    };
    const storeFile = this.configs.get<string>('STORE_FILE');
    if (!storeFile) throw new Error('STORE_FILE is not defined');
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
  }

  private generateQs() {
    const _q: typeof this.q = [];

    for (let x = 0; x < this.game.gridSize; x++) {
      _q[x] = [];
      for (let y = 0; y < this.game.gridSize; y++) {
        _q[x][y] = [];
        for (let a = 0; a < this.actionsCount; a++) _q[x][y][a] = 0;
      }
    }

    return _q;
  }
}
