import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ collection: 'customers', versionKey: false })
export class Customer {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 254 })
  email!: string;

  @Prop({ required: true, enum: ['NORMAL'], default: 'NORMAL' })
  type!: 'NORMAL';

  @Prop({ type: Types.ObjectId, ref: Customer.name, default: null })
  parent_customer_id!: Types.ObjectId | null;

  @Prop({ required: true, default: Date.now })
  created_at!: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ email: 1 }, { unique: true, name: 'customers_email_unique' });
