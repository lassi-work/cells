import { Controller, Get, Query } from '@nestjs/common';
import { AppService, type TrainParams } from './app.service';

type TrainQuery = {
  [key in keyof TrainParams]: string | undefined;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('train')
  train(@Query() query: TrainQuery) {
    const params: TrainParams = {
      decayE: query.decayE === 'true',
      rounds: query.rounds ? parseInt(query.rounds) : undefined,
    };
    return this.appService.train(params);
  }

  @Get('best-states')
  getStatus() {
    return this.appService.getBestStates();
  }
}
