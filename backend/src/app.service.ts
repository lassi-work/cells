import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Configurations from './types/configurations';
import * as fs from 'fs';

type StorageData = {
  q?: Record<number, number[]>;
};

enum Action {
  Left,
  Right,
  Down,
  Up,
}

@Injectable()
export class AppService {
  private readonly rewards: number[] = [];
  private readonly q: Record<number, number[]>;
  private readonly gridSize = 10;
  private readonly boxesCount = this.gridSize * this.gridSize;
  private readonly actionsCount = 4;
  private readonly maxIterationsPerRound = 18;

  private readonly c2 = this.boxesCount;

  private readonly actions: Record<Action, (s: number) => number> = {
    [Action.Left]: (s) => (s % this.gridSize === 1 ? s : s - 1),
    [Action.Right]: (s) => (s % this.gridSize > 0 ? s + 1 : s),
    [Action.Down]: (s) =>
      s < this.boxesCount - this.gridSize ? s + this.gridSize : s,
    [Action.Up]: (s) => (s > this.gridSize ? s - this.gridSize : s),
  };

  constructor(private readonly configs: ConfigService<Configurations>) {
    const storeData = this.getStorageData();
    this.q = storeData.q || this.getRandomQ();
  }

  train() {
    let e = 1;
    const rounds = 2000;
    const states: number[] = [];

    const decay = this.generateDecayFunction(e, 0.25 * rounds, 0.8 * rounds);

    for (let i = 0; i < rounds; i++) {
      process.stdout.write(`\rTraining round ${i + 1} / ${rounds}`);
      e = decay(e, i);

      let c1 = 1; // player - top left
      states.push(c1);

      for (let j = 0; j < this.maxIterationsPerRound; j++) {
        const action = this.chooseAction(c1, e);
        this.q[c1][action] = this.calculateQ(c1, this.c2, action);
        c1 = this.performAction(action, c1);
        states.push(c1);
      }
    }

    this.saveStorageData();

    return states;
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

  private getRandomQ(): Record<number, number[]> {
    const _q: Record<number, number[]> = {};
    for (let i = 1; i <= this.boxesCount; i++) {
      _q[i] = [];
      for (let j = 0; j < this.actionsCount; j++) _q[i][j] = Math.random();
    }
    return _q;
  }
}
