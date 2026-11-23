import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { IndicationEventsService } from './indication-events.service';
  
@Module({
  imports: [ReportsModule],
  providers: [IndicationEventsService],
  exports: [IndicationEventsService],
})
export class IndicationsModule {}
