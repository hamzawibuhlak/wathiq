import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
    constructor(private readonly prisma: PrismaService) { }

    async findOne(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            throw new NotFoundException('المكتب غير موجود');
        }

        return { data: tenant };
    }

    async update(id: string, dto: UpdateTenantDto) {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: dto,
        });

        return { data: tenant, message: 'تم تحديث معلومات المكتب بنجاح' };
    }
}
