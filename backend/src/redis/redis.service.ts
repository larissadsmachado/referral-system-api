import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CustomerCacheEntry } from '../customers/customer.types'; 

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit(); 
    }
  }

  async findCustomer(customerId: string): Promise<CustomerCacheEntry | null> {
    const serialized = await this.client.get(this.customerKey(customerId));
    if (!serialized) {
      return null;
    }

    let entry: unknown;
    try {
      entry = JSON.parse(serialized) as unknown;
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      this.logger.warn(`Invalid Redis cache for customer ${customerId}.`);
      return null;
    }

    if (!isCustomerCacheEntry(entry) || entry._id !== customerId) {
      this.logger.warn(`Invalid Redis cache for customer ${customerId}.`);
      return null;
    }

    return entry;
  }

   //Salva os dados do cliente no Redis
  async cacheCustomer(customer: CustomerCacheEntry): Promise<void> {
    await this.client.set(this.customerKey(customer._id), JSON.stringify(customer));
  }

  private customerKey(customerId: string): string {
    return `customer:${customerId}`;
  }
}

function isCustomerCacheEntry(value: unknown): value is CustomerCacheEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value._id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    value.type === 'NORMAL' &&
    (typeof value.parent_customer_id === 'string' ||
      value.parent_customer_id === null) &&
    typeof value.created_at === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
