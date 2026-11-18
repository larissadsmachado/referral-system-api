"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const redis_service_1 = require("../redis/redis.service");
const indication_events_service_1 = require("../indications/indication-events.service");
const customer_schema_1 = require("./schemas/customer.schema");
const OBJECT_ID_PATTERN = /^[\da-f]{24}$/i;
let CustomersService = class CustomersService {
    customerModel;
    redisService;
    indicationEventsService;
    constructor(customerModel, redisService, indicationEventsService) {
        this.customerModel = customerModel;
        this.redisService = redisService;
        this.indicationEventsService = indicationEventsService;
    }
    async create(dto) {
        const name = dto.name.trim();
        const email = dto.email.trim().toLowerCase();
        if (!name) {
            throw new common_1.BadRequestException('name não pode estar vazio.');
        }
        const parentCustomerId = dto.parent_customer_id
            ? await this.findReferrer(dto.parent_customer_id)
            : null;
        let customer;
        try {
            customer = await this.customerModel.create({
                name,
                email,
                type: 'NORMAL',
                parent_customer_id: parentCustomerId,
                created_at: new Date(),
            });
        }
        catch (error) {
            if (isDuplicateKeyError(error)) {
                throw new common_1.ConflictException('Este e-mail já está cadastrado.');
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
    async findAll() {
        const customers = await this.customerModel
            .find()
            .sort({ created_at: -1 })
            .exec();
        return customers.map((customer) => this.toResponse(customer));
    }
    async findReferrer(customerId) {
        if (!OBJECT_ID_PATTERN.test(customerId)) {
            throw new common_1.BadRequestException('parent_customer_id precisa ser um ObjectId válido.');
        }
        const cachedCustomer = await this.redisService.findCustomer(customerId);
        if (cachedCustomer) {
            return cachedCustomer._id;
        }
        const customer = await this.customerModel.findById(customerId).exec();
        if (!customer) {
            throw new common_1.BadRequestException('O customer indicado em parent_customer_id não foi encontrado.');
        }
        await this.redisService.cacheCustomer(this.toCacheEntry(customer));
        return customer._id.toString();
    }
    toCacheEntry(customer) {
        return {
            _id: customer._id.toString(),
            name: customer.name,
            email: customer.email,
            type: customer.type,
            parent_customer_id: customer.parent_customer_id?.toString() ?? null,
            created_at: customer.created_at.toISOString(),
        };
    }
    toResponse(customer) {
        return {
            customer_id: customer._id.toString(),
            name: customer.name,
            email: customer.email,
            type: customer.type,
            parent_customer_id: customer.parent_customer_id?.toString() ?? null,
            created_at: customer.created_at.toISOString(),
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(customer_schema_1.Customer.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        redis_service_1.RedisService,
        indication_events_service_1.IndicationEventsService])
], CustomersService);
function isDuplicateKeyError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000);
}
//# sourceMappingURL=customers.service.js.map