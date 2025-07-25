import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { LocationAutocompleteService } from './location-autocomplete/location-autocomplete.service';
import {PrismaModule} from "../prisma/prisma.module";
import {ParcelsModule} from "../parcels/parcels.module";
import {LocationModule} from "../location/location.module";
import {AppMailerModule} from "../mailer/mailer.module";
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [PrismaModule,
    AppMailerModule,
    ParcelsModule,
    LocationModule,
    ConfigModule,],
  providers: [DriversService, LocationAutocompleteService],
  controllers: [DriversController],
  exports: [DriversService, LocationAutocompleteService],
})
export class DriversModule {}
