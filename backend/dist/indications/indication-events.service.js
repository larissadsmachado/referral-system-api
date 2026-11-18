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
var IndicationEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicationEventsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib_1 = __importDefault(require("amqplib"));
const reports_service_1 = require("../reports/reports.service");
const OBJECT_ID_PATTERN = /^[\da-f]{24}$/i;
let IndicationEventsService = IndicationEventsService_1 = class IndicationEventsService {
    reportsService;
    logger = new common_1.Logger(IndicationEventsService_1.name);
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
        this.connection = await amqplib_1.default.connect(this.rabbitUrl);
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
exports.IndicationEventsService = IndicationEventsService;
exports.IndicationEventsService = IndicationEventsService = IndicationEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        reports_service_1.ReportsService])
], IndicationEventsService);
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
//# sourceMappingURL=indication-events.service.js.map