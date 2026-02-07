import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    ParseUUIDPipe,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiConsumes,
    ApiResponse,
    ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { extname } from 'path';
import { UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { TemplatesService, CreateTemplateDto } from './templates.service';
import { CreateDocumentDto, UpdateDocumentDto, FilterDocumentsDto, BulkDeleteDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Allowed file types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx'];

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
    constructor(
        private readonly documentsService: DocumentsService,
        private readonly templatesService: TemplatesService,
    ) { }

    // ========== MAIN DOCUMENT ENDPOINTS ==========

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'الحصول على جميع المستندات' })
    @ApiResponse({ status: 200, description: 'قائمة المستندات' })
    async findAll(
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: string,
        @Query() filters: FilterDocumentsDto,
    ) {
        return this.documentsService.findAll(tenantId, filters, userId, userRole);
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'إحصائيات المستندات' })
    async getStats(@TenantId() tenantId: string) {
        return this.documentsService.getStats(tenantId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'الحصول على تفاصيل مستند' })
    @ApiResponse({ status: 200, description: 'تفاصيل المستند' })
    @ApiResponse({ status: 404, description: 'المستند غير موجود' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        const document = await this.documentsService.findOne(id, tenantId);
        return { data: document };
    }

    @Get(':id/download')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'تحميل المستند' })
    @ApiResponse({ status: 200, description: 'ملف المستند' })
    @ApiResponse({ status: 404, description: 'المستند غير موجود' })
    async download(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @Res() res: Response,
    ) {
        return this.documentsService.serveFile(id, tenantId, res, 'attachment');
    }

    // ========== PUBLIC ENDPOINT FOR PREVIEW ==========
    @Get(':id/preview')
    @ApiOperation({ summary: 'معاينة المستند (عام)' })
    @ApiResponse({ status: 200, description: 'ملف المستند للمعاينة' })
    @ApiResponse({ status: 404, description: 'المستند غير موجود' })
    async preview(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ) {
        return this.documentsService.serveFilePublic(id, res, 'inline');
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'رفع مستند جديد' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'الملف (max 50MB)' },
                title: { type: 'string', description: 'عنوان المستند' },
                description: { type: 'string', description: 'وصف المستند (اختياري)' },
                documentType: { type: 'string', description: 'نوع المستند' },
                caseId: { type: 'string', description: 'معرف القضية' },
                tags: { type: 'string', description: 'الوسوم (JSON array أو comma-separated)' },
            },
            required: ['file'],
        },
    })
    @ApiResponse({ status: 201, description: 'تم رفع المستند بنجاح' })
    @ApiResponse({ status: 400, description: 'نوع الملف غير مدعوم' })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: MAX_FILE_SIZE },
            fileFilter: (req, file, callback) => {
                const ext = extname(file.originalname).toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                    return callback(
                        new BadRequestException(`نوع الملف غير مدعوم. الأنواع المسموحة: ${ALLOWED_EXTENSIONS.join(', ')}`),
                        false,
                    );
                }
                if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    return callback(
                        new BadRequestException('نوع الملف غير مدعوم'),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() createDocumentDto: CreateDocumentDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('الملف مطلوب');
        }
        return this.documentsService.upload(file, createDocumentDto, tenantId, userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تحديث مستند' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDocumentDto: UpdateDocumentDto,
        @TenantId() tenantId: string,
    ) {
        return this.documentsService.update(id, updateDocumentDto, tenantId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف مستند' })
    @ApiResponse({ status: 200, description: 'تم حذف المستند بنجاح' })
    @ApiResponse({ status: 404, description: 'المستند غير موجود' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.documentsService.remove(id, tenantId);
    }

    @Delete()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف مستندات متعددة' })
    async bulkDelete(
        @Body() dto: BulkDeleteDto,
        @TenantId() tenantId: string,
    ) {
        return this.documentsService.bulkDelete(dto.ids, tenantId);
    }

    // ========== VERSION ENDPOINTS ==========

    @Post(':id/new-version')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إنشاء إصدار جديد من المستند' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: MAX_FILE_SIZE },
            fileFilter: (req, file, callback) => {
                const ext = extname(file.originalname).toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                    return callback(
                        new BadRequestException('نوع الملف غير مدعوم'),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    async createNewVersion(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('الملف مطلوب');
        }
        return this.documentsService.createNewVersion(id, file, tenantId, userId);
    }

    @Get(':id/versions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'الحصول على سجل إصدارات المستند' })
    async getVersionHistory(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.documentsService.getVersionHistory(id, tenantId);
    }

    @Post(':id/restore')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'استعادة إصدار سابق' })
    async restoreVersion(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.documentsService.restoreVersion(id, tenantId);
    }

    // ========== TEMPLATE ENDPOINTS ==========

    @Get('templates/list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'الحصول على قوالب المستندات' })
    async getTemplates(
        @TenantId() tenantId: string,
        @Query('category') category?: string,
    ) {
        return this.templatesService.findAll(tenantId, category as any);
    }

    @Post('templates')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إنشاء قالب مستند' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async createTemplate(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateTemplateDto,
        @TenantId() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('الملف مطلوب');
        }
        return this.templatesService.create(file, dto, tenantId);
    }

    @Get('templates/:id/download')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'تحميل قالب' })
    async downloadTemplate(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @Res() res: Response,
    ) {
        return this.templatesService.getFile(id, tenantId, res);
    }

    @Post('templates/:id/create-document')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إنشاء مستند من قالب' })
    async createDocumentFromTemplate(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { caseId?: string },
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.templatesService.createDocumentFromTemplate(id, body.caseId, tenantId, userId);
    }

    @Delete('templates/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف قالب' })
    async deleteTemplate(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.templatesService.delete(id, tenantId);
    }
}
