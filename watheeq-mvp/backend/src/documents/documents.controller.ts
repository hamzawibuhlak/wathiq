import {
    Controller,
    Get,
    Post,
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
import { CreateDocumentDto } from './dto/create-document.dto';
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

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'الحصول على جميع المستندات' })
    @ApiResponse({ status: 200, description: 'قائمة المستندات' })
    async findAll(
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: string,
        @Query('caseId') caseId?: string,
        @Query('documentType') documentType?: string,
    ) {
        return this.documentsService.findAll(tenantId, { caseId, documentType }, userId, userRole);
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
        return this.documentsService.findOne(id, tenantId);
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
    // This endpoint doesn't require JWT - uses document ID as access token
    // Used by img src and iframe which can't send Authorization headers
    @Get(':id/preview')
    @ApiOperation({ summary: 'معاينة المستند (عام)' })
    @ApiResponse({ status: 200, description: 'ملف المستند للمعاينة' })
    @ApiResponse({ status: 404, description: 'المستند غير موجود' })
    async preview(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ) {
        // Note: This is less secure but necessary for browser preview
        // The document ID itself acts as an access token
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
                file: { type: 'string', format: 'binary', description: 'الملف (max 10MB)' },
                title: { type: 'string', description: 'عنوان المستند' },
                description: { type: 'string', description: 'وصف المستند (اختياري)' },
                documentType: { type: 'string', description: 'نوع المستند' },
                caseId: { type: 'string', description: 'معرف القضية' },
            },
            required: ['file', 'title', 'caseId'],
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
}
