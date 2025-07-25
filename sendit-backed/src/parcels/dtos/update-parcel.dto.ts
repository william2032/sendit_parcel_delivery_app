import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateParcelDto } from './create-parcel.dto';
import { IsEnum, IsOptional } from 'class-validator';
import {$Enums} from "../../../generated/prisma";
import ParcelStatus = $Enums.ParcelStatus;

export class UpdateParcelDto extends PartialType(
    OmitType(CreateParcelDto, ['senderId', 'receiverId'] as const)
) {
    @IsOptional()
    @IsEnum(ParcelStatus)
    status?: ParcelStatus;
}
