import { Model } from 'mongoose';
import { Report } from './schemas/report.schema';
export interface ReportResponse {
    customer_id: string;
    total_indications: number;
}
export declare class ReportsService {
    private readonly reportModel;
    constructor(reportModel: Model<Report>);
    findAll(): Promise<ReportResponse[]>;
    incrementIndications(customerId: string): Promise<void>;
}
