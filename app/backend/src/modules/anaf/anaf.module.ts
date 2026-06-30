import { Module } from '@nestjs/common';
import { AnafService } from './anaf.service';
import { AnafController } from './anaf.controller';

@Module({
  controllers: [AnafController],
  providers: [AnafService],
})
export class AnafModule {}
