import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema';

export interface ReportResponse {
  customer_id: string;
  total_indications: number;
}

@Injectable()
export class ReportsService {

  constructor(
    @InjectModel(Report.name) 
    private readonly reportModel: Model<Report>, //Biblioteca do Mongoose que representa o modelo de dados do Report, permitindo interações com o banco de dados
  ) {}

  async findAll(): Promise<ReportResponse[]> {
    const reports = await this.reportModel 
      .find({}, { customer_id: 1, total_indications: 1, _id: 0 })
      .lean() //Mostrar somente os dados, sem os métodos Extras do Mongoose
      .exec();

    return reports.map((report) => ({
      customer_id: report.customer_id.toString(),
      total_indications: report.total_indications,
    }));
  }

  async incrementIndications(customerId: string): Promise<void> {
    const objectId = new Types.ObjectId(customerId);
    await this.reportModel
      .updateOne(
        { customer_id: objectId },
        {
          $inc: { total_indications: 1 },
          $set: { updated_at: new Date() },
          $setOnInsert: { customer_id: objectId },
        },
        { upsert: true },
      )
      .exec();
  }
}
