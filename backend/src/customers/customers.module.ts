import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndicationsModule } from '../indications/indications.module';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    IndicationsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
