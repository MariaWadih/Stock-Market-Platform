import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { EmailService } from './email.service';
import { NotificationEvent } from './notification-event';

@Injectable()
export class NotificationsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsConsumer.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private readonly exchange: string;
  private readonly queue = 'notification-service.email';
  private readonly reconnectDelayMs = 5000;
  private reconnectTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.exchange = this.configService.getOrThrow<string>(
      'rabbitmq.notificationsExchange',
    );
  }

  async onModuleInit(): Promise<void> {
    await this.connectAndConsume();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async connectAndConsume(): Promise<void> {
    try {
      const connection = await connect(
        this.configService.getOrThrow<string>('rabbitmq.url'),
      );
      const channel = await connection.createChannel();

      this.connection = connection;
      this.channel = channel;

      connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', error);
      });
      connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.channel = undefined;
        this.connection = undefined;
        this.scheduleReconnect();
      });
      channel.on('error', (error) => {
        this.logger.error('RabbitMQ channel error', error);
      });
      channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
        this.channel = undefined;
      });

      await channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });
      await channel.assertQueue(this.queue, { durable: true });
      await channel.bindQueue(this.queue, this.exchange, '#');
      await channel.prefetch(5);
      await channel.consume(this.queue, (message) => {
        void this.handleMessage(message);
      });

      this.logger.log(`Consuming notification events from ${this.queue}`);
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      this.channel = undefined;
      this.connection = undefined;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown || this.reconnectTimer) {
      return;
    }

    this.logger.warn(
      `Retrying RabbitMQ connection in ${this.reconnectDelayMs}ms`,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connectAndConsume();
    }, this.reconnectDelayMs);
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) {
      return;
    }

    try {
      const event = JSON.parse(
        message.content.toString('utf8'),
      ) as NotificationEvent;
      await this.emailService.sendNotification(event);
      this.channel.ack(message);
      this.logger.log(`Sent email for event ${event.type}`);
    } catch (error) {
      this.logger.error('Failed to process notification event', error);
      this.channel.nack(message, false, false);
    }
  }
}
