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
import amqp from 'amqplib';
const OBJECT_ID_PATTERN = /^[\da-f]{24}$/i;
let IndicationEventsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var IndicationEventsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IndicationEventsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reportsService;
        logger = new Logger(IndicationEventsService.name);
        exchange;
        queue;
        routingKey;
        connection = null;
        channel = null;
        constructor(configService, reportsService) {
            this.reportsService = reportsService;
            this.exchange = configService.getOrThrow('RABBITMQ_EXCHANGE');
            this.queue = configService.getOrThrow('RABBITMQ_QUEUE');
            this.routingKey = configService.getOrThrow('RABBITMQ_ROUTING_KEY');
            this.rabbitUrl = configService.getOrThrow('RABBITMQ_URL');
        }
        rabbitUrl;
        async onModuleInit() {
            this.connection = await amqp.connect(this.rabbitUrl);
            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error.', error.stack);
            });
            this.channel = await this.connection.createConfirmChannel();
            this.channel.on('error', (error) => {
                this.logger.error('RabbitMQ channel error.', error.stack);
            });
            this.channel.on('close', () => {
                this.logger.warn('RabbitMQ channel closed.');
            });
            await this.channel.assertExchange(this.exchange, 'direct', {
                durable: true,
            });
            await this.channel.assertQueue(this.queue, { durable: true });
            await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);
            await this.channel.prefetch(1);
            await this.channel.consume(this.queue, (message) => {
                if (message) {
                    void this.handleMessage(message);
                }
            }, { noAck: false });
        }
        async onModuleDestroy() {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
        }
        async publishIndicationCreated(event) {
            const channel = this.channel;
            if (!channel) {
                throw new Error('RabbitMQ channel is not initialized.');
            }
            await new Promise((resolve, reject) => {
                channel.publish(this.exchange, this.routingKey, Buffer.from(JSON.stringify(event)), {
                    contentType: 'application/json',
                    persistent: true,
                }, (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }
        async handleMessage(message) {
            const channel = this.channel;
            if (!channel) {
                this.logger.error('Cannot process indication: RabbitMQ channel is closed.');
                return;
            }
            let payload;
            try {
                payload = JSON.parse(message.content.toString());
            }
            catch (error) {
                if (!(error instanceof SyntaxError)) {
                    this.logger.error('Could not parse an indication event.', error instanceof Error ? error.stack : String(error));
                }
                else {
                    this.logger.error('Received invalid JSON in an indication event.');
                }
                channel.nack(message, false, false);
                return;
            }
            if (!isIndicationCreatedEvent(payload)) {
                this.logger.error('Received an invalid customer.indication.created event.');
                channel.nack(message, false, false);
                return;
            }
            try {
                await this.reportsService.incrementIndications(payload.parent_customer_id);
                channel.ack(message);
            }
            catch (error) {
                this.logger.error('Failed to update the indication report; requeueing event.', error instanceof Error ? error.stack : String(error));
                channel.nack(message, false, true);
            }
        }
    };
    return IndicationEventsService = _classThis;
})();
export { IndicationEventsService };
function isIndicationCreatedEvent(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.customer_id === 'string' &&
        OBJECT_ID_PATTERN.test(value.customer_id) &&
        typeof value.parent_customer_id === 'string' &&
        OBJECT_ID_PATTERN.test(value.parent_customer_id));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
