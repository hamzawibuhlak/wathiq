import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Workflows')
@ApiBearerAuth('JWT-auth')
@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN) // Only admin can manage workflows
export class WorkflowsController {
    constructor(private readonly workflowsService: WorkflowsService) {}

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع سيرات العمل' })
    @ApiResponse({ status: 200, description: 'قائمة سيرات العمل' })
    async findAll() {
        return this.workflowsService.findAll();
    }

    @Get('triggers')
    @ApiOperation({ summary: 'الحصول على المحفزات المتاحة' })
    async getAvailableTriggers() {
        return this.workflowsService.getAvailableTriggers();
    }

    @Get('actions')
    @ApiOperation({ summary: 'الحصول على الإجراءات المتاحة' })
    async getAvailableActions() {
        return this.workflowsService.getAvailableActions();
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على تفاصيل سير عمل واحد' })
    @ApiResponse({ status: 200, description: 'تفاصيل سير العمل' })
    @ApiResponse({ status: 404, description: 'سير العمل غير موجود' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.workflowsService.findOne(id);
    }

    @Get(':id/executions')
    @ApiOperation({ summary: 'الحصول على سجل تنفيذ سير العمل' })
    async getExecutionHistory(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.workflowsService.getExecutionHistory(id);
    }

    @Post()
    @ApiOperation({ summary: 'إنشاء سير عمل جديد' })
    @ApiResponse({ status: 201, description: 'تم إنشاء سير العمل بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createWorkflowDto: CreateWorkflowDto,

    ) {
        return this.workflowsService.create(createWorkflowDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'تعديل سير عمل' })
    @ApiResponse({ status: 200, description: 'تم تحديث سير العمل بنجاح' })
    @ApiResponse({ status: 404, description: 'سير العمل غير موجود' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateWorkflowDto: UpdateWorkflowDto,

    ) {
        return this.workflowsService.update(id, updateWorkflowDto);
    }

    @Patch(':id/toggle')
    @ApiOperation({ summary: 'تفعيل/إيقاف سير العمل' })
    @ApiResponse({ status: 200, description: 'تم تغيير حالة سير العمل' })
    async toggleActive(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.workflowsService.toggleActive(id);
    }

    @Post(':id/trigger')
    @ApiOperation({ summary: 'تشغيل سير العمل يدوياً' })
    @ApiResponse({ status: 200, description: 'تم تشغيل سير العمل' })
    async manualTrigger(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() triggerData: Record<string, any>,

    ) {
        return this.workflowsService.manualTrigger(id, triggerData);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'حذف سير عمل' })
    @ApiResponse({ status: 200, description: 'تم حذف سير العمل بنجاح' })
    @ApiResponse({ status: 404, description: 'سير العمل غير موجود' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,

    ) {
        return this.workflowsService.remove(id);
    }
}
