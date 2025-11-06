import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('train')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  train() {
    return this.appService.train();
  }
}
