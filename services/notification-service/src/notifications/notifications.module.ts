import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationsConsumer } from './notifications.consumer';

@Module({
  providers: [EmailService, NotificationsConsumer],
})
export class NotificationsModule {}
