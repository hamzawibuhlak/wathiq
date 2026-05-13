import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'الحصول على جميع الفواتير مع pagination و filters' })
    @ApiResponse({ status: 200, description: 'قائمة الفواتير' })
    async findAll(

        @Query() filterDto: FilterInvoicesDto,
    ) {
        return this.invoicesService.findAll(filterDto);
    }

    @Get('stats')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إحصائيات الفواتير' })
    @ApiResponse({ status: 200, description: 'إحصائيات الفواتير' })
    async getStats() {
        return this.invoicesService.getStats();
    }

    @Get(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'الحصول على تفاصيل فاتورة' })
    @ApiResponse({ status: 200, description: 'تفاصيل الفاتورة' })
    @ApiResponse({ status: 404, description: 'الفاتورة غير موجودة' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.invoicesService.findOne(id);
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إنشاء فاتورة جديدة' })
    @ApiResponse({ status: 201, description: 'تم إنشاء الفاتورة بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createInvoiceDto: CreateInvoiceDto,

        @CurrentUser('id') userId: string,
    ) {
        return this.invoicesService.create(createInvoiceDto, userId);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تعديل فاتورة أو تغيير حالتها' })
    @ApiResponse({ status: 200, description: 'تم تحديث الفاتورة بنجاح' })
    @ApiResponse({ status: 404, description: 'الفاتورة غير موجودة' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateInvoiceDto: UpdateInvoiceDto,

    ) {
        return this.invoicesService.update(id, updateInvoiceDto);
    }

    @Patch(':id/pay')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تحديد الفاتورة كمدفوعة' })
    @ApiResponse({ status: 200, description: 'تم تحديث حالة الفاتورة' })
    @ApiResponse({ status: 404, description: 'الفاتورة غير موجودة' })
    async markAsPaid(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.invoicesService.update(id, { status: 'PAID' as any });
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف فاتورة' })
    @ApiResponse({ status: 200, description: 'تم حذف الفاتورة بنجاح' })
    @ApiResponse({ status: 404, description: 'الفاتورة غير موجودة' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.invoicesService.remove(id);
    }

    @Post(':id/send-email')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إرسال الفاتورة بالبريد الإلكتروني' })
    @ApiResponse({ status: 200, description: 'تم إرسال الفاتورة بنجاح' })
    @ApiResponse({ status: 400, description: 'العميل لا يملك بريد إلكتروني' })
    @ApiResponse({ status: 404, description: 'الفاتورة غير موجودة' })
    async sendEmail(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.invoicesService.sendEmail(id);
    }

    @Post(':id/send-sms')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إرسال رسالة SMS للعميل بخصوص الفاتورة' })
    @ApiResponse({ status: 200, description: 'تم إرسال الرسالة بنجاح' })
    @ApiResponse({ status: 400, description: 'العميل لا يملك رقم هاتف' })
    @ApiResponse({ status: 404, description: 'الفاتورة غير موجودة' })
    async sendSms(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.invoicesService.sendSms(id);
    }
}
