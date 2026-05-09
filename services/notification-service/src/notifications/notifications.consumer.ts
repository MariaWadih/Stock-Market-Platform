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

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.exchange = this.configService.getOrThrow<string>(
      'rabbitmq.notificationsExchange',
    );
  }

  async onModuleInit(): Promise<void> {
    this.connection = await connect(
      this.configService.getOrThrow<string>('rabbitmq.url'),
    );
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });
    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.bindQueue(this.queue, this.exchange, '#');
    await this.channel.prefetch(5);
    await this.channel.consume(this.queue, (message) => {
      void this.handleMessage(message);
    });

    this.logger.log(`Consuming notification events from ${this.queue}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
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
