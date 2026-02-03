import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tenants')
@ApiBearerAuth('JWT-auth')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get('current')
    @ApiOperation({ summary: 'Get current tenant info' })
    async getCurrent(@TenantId() tenantId: string) {
        return this.tenantsService.findOne(tenantId);
    }

    @Put('current')
    @ApiOperation({ summary: 'Update current tenant info' })
    @Roles(UserRole.OWNER)
    async update(
        @Body() updateTenantDto: UpdateTenantDto,
        @TenantId() tenantId: string,
    ) {
        return this.tenantsService.update(tenantId, updateTenantDto);
    }
}
