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
import { UserRole, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع المهام مع pagination و filters' })
    @ApiResponse({ status: 200, description: 'قائمة المهام' })
    async findAll(
        @TenantId() tenantId: string,
        @Query() filterDto: FilterTasksDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.tasksService.findAll(tenantId, filterDto, userId, userRole);
    }

    @Get('stats')
    @ApiOperation({ summary: 'إحصائيات المهام' })
    @ApiResponse({ status: 200, description: 'إحصائيات المهام' })
    async getStats(
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.tasksService.getStats(tenantId, userId, userRole);
    }

    @Get('my')
    @ApiOperation({ summary: 'الحصول على مهامي' })
    @ApiResponse({ status: 200, description: 'قائمة مهامي' })
    async getMyTasks(
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @Query() filterDto: FilterTasksDto,
    ) {
        return this.tasksService.getMyTasks(tenantId, userId, filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على تفاصيل مهمة واحدة' })
    @ApiResponse({ status: 200, description: 'تفاصيل المهمة' })
    @ApiResponse({ status: 404, description: 'المهمة غير موجودة' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.tasksService.findOne(id, tenantId, userId, userRole);
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER, UserRole.SECRETARY)
    @ApiOperation({ summary: 'إنشاء مهمة جديدة' })
    @ApiResponse({ status: 201, description: 'تم إنشاء المهمة بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createTaskDto: CreateTaskDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.tasksService.create(createTaskDto, tenantId, userId);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER, UserRole.SECRETARY)
    @ApiOperation({ summary: 'تعديل مهمة' })
    @ApiResponse({ status: 200, description: 'تم تحديث المهمة بنجاح' })
    @ApiResponse({ status: 404, description: 'المهمة غير موجودة' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.tasksService.update(id, updateTaskDto, tenantId, userId, userRole);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'حذف مهمة' })
    @ApiResponse({ status: 200, description: 'تم حذف المهمة بنجاح' })
    @ApiResponse({ status: 404, description: 'المهمة غير موجودة' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.tasksService.remove(id, tenantId, userId, userRole);
    }

    @Post(':id/comments')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER, UserRole.SECRETARY)
    @ApiOperation({ summary: 'إضافة تعليق على المهمة' })
    @ApiResponse({ status: 201, description: 'تم إضافة التعليق بنجاح' })
    async addComment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() createCommentDto: CreateCommentDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.tasksService.addComment(id, createCommentDto, tenantId, userId);
    }

    @Delete('comments/:commentId')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER, UserRole.SECRETARY)
    @ApiOperation({ summary: 'حذف تعليق' })
    @ApiResponse({ status: 200, description: 'تم حذف التعليق بنجاح' })
    async removeComment(
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.tasksService.removeComment(commentId, tenantId, userId, userRole);
    }

    @Patch('bulk/status')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تحديث حالة عدة مهام' })
    @ApiResponse({ status: 200, description: 'تم تحديث المهام بنجاح' })
    async bulkUpdateStatus(
        @Body() body: { ids: string[]; status: TaskStatus },
        @TenantId() tenantId: string,
    ) {
        return this.tasksService.bulkUpdateStatus(body.ids, body.status, tenantId);
    }

    @Delete('bulk/delete')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف عدة مهام' })
    @ApiResponse({ status: 200, description: 'تم حذف المهام بنجاح' })
    async bulkDelete(
        @Body() body: { ids: string[] },
        @TenantId() tenantId: string,
    ) {
        return this.tasksService.bulkDelete(body.ids, tenantId);
    }
}
