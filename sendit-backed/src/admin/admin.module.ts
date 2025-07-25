import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import {PrismaModule} from "../prisma/prisma.module";
import {ParcelsModule} from "../parcels/parcels.module";
import {UsersModule} from "../users/users.module";

@Module({
  imports: [
    PrismaModule,
    ParcelsModule,
    UsersModule,
  ],
  providers: [AdminService],
  controllers: [AdminController]
})
export class AdminModule {}
