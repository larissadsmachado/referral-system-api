
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
        { provide: getModelToken(Customer.name), useValue: customerModel }, //identificador do model do mongoose
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
    console.log('\n========== TESTE 1 ==========');
    console.log('Cenário: cliente indicador não encontrado no Redis.');

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

    console.log('ID do indicador:', parentId);
    console.log('Cliente simulado no MongoDB:', parent);
    console.log('Cliente que será criado:', created);

    const response = await service.create({
      name: ' Maria ',
      email: ' MARIA@example.com ',
      parent_customer_id: parentId,
    });

    console.log('\nRESPOSTA DO SERVICE.CREATE():');
    console.log(JSON.stringify(response, null, 2));

    console.log('\nCHAMADAS REALIZADAS:');
    console.log(
      'Redis - busca:',
      redisService.findCustomer.mock.calls,
    );
    console.log(
      'MongoDB - busca:',
      customerModel.findById.mock.calls,
    );
    console.log(
      'Redis - gravações:',
      redisService.cacheCustomer.mock.calls,
    );
    console.log(
      'RabbitMQ - publicação simulada:',
      indicationEventsService.publishIndicationCreated.mock.calls,
    );

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

    expect(
      indicationEventsService.publishIndicationCreated,
    ).toHaveBeenCalledWith({
      customer_id: newCustomerId,
      parent_customer_id: parentId,
    });

    expect(response).toMatchObject({
      customer_id: newCustomerId,
      email: 'maria@example.com',
      parent_customer_id: parentId,
    });

    console.log('TESTE 1: todas as verificações passaram!');
  });

  it('rejects an unknown referrer without creating the customer', async () => {
    console.log('\n========== TESTE 2 ==========');
    console.log('Cenário: cliente indicador não existe.');

    const parentId = new Types.ObjectId().toString();

    customerModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    console.log('ID do indicador inexistente:', parentId);

    await expect(
      service.create({
        name: 'Maria',
        email: 'maria@example.com',
        parent_customer_id: parentId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    console.log(
      'Resultado: serviço rejeitou o cadastro com BadRequestException.',
    );

    expect(customerModel.create).not.toHaveBeenCalled();

    expect(
      indicationEventsService.publishIndicationCreated,
    ).not.toHaveBeenCalled();

    console.log('MongoDB - criação:', customerModel.create.mock.calls);
    console.log(
      'RabbitMQ - publicação:',
      indicationEventsService.publishIndicationCreated.mock.calls,
    );

    console.log('TESTE 2: todas as verificações passaram!');
  });
});
