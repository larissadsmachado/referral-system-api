import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '../redis/redis.service';
import { IndicationEventsService } from '../indications/indication-events.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  Customer,
  CustomerDocument,
} from './schemas/customer.schema';
import {
  CustomerCacheEntry,
  CustomerResponse,
} from './customer.types';

const OBJECT_ID_PATTERN = /^[\da-f]{24}$/i;

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<Customer>,
    private readonly redisService: RedisService,
    private readonly indicationEventsService: IndicationEventsService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerResponse> {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('name não pode estar vazio.');
    }

    const parentCustomerId = dto.parent_customer_id
      ? await this.findReferrer(dto.parent_customer_id)
      : null;

    let customer: CustomerDocument;
    try {
      customer = await this.customerModel.create({
        name,
        email,
        type: 'NORMAL',
        parent_customer_id: parentCustomerId,
        created_at: new Date(),
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }

    await this.redisService.cacheCustomer(this.toCacheEntry(customer));
    const response = this.toResponse(customer);

    if (parentCustomerId) {
      await this.indicationEventsService.publishIndicationCreated({
        customer_id: response.customer_id,
        parent_customer_id: parentCustomerId,
      });
    }

    return response;
  }

  async findAll(): Promise<CustomerResponse[]> {
    const customers = await this.customerModel
      .find()
      .sort({ created_at: -1 })
      .exec();

    return customers.map((customer) => this.toResponse(customer));
  }

  private async findReferrer(customerId: string): Promise<string> {
    if (!OBJECT_ID_PATTERN.test(customerId)) {
      throw new BadRequestException(
        'parent_customer_id precisa ser um ObjectId válido.',
      );
    }

    const cachedCustomer = await this.redisService.findCustomer(customerId);
    if (cachedCustomer) {
      return cachedCustomer._id;
    }

    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new BadRequestException(
        'O customer indicado em parent_customer_id não foi encontrado.',
      );
    }

    await this.redisService.cacheCustomer(this.toCacheEntry(customer));
    return customer._id.toString();
  }

  private toCacheEntry(customer: CustomerDocument): CustomerCacheEntry {
    return {
      _id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      type: customer.type,
      parent_customer_id: customer.parent_customer_id?.toString() ?? null,
      created_at: customer.created_at.toISOString(),
    };
  }

  private toResponse(customer: CustomerDocument): CustomerResponse {
    return {
      customer_id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      type: customer.type,
      parent_customer_id: customer.parent_customer_id?.toString() ?? null,
      created_at: customer.created_at.toISOString(),
    };
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}
