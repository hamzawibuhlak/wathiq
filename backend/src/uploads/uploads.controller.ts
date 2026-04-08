import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Get,
    Param,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { Response } from 'express';
import { existsSync, createReadStream } from 'fs';

// File storage configuration
const storage = diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// File filter for images
const imageFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('نوع الملف غير مدعوم. يرجى رفع صورة'), false);
    }
    cb(null, true);
};

// File filter for documents (images + PDF)
const documentFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
        return cb(new BadRequestException('نوع الملف غير مدعوم'), false);
    }
    cb(null, true);
};

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly prisma: PrismaService) { }

    // ========== User Avatar Upload ==========
    @Post('avatar')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'رفع صورة شخصية للمستخدم' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            fileFilter: imageFilter,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
    async uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('id') userId: string,
        @TenantId() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('لم يتم رفع ملف');
        }

        const avatarUrl = `/uploads/${file.filename}`;

        await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });

        return {
            data: { avatarUrl },
            message: 'تم رفع الصورة الشخصية بنجاح',
        };
    }

    // ========== Tenant Logo Upload ==========
    @Post('logo')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'رفع شعار المكتب' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            fileFilter: imageFilter,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
    async uploadLogo(
        @UploadedFile() file: Express.Multer.File,
        @TenantId() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('لم يتم رفع ملف');
        }

        const logoUrl = `/uploads/${file.filename}`;

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { logo: logoUrl },
        });

        return {
            data: { logoUrl },
            message: 'تم رفع شعار المكتب بنجاح',
        };
    }

    // ========== Letterhead Upload ==========
    @Post('letterhead')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'رفع ورقة الهيد ليتر للمكتب' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            fileFilter: imageFilter,
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    async uploadLetterhead(
        @UploadedFile() file: Express.Multer.File,
        @TenantId() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('لم يتم رفع ملف');
        }

        const letterheadUrl = `/uploads/${file.filename}`;

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { letterheadUrl },
        });

        return {
            data: { letterheadUrl },
            message: 'تم رفع ورقة الهيد ليتر بنجاح',
        };
    }

    // ========== Payment Proof Upload ==========
    @Post('payment-proof/:invoiceId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'رفع إثبات دفع الفاتورة' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            fileFilter: documentFilter,
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    async uploadPaymentProof(
        @UploadedFile() file: Express.Multer.File,
        @Param('invoiceId') invoiceId: string,
        @TenantId() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('لم يتم رفع ملف');
        }

        const proofUrl = `/uploads/${file.filename}`;

        await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { paymentProof: proofUrl },
        });

        return {
            data: { paymentProofUrl: proofUrl },
            message: 'تم رفع إثبات الدفع بنجاح',
        };
    }

    // ========== Serve uploaded files ==========
    @Get('file/:filename')
    @ApiOperation({ summary: 'عرض ملف مرفوع' })
    async serveFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = join(process.cwd(), 'uploads', filename);

        if (!existsSync(filePath)) {
            return res.status(404).json({ message: 'الملف غير موجود' });
        }

        // Determine content type
        const ext = extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline');

        const fileStream = createReadStream(filePath);
        fileStream.pipe(res);
    }
    // ========== General Document Upload ==========
    @Post('document')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'رفع مستند عام' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            fileFilter: documentFilter,
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('لم يتم رفع ملف');
        }

        const documentUrl = `/uploads/${file.filename}`;

        return {
            data: { url: documentUrl },
            message: 'تم رفع المستند بنجاح',
        };
    }
}
