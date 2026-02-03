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
    ForbiddenException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { FilterCasesDto } from './dto/filter-cases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cases')
@ApiBearerAuth('JWT-auth')
@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
    constructor(private readonly casesService: CasesService) { }

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع القضايا مع pagination و filters' })
    @ApiResponse({ status: 200, description: 'قائمة القضايا' })
    async findAll(
        @TenantId() tenantId: string,
        @Query() filterDto: FilterCasesDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.casesService.findAll(tenantId, filterDto, userId, userRole);
    }

    @Get('stats')
    @ApiOperation({ summary: 'إحصائيات القضايا' })
    @ApiResponse({ status: 200, description: 'إحصائيات القضايا' })
    async getStats(
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.casesService.getStats(tenantId, userId, userRole);
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على تفاصيل قضية واحدة' })
    @ApiResponse({ status: 200, description: 'تفاصيل القضية' })
    @ApiResponse({ status: 404, description: 'القضية غير موجودة' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.casesService.findOne(id, tenantId, userId, userRole);
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إنشاء قضية جديدة' })
    @ApiResponse({ status: 201, description: 'تم إنشاء القضية بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createCaseDto: CreateCaseDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.casesService.create(createCaseDto, tenantId, userId);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تعديل قضية' })
    @ApiResponse({ status: 200, description: 'تم تحديث القضية بنجاح' })
    @ApiResponse({ status: 404, description: 'القضية غير موجودة' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCaseDto: UpdateCaseDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.casesService.update(id, updateCaseDto, tenantId, userId, userRole);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف قضية' })
    @ApiResponse({ status: 200, description: 'تم حذف القضية بنجاح' })
    @ApiResponse({ status: 404, description: 'القضية غير موجودة' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.casesService.remove(id, tenantId);
    }

    @Patch('bulk/status')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تحديث حالة عدة قضايا' })
    @ApiResponse({ status: 200, description: 'تم تحديث القضايا بنجاح' })
    async bulkUpdateStatus(
        @Body() body: { ids: string[]; status: string },
        @TenantId() tenantId: string,
    ) {
        return this.casesService.bulkUpdateStatus(body.ids, body.status, tenantId);
    }

    @Delete('bulk/delete')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف عدة قضايا' })
    @ApiResponse({ status: 200, description: 'تم حذف القضايا بنجاح' })
    async bulkDelete(
        @Body() body: { ids: string[] },
        @TenantId() tenantId: string,
    ) {
        return this.casesService.bulkDelete(body.ids, tenantId);
    }
}
