import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'reports', versionKey: false })
export class Report {
  @Prop({ type: Types.ObjectId, required: true })
  customer_id!: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  total_indications!: number;

  @Prop({ required: true, default: Date.now })
  updated_at!: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index(
  { customer_id: 1 },
  { unique: true, name: 'reports_customer_id_unique' },
);
