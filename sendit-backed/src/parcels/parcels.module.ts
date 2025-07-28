import {forwardRef, Module} from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import {PrismaModule} from "../prisma/prisma.module";
import {AppMailerModule} from "../mailer/mailer.module";
import {DriversModule} from "../drivers/drivers.module";

@Module({
  imports: [PrismaModule, AppMailerModule,forwardRef(() => DriversModule),],
  providers: [ParcelsService],
  controllers: [ParcelsController],
  exports: [ParcelsService],
})
export class ParcelsModule {}
