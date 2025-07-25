import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { GeocodingService } from './geocoding/geocoding.service';
import {PrismaModule} from "../prisma/prisma.module";
import {PrismaLocationRepository} from "./repositories/prisma-location.repository";

@Module({
  imports: [PrismaModule],
  controllers: [LocationController],
  providers: [
    LocationService,
    GeocodingService,
    {
      provide: 'LOCATION_REPOSITORY',
      useClass: PrismaLocationRepository,
    },
    {
      provide: 'OPENCAGE_CONFIG',
      useValue: {
        apiKey: process.env.OPENCAGE_API_KEY,
      },
    },
  ],
  exports: [LocationService, GeocodingService],
})
export class LocationModule {}