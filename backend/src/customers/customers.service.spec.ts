//TESTES
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { IndicationEventsService } from '../indications/indication-events.service';
import { RedisService } from '../redis/redis.service';
import { Customer } from './schemas/customer.schema';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerModel: {
    create: jest.Mock;
    findById: jest.Mock;
  };
  let redisService: {
    cacheCustomer: jest.Mock;
    findCustomer: jest.Mock;
  };
  let indicationEventsService: {
    publishIndicationCreated: jest.Mock;
  };
  let module: TestingModule;

  beforeEach(async () => {
    customerModel = {
      create: jest.fn(),
      findById: jest.fn(),
    };
    redisService = {
      cacheCustomer: jest.fn().mockResolvedValue(undefined),
      findCustomer: jest.fn().mockResolvedValue(null),
    };
    indicationEventsService = {
      publishIndicationCreated: jest.fn().mockResolvedValue(undefined),
    };

    module = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getModelToken(Customer.name), useValue: customerModel },
        { provide: RedisService, useValue: redisService },
        {
          provide: IndicationEventsService,
          useValue: indicationEventsService,
        },
      ],
    }).compile();

    service = module.get(CustomersService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('uses MongoDB after a cache miss and caches the referrer again', async () => {
    const parentId = new Types.ObjectId().toString();
    const newCustomerId = new Types.ObjectId().toString();
    const now = new Date();
    const parent = {
      _id: new Types.ObjectId(parentId),
      name: 'João',
      email: 'joao@example.com',
      type: 'NORMAL' as const,
      parent_customer_id: null,
      created_at: now,
    };
    const created = {
      _id: new Types.ObjectId(newCustomerId),
      name: 'Maria',
      email: 'maria@example.com',
      type: 'NORMAL' as const,
      parent_customer_id: new Types.ObjectId(parentId),
      created_at: now,
    };
    customerModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(parent),
    });
    customerModel.create.mockResolvedValue(created);

    const response = await service.create({
      name: ' Maria ',
      email: ' MARIA@example.com ',
      parent_customer_id: parentId,
    });

    expect(redisService.findCustomer).toHaveBeenCalledWith(parentId);
    expect(customerModel.findById).toHaveBeenCalledWith(parentId);
    expect(redisService.cacheCustomer).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ _id: parentId }),
    );
    expect(redisService.cacheCustomer).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ _id: newCustomerId }),
    );
    expect(indicationEventsService.publishIndicationCreated).toHaveBeenCalledWith({
      customer_id: newCustomerId,
      parent_customer_id: parentId,
    });
    expect(response).toMatchObject({
      customer_id: newCustomerId,
      email: 'maria@example.com',
      parent_customer_id: parentId,
    });
  });

  it('rejects an unknown referrer without creating the customer', async () => {
    const parentId = new Types.ObjectId().toString();
    customerModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.create({
        name: 'Maria',
        email: 'maria@example.com',
        parent_customer_id: parentId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(customerModel.create).not.toHaveBeenCalled();
    expect(indicationEventsService.publishIndicationCreated).not.toHaveBeenCalled();
  });
});
