import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { CaseType, CaseStatus, CasePriority } from '@prisma/client';

export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
}

@Injectable()
export class ImportService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Import clients from Excel file
     */
    async importClients(
        buffer: Buffer,
        tenantId: string,
        userId: string,
    ): Promise<ImportResult> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new BadRequestException('الملف لا يحتوي على بيانات');
        }

        const result: ImportResult = {
            success: true,
            imported: 0,
            skipped: 0,
            errors: [],
        };

        // Skip header row, start from row 2
        for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);

            try {
                const name = row.getCell(1).text?.trim();
                const phone = row.getCell(2).text?.trim();
                const email = row.getCell(3).text?.trim() || null;
                const nationalId = row.getCell(4).text?.trim() || null;
                const companyName = row.getCell(5).text?.trim() || null;
                const address = row.getCell(6).text?.trim() || null;
                const city = row.getCell(7).text?.trim() || null;
                const notes = row.getCell(8).text?.trim() || null;

                // Validate required fields
                if (!name || !phone) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNum,
                        error: 'الاسم ورقم الهاتف مطلوبين'
                    });
                    continue;
                }

                // Check for duplicate by phone
                const existingClient = await this.prisma.client.findFirst({
                    where: { tenantId, phone },
                });

                if (existingClient) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNum,
                        error: `عميل موجود بنفس رقم الهاتف: ${phone}`
                    });
                    continue;
                }

                // Create client
                await this.prisma.client.create({
                    data: {
                        name,
                        phone,
                        email,
                        nationalId,
                        companyName,
                        address,
                        city,
                        notes,
                        tenantId,
                    },
                });

                result.imported++;
            } catch (error: any) {
                result.errors.push({
                    row: rowNum,
                    error: error.message || 'خطأ غير معروف'
                });
            }
        }

        return result;
    }

    /**
     * Import cases from Excel file
     */
    async importCases(
        buffer: Buffer,
        tenantId: string,
        userId: string,
    ): Promise<ImportResult> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new BadRequestException('الملف لا يحتوي على بيانات');
        }

        const result: ImportResult = {
            success: true,
            imported: 0,
            skipped: 0,
            errors: [],
        };

        // Get case type mapping
        const typeMap: Record<string, CaseType> = {
            'جنائي': 'CRIMINAL',
            'مدني': 'CIVIL',
            'تجاري': 'COMMERCIAL',
            'عمالي': 'LABOR',
            'أسري': 'FAMILY',
            'إداري': 'ADMINISTRATIVE',
            'عقاري': 'REAL_ESTATE',
            'أخرى': 'OTHER',
        };

        const priorityMap: Record<string, CasePriority> = {
            'عالية': 'HIGH',
            'متوسطة': 'MEDIUM',
            'منخفضة': 'LOW',
        };

        // Skip header row
        for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);

            try {
                const title = row.getCell(1).text?.trim();
                const clientPhone = row.getCell(2).text?.trim();
                const caseTypeAr = row.getCell(3).text?.trim();
                const courtName = row.getCell(4).text?.trim() || null;
                const courtCaseNumber = row.getCell(5).text?.trim() || null;
                const opposingParty = row.getCell(6).text?.trim() || null;
                const priorityAr = row.getCell(7).text?.trim() || 'متوسطة';
                const description = row.getCell(8).text?.trim() || null;

                // Validate required fields
                if (!title || !clientPhone) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNum,
                        error: 'عنوان القضية ورقم هاتف العميل مطلوبين'
                    });
                    continue;
                }

                // Find client by phone
                const client = await this.prisma.client.findFirst({
                    where: { tenantId, phone: clientPhone },
                });

                if (!client) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNum,
                        error: `العميل غير موجود: ${clientPhone}`
                    });
                    continue;
                }

                // Generate case number
                const lastCase = await this.prisma.case.findFirst({
                    where: { tenantId },
                    orderBy: { createdAt: 'desc' },
                });

                const currentYear = new Date().getFullYear();
                const lastNumber = lastCase?.caseNumber
                    ? parseInt(lastCase.caseNumber.split('-')[1]) || 0
                    : 0;
                const caseNumber = `${currentYear}-${String(lastNumber + 1).padStart(4, '0')}`;

                // Create case
                await this.prisma.case.create({
                    data: {
                        caseNumber,
                        title,
                        description,
                        caseType: typeMap[caseTypeAr] || 'OTHER',
                        status: 'OPEN' as CaseStatus,
                        courtName,
                        courtCaseNumber,
                        opposingParty,
                        priority: priorityMap[priorityAr] || 'MEDIUM',
                        clientId: client.id,
                        tenantId,
                        createdById: userId,
                    },
                });

                result.imported++;
            } catch (error: any) {
                result.errors.push({
                    row: rowNum,
                    error: error.message || 'خطأ غير معروف'
                });
            }
        }

        return result;
    }

    /**
     * Generate sample template for clients import
     */
    async getClientsTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('العملاء');

        // RTL support
        worksheet.views = [{ rightToLeft: true }];

        worksheet.columns = [
            { header: 'الاسم *', key: 'name', width: 25 },
            { header: 'رقم الهاتف *', key: 'phone', width: 15 },
            { header: 'البريد الإلكتروني', key: 'email', width: 25 },
            { header: 'رقم الهوية', key: 'nationalId', width: 15 },
            { header: 'اسم الشركة', key: 'companyName', width: 25 },
            { header: 'العنوان', key: 'address', width: 30 },
            { header: 'المدينة', key: 'city', width: 15 },
            { header: 'ملاحظات', key: 'notes', width: 30 },
        ];

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' },
        };
        headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Add sample row
        worksheet.addRow({
            name: 'محمد أحمد',
            phone: '0501234567',
            email: 'mohammed@example.com',
            nationalId: '1234567890',
            companyName: '',
            address: 'الرياض، حي العليا',
            city: 'الرياض',
            notes: 'عميل VIP',
        });

        return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    }

    /**
     * Generate sample template for cases import
     */
    async getCasesTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('القضايا');

        worksheet.views = [{ rightToLeft: true }];

        worksheet.columns = [
            { header: 'عنوان القضية *', key: 'title', width: 30 },
            { header: 'رقم هاتف العميل *', key: 'clientPhone', width: 15 },
            { header: 'نوع القضية', key: 'caseType', width: 15 },
            { header: 'اسم المحكمة', key: 'courtName', width: 25 },
            { header: 'رقم القضية بالمحكمة', key: 'courtCaseNumber', width: 20 },
            { header: 'الخصم', key: 'opposingParty', width: 25 },
            { header: 'الأولوية', key: 'priority', width: 12 },
            { header: 'الوصف', key: 'description', width: 40 },
        ];

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' },
        };
        headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Add sample row
        worksheet.addRow({
            title: 'دعوى مطالبة مالية',
            clientPhone: '0501234567',
            caseType: 'تجاري',
            courtName: 'المحكمة التجارية بالرياض',
            courtCaseNumber: '12345/2025',
            opposingParty: 'شركة XYZ',
            priority: 'عالية',
            description: 'مطالبة بمبلغ 100,000 ريال',
        });

        // Add note about case types and priorities
        worksheet.getCell('J1').value = 'أنواع القضايا المتاحة:';
        worksheet.getCell('J2').value = 'جنائي، مدني، تجاري، عمالي، أسري، إداري، عقاري، أخرى';
        worksheet.getCell('J4').value = 'الأولويات المتاحة:';
        worksheet.getCell('J5').value = 'عالية، متوسطة، منخفضة';

        return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    }
}
