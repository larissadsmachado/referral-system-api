import { Model } from 'mongoose';
import { RedisService } from '../redis/redis.service';
import { IndicationEventsService } from '../indications/indication-events.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './schemas/customer.schema';
import { CustomerResponse } from './customer.types';
export declare class CustomersService {
    private readonly customerModel;
    private readonly redisService;
    private readonly indicationEventsService;
    constructor(customerModel: Model<Customer>, redisService: RedisService, indicationEventsService: IndicationEventsService);
    create(dto: CreateCustomerDto): Promise<CustomerResponse>;
    private findReferrer;
    private toCacheEntry;
    private toResponse;
}
