import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientsDto } from './dto/filter-clients.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiBearerAuth('JWT-auth')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع العملاء مع pagination و search' })
    @ApiResponse({ status: 200, description: 'قائمة العملاء' })
    async findAll(
        @TenantId() tenantId: string,
        @Query() filterDto: FilterClientsDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: string,
    ) {
        return this.clientsService.findAll(tenantId, filterDto, userId, userRole);
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على تفاصيل عميل واحد' })
    @ApiResponse({ status: 200, description: 'تفاصيل العميل' })
    @ApiResponse({ status: 404, description: 'العميل غير موجود' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: string,
    ) {
        return this.clientsService.findOne(id, tenantId, userId, userRole);
    }

    @Get(':id/cases')
    @ApiOperation({ summary: 'الحصول على قضايا العميل' })
    @ApiResponse({ status: 200, description: 'قضايا العميل' })
    @ApiResponse({ status: 404, description: 'العميل غير موجود' })
    async getClientCases(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.clientsService.getClientCases(id, tenantId);
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إنشاء عميل جديد' })
    @ApiResponse({ status: 201, description: 'تم إنشاء العميل بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createClientDto: CreateClientDto,
        @TenantId() tenantId: string,
    ) {
        return this.clientsService.create(createClientDto, tenantId);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تعديل عميل' })
    @ApiResponse({ status: 200, description: 'تم تحديث العميل بنجاح' })
    @ApiResponse({ status: 404, description: 'العميل غير موجود' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateClientDto: UpdateClientDto,
        @TenantId() tenantId: string,
    ) {
        return this.clientsService.update(id, updateClientDto, tenantId);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف عميل' })
    @ApiResponse({ status: 200, description: 'تم حذف العميل بنجاح' })
    @ApiResponse({ status: 404, description: 'العميل غير موجود' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.clientsService.remove(id, tenantId);
    }
}
