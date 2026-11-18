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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor(configService) {
        this.client = new ioredis_1.default(configService.getOrThrow('REDIS_URL'), {
            lazyConnect: true,
        });
    }
    async onModuleInit() {
        await this.client.connect();
        await this.client.ping();
    }
    async onModuleDestroy() {
        if (this.client.status !== 'end') {
            await this.client.quit();
        }
    }
    async findCustomer(customerId) {
        const serialized = await this.client.get(this.customerKey(customerId));
        if (!serialized) {
            return null;
        }
        let entry;
        try {
            entry = JSON.parse(serialized);
        }
        catch (error) {
            if (!(error instanceof SyntaxError)) {
                throw error;
            }
            this.logger.warn(`Ignoring invalid Redis cache for customer ${customerId}.`);
            return null;
        }
        if (!isCustomerCacheEntry(entry) || entry._id !== customerId) {
            this.logger.warn(`Ignoring invalid Redis cache for customer ${customerId}.`);
            return null;
        }
        return entry;
    }
    async cacheCustomer(customer) {
        await this.client.set(this.customerKey(customer._id), JSON.stringify(customer));
    }
    customerKey(customerId) {
        return `customer:${customerId}`;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
function isCustomerCacheEntry(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value._id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.email === 'string' &&
        value.type === 'NORMAL' &&
        (typeof value.parent_customer_id === 'string' ||
            value.parent_customer_id === null) &&
        typeof value.created_at === 'string');
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
//# sourceMappingURL=redis.service.js.map