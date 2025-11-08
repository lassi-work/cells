import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Configurations from './types/configurations';
import * as fs from 'fs';
import { GameService, Action } from './game.service';

type StorageData = {
  q?: Record<number, number[]>;
};

export type TrainParams = {
  decayE: boolean;
  rounds?: number;
};

@Injectable()
export class AppService {
  private readonly q: Record<number, number[]>;
  private readonly gridSize = 10;
  private readonly boxesCount = this.gridSize * this.gridSize;
  private readonly actionsCount = 4;
  private readonly maxIterationsPerRound = 18;
  private readonly defaultRounds = 2000;

  private readonly c2 = this.boxesCount;

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
    const states: number[][] = [];

    const decay = this.generateDecayFunction(
      e,
      0.25 * p.rounds,
      0.8 * p.rounds,
    );

    console.log('Starting training...');
    for (let i = 0; i < p.rounds; i++) {
      process.stdout.write(`\rTraining round ${i + 1} / ${p.rounds}`);
      if (p.decayE) e = decay(e, i);

      let c1 = 1; // player - top left

      states[i] = [];
      states[i].push(c1);

      let roundRewards = 0;

      for (let j = 0; j < this.maxIterationsPerRound; j++) {
        const action = this.chooseAction(c1, e);
        this.q[c1][action] = this.calculateQ(c1, this.c2, action);
        const oldC1 = c1;
        c1 = this.game.performAction(action, c1);
        roundRewards += this.game.getRewards(oldC1, c1);
        states[i].push(c1);
      }

      if (roundRewards > maxRewards) maxRewards = roundRewards;
    }
    console.log('\nTraining completed.');

    this.saveStorageData();

    return { maxRewards, states };
  }

  getBestStates() {
    const states: number[] = [];
    let c1 = 1;
    let rewards = 0;

    for (let j = 0; j < this.maxIterationsPerRound; j++) {
      const action = this.chooseAction(c1, -1);
      const oldC1 = c1;
      c1 = this.game.performAction(action, c1);
      rewards += this.game.getRewards(oldC1, c1);
      states.push(c1);
    }

    return { rewards, states };
  }

  private chooseAction(s: number, e: number): Action {
    if (Math.random() <= e) {
      return Math.floor(Math.random() * 10) % this.actionsCount;
    } else {
      const qValues = this.q[s];
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

  private calculateQ(s: number, nextS: number, a: Action) {
    const currentQ = this.q[s][a];
    const reward = this.game.getRewards(s, nextS);
    const bestNextQ = Math.max(...this.q[nextS]);
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

  private generateQs(): Record<number, number[]> {
    const _q: Record<number, number[]> = {};
    for (let i = 1; i <= this.boxesCount; i++) {
      _q[i] = [];
      for (let j = 0; j < this.actionsCount; j++) _q[i][j] = 0;
    }
    return _q;
  }
}
