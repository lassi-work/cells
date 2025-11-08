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
};

@Injectable()
export class AppService {
  private readonly q: Record<number, number[]>;
  private readonly gridSize = 10;
  private readonly boxesCount = this.gridSize * this.gridSize;
  private readonly actionsCount = 4;
  private readonly maxIterationsPerRound = 18;

  private readonly c2 = this.boxesCount;

  constructor(
    private readonly configs: ConfigService<Configurations>,
    private readonly game: GameService,
  ) {
    const storeData = this.getStorageData();
    this.q = storeData.q || this.generateQs();
  }

  train(p: TrainParams) {
    console.log(`Decay e: ${p.decayE}`);

    let e = 1;
    let maxRewards = -Infinity;
    const rounds = 2000;
    const states: number[][] = [];

    const decay = this.generateDecayFunction(e, 0.25 * rounds, 0.8 * rounds);

    console.log('Starting training...');
    for (let i = 0; i < rounds; i++) {
      process.stdout.write(`\rTraining round ${i + 1} / ${rounds}`);
      if (p.decayE) e = decay(e, i);

      let c1 = 1; // player - top left

      states[i] = [];
      states[i].push(c1);

      let roundRewards = 0;

      for (let j = 0; j < this.maxIterationsPerRound; j++) {
        const action = this.chooseAction(c1, e);
        roundRewards += this.game.getRewards(c1);
        this.q[c1][action] = this.calculateQ(c1, this.c2, action);
        c1 = this.game.performAction(action, c1);
        states[i].push(c1);
      }

      if (roundRewards > maxRewards) maxRewards = roundRewards;
    }
    console.log('\nTraining completed.');

    this.saveStorageData();

    return { maxRewards, states };
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
    const reward = this.game.getRewards(nextS);
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
