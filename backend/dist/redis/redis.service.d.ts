import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomerCacheEntry } from '../customers/customer.types';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    findCustomer(customerId: string): Promise<CustomerCacheEntry | null>;
    cacheCustomer(customer: CustomerCacheEntry): Promise<void>;
    private customerKey;
}
