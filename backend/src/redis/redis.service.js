var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable, Logger, } from '@nestjs/common';
import Redis from 'ioredis';
let RedisService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RedisService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RedisService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new Logger(RedisService.name);
        client;
        constructor(configService) {
            this.client = new Redis(configService.getOrThrow('REDIS_URL'), {
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
    return RedisService = _classThis;
})();
export { RedisService };
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
