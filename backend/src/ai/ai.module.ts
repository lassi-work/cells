import { Module } from '@nestjs/common';
import { QLearning } from './q-learning.service';

@Module({
  providers: [QLearning],
})
export class AiModule {}
