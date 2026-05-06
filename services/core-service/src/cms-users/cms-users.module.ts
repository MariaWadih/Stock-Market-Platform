import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CmsUsersController } from './cms-users.controller';
import { CmsUsersService } from './cms-users.service';
import { CmsUser, CmsUserSchema } from './schemas/cms-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CmsUser.name, schema: CmsUserSchema }]),
  ],
  controllers: [CmsUsersController],
  providers: [CmsUsersService],
})
export class CmsUsersModule {}
