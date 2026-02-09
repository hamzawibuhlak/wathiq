import {
    Controller,
    Post,
    Get,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Import')
@ApiBearerAuth('JWT-auth')
@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post('clients')
    @ApiOperation({ summary: 'استيراد عملاء من ملف Excel' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'ملف Excel (.xlsx)',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'نتيجة الاستيراد' })
    @UseInterceptors(FileInterceptor('file'))
    async importClients(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                    new FileTypeValidator({
                        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }),
                ],
            }),
        )
        file: Express.Multer.File,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        const result = await this.importService.importClients(
            file.buffer,
            tenantId,
            userId,
        );
        return {
            data: result,
            message: `تم استيراد ${result.imported} عميل بنجاح`,
        };
    }

    @Post('cases')
    @ApiOperation({ summary: 'استيراد قضايا من ملف Excel' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'ملف Excel (.xlsx)',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'نتيجة الاستيراد' })
    @UseInterceptors(FileInterceptor('file'))
    async importCases(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({
                        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }),
                ],
            }),
        )
        file: Express.Multer.File,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        const result = await this.importService.importCases(
            file.buffer,
            tenantId,
            userId,
        );
        return {
            data: result,
            message: `تم استيراد ${result.imported} قضية بنجاح`,
        };
    }

    @Get('templates/clients')
    @ApiOperation({ summary: 'تحميل نموذج استيراد العملاء' })
    @ApiResponse({ status: 200, description: 'ملف Excel نموذج' })
    async getClientsTemplate(@Res() res: Response) {
        const buffer = await this.importService.getClientsTemplate();

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=clients_template.xlsx',
        });

        res.send(buffer);
    }

    @Get('templates/cases')
    @ApiOperation({ summary: 'تحميل نموذج استيراد القضايا' })
    @ApiResponse({ status: 200, description: 'ملف Excel نموذج' })
    async getCasesTemplate(@Res() res: Response) {
        const buffer = await this.importService.getCasesTemplate();

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=cases_template.xlsx',
        });

        res.send(buffer);
    }
}
