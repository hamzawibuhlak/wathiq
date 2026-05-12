import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DocumentFoldersService } from './document-folders.service';
import { CreateFolderDto, UpdateFolderDto, LinkDocumentDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Document Folders')
@ApiBearerAuth('JWT-auth')
@Controller('document-folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentFoldersController {
    constructor(private readonly foldersService: DocumentFoldersService) {}

    @Get()
    @ApiOperation({ summary: 'جلب المجلدات (الجذرية أو حسب parentId)' })
    @ApiResponse({ status: 200, description: 'قائمة المجلدات' })
    async findAll(

        @Query('parentId') parentId?: string,
    ) {
        return this.foldersService.findAll(parentId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'تفاصيل المجلد مع محتوياته' })
    @ApiResponse({ status: 200, description: 'تفاصيل المجلد' })
    @ApiResponse({ status: 404, description: 'المجلد غير موجود' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.foldersService.findOne(id);
    }

    @Get(':id/documents')
    @ApiOperation({ summary: 'جلب مستندات المجلد' })
    @ApiResponse({ status: 200, description: 'قائمة المستندات' })
    async getFolderDocuments(
        @Param('id', ParseUUIDPipe) id: string,

        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.foldersService.getFolderDocuments(
            id,

            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get(':id/breadcrumb')
    @ApiOperation({ summary: 'مسار التنقل للمجلد' })
    @ApiResponse({ status: 200, description: 'مسار المجلد' })
    async getBreadcrumb(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.foldersService.getBreadcrumb(id);
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إنشاء مجلد جديد' })
    @ApiResponse({ status: 201, description: 'تم إنشاء المجلد' })
    async create(
        @Body() dto: CreateFolderDto,

        @CurrentUser('id') userId: string,
    ) {
        return this.foldersService.create(dto, userId);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تعديل مجلد' })
    @ApiResponse({ status: 200, description: 'تم تحديث المجلد' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateFolderDto,

    ) {
        return this.foldersService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف مجلد' })
    @ApiResponse({ status: 200, description: 'تم حذف المجلد' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.foldersService.remove(id);
    }

    @Post(':id/link-document')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'نسخ مستند لمجلد (اختصار)' })
    @ApiResponse({ status: 201, description: 'تم نسخ المستند' })
    async linkDocument(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: LinkDocumentDto,

    ) {
        return this.foldersService.linkDocument(id, dto.documentId);
    }

    @Post(':id/move-document')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'نقل مستند إلى مجلد' })
    @ApiResponse({ status: 200, description: 'تم نقل المستند' })
    async moveDocument(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: LinkDocumentDto,

    ) {
        return this.foldersService.moveDocument(id, dto.documentId);
    }

    @Delete(':id/unlink-document/:docId')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'حذف نسخة مستند من مجلد' })
    @ApiResponse({ status: 200, description: 'تم حذف النسخة' })
    async unlinkDocument(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('docId', ParseUUIDPipe) docId: string,

    ) {
        return this.foldersService.unlinkDocument(id, docId);
    }

    @Post('move-to-root/:docId')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'نقل مستند للمجلد الأساسي' })
    @ApiResponse({ status: 200, description: 'تم نقل المستند للأساسي' })
    async moveToRoot(
        @Param('docId', ParseUUIDPipe) docId: string,

    ) {
        return this.foldersService.moveToRoot(docId);
    }
}
