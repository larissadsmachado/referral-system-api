import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports') //relatórios
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get() //lista todos os relatórios
  findAll() {
    return this.reportsService.findAll();
  }
}
