import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportsService } from '../reports/reports.service';
interface IndicationCreatedEvent {
    customer_id: string;
    parent_customer_id: string;
}
export declare class IndicationEventsService implements OnModuleInit, OnModuleDestroy {
    private readonly reportsService;
    private readonly logger;
    private readonly exchange;
    private readonly queue;
    private readonly routingKey;
    private connection;
    private channel;
    constructor(configService: ConfigService, reportsService: ReportsService);
    private readonly rabbitUrl;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishIndicationCreated(event: IndicationCreatedEvent): Promise<void>;
    private handleMessage;
}
export {};
