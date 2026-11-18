import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';
import type {
  ChannelModel,
  ConfirmChannel,
  ConsumeMessage,
} from 'amqplib';
import { ReportsService } from '../reports/reports.service';

interface IndicationCreatedEvent {
  customer_id: string;
  parent_customer_id: string;
}

const OBJECT_ID_PATTERN = /^[\da-f]{24}$/i;

@Injectable()
export class IndicationEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndicationEventsService.name);
  private readonly exchange: string;
  private readonly queue: string;
  private readonly routingKey: string;
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  constructor(
    configService: ConfigService,
    private readonly reportsService: ReportsService,
  ) {
    this.exchange = configService.getOrThrow<string>('RABBITMQ_EXCHANGE');
    this.queue = configService.getOrThrow<string>('RABBITMQ_QUEUE');
    this.routingKey = configService.getOrThrow<string>(
      'RABBITMQ_ROUTING_KEY',
    );
    this.rabbitUrl = configService.getOrThrow<string>('RABBITMQ_URL');
  }

  private readonly rabbitUrl: string;

  async onModuleInit(): Promise<void> {
    this.connection = await amqp.connect(this.rabbitUrl);
    this.connection.on('error', (error: Error) => {
      this.logger.error('RabbitMQ connection error.', error.stack);
    });

    this.channel = await this.connection.createConfirmChannel();
    this.channel.on('error', (error: Error) => {
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
    await this.channel.consume(
      this.queue,
      (message) => {
        if (message) {
          void this.handleMessage(message);
        }
      },
      { noAck: false },
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publishIndicationCreated(
    event: IndicationCreatedEvent,
  ): Promise<void> {
    const channel = this.channel;
    if (!channel) {
      throw new Error('RabbitMQ channel is not initialized.');
    }

    await new Promise<void>((resolve, reject) => {
      channel.publish(
        this.exchange,
        this.routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          contentType: 'application/json',
          persistent: true,
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });
  }

  private async handleMessage(message: ConsumeMessage): Promise<void> {
    const channel = this.channel;
    if (!channel) {
      this.logger.error('Cannot process indication: RabbitMQ channel is closed.');
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(message.content.toString()) as unknown;
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        this.logger.error(
          'Could not parse an indication event.',
          error instanceof Error ? error.stack : String(error),
        );
      } else {
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
      await this.reportsService.incrementIndications(
        payload.parent_customer_id,
      );
      channel.ack(message);
    } catch (error) {
      this.logger.error(
        'Failed to update the indication report; requeueing event.',
        error instanceof Error ? error.stack : String(error),
      );
      channel.nack(message, false, true);
    }
  }
}

function isIndicationCreatedEvent(
  value: unknown,
): value is IndicationCreatedEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.customer_id === 'string' &&
    OBJECT_ID_PATTERN.test(value.customer_id) &&
    typeof value.parent_customer_id === 'string' &&
    OBJECT_ID_PATTERN.test(value.parent_customer_id)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
