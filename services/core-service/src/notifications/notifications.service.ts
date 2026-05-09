import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';
import { NotificationEvent } from './notification-event';

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private readonly exchange: string;

  constructor(private readonly configService: ConfigService) {
    this.exchange = this.configService.getOrThrow<string>(
      'rabbitmq.notificationsExchange',
    );
  }

  async publish(event: NotificationEvent): Promise<void> {
    const channel = await this.getChannel();
    const routingKey = event.type;
    const payload = Buffer.from(JSON.stringify(event));

    channel.publish(this.exchange, routingKey, payload, {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async getChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(
      this.configService.getOrThrow<string>('rabbitmq.url'),
    );
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });

    this.logger.log(`Connected to RabbitMQ exchange ${this.exchange}`);
    return this.channel;
  }
}
