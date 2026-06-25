import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '../clients/clients.module';
import { Workpoint, WorkpointSchema } from './schemas/workpoint.schema';
import { WorkpointsService } from './workpoints.service';
import { WorkpointsController } from './workpoints.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workpoint.name, schema: WorkpointSchema },
    ]),
    ClientsModule,
  ],
  controllers: [WorkpointsController],
  providers: [WorkpointsService],
  exports: [WorkpointsService],
})
export class WorkpointsModule {}
