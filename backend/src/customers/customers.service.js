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
import { BadRequestException, ConflictException, Injectable, } from '@nestjs/common';
const OBJECT_ID_PATTERN = /^[\da-f]{24}$/i;
let CustomersService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CustomersService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CustomersService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
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
                throw new BadRequestException('name não pode estar vazio.');
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
        async findReferrer(customerId) {
            if (!OBJECT_ID_PATTERN.test(customerId)) {
                throw new BadRequestException('parent_customer_id precisa ser um ObjectId válido.');
            }
            const cachedCustomer = await this.redisService.findCustomer(customerId);
            if (cachedCustomer) {
                return cachedCustomer._id;
            }
            const customer = await this.customerModel.findById(customerId).exec();
            if (!customer) {
                throw new BadRequestException('O customer indicado em parent_customer_id não foi encontrado.');
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
    return CustomersService = _classThis;
})();
export { CustomersService };
function isDuplicateKeyError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000);
}
