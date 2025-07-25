import {Injectable} from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import {ILocationRepository} from "../interfaces/location-repository.interface";
import {CreateLocationDto, LocationQueryDto, LocationResponseDto, UpdateLocationDto} from "../dtos";
import { Prisma } from 'generated/prisma';


@Injectable()
export class PrismaLocationRepository implements ILocationRepository {
    constructor(private prisma: PrismaService) {
    }

    async create(data: CreateLocationDto): Promise<LocationResponseDto> {
        const defaultLat = -1.2921;
        const defaultLng = 36.8219;

        return this.prisma.location.create({
            data: {
                name: data.name,
                address: data.address,
                latitude: data.latitude ?? defaultLat,
                longitude: data.longitude ?? defaultLng,
            },
        });
    }

    async findById(id: string): Promise<LocationResponseDto | null> {
        return this.prisma.location.findUnique({
            where: {id},
        });
    }

    async findMany(query: LocationQueryDto) {
        const {
            search = '',
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const skip = (page - 1) * limit;

        const where: Prisma.LocationWhereInput = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { address: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [data, total] = await Promise.all([
            this.prisma.location.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.location.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }


    async update(id: string, data: UpdateLocationDto): Promise<LocationResponseDto> {
        return this.prisma.location.update({
            where: {id},
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.location.delete({
            where: {id},
        });
    }

    async findByCoordinates(latitude: number, longitude: number, radiusKm: number = 10): Promise<LocationResponseDto[]> {
        // Using raw SQL for distance calculation
        const radiusInDegrees = radiusKm / 111; // Rough conversion

        return this.prisma.$queryRaw`
            SELECT *
            FROM locations
            WHERE SQRT(
                          POW(latitude - ${latitude}, 2) + POW(longitude - ${longitude}, 2)
                  ) <= ${radiusInDegrees}
            ORDER BY SQRT(    POW(latitude - ${latitude}, 2) + POW(longitude - ${longitude}, 2))`;
    }
}