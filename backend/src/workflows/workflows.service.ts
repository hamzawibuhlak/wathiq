import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowTrigger, ExecutionStatus, Prisma } from '@prisma/client';

export interface WorkflowAction {
    type: 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'SEND_EMAIL' | 'SEND_WHATSAPP' | 'UPDATE_STATUS';
    config: Record<string, any>;
}

@Injectable()
export class WorkflowsService {
    private readonly logger = new Logger(WorkflowsService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get all workflows for a tenant
     */
    async findAll(tenantId: string) {
        const workflows = await this.prisma.workflow.findMany({
            where: { tenantId },
            include: {
                _count: { select: { executions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { data: workflows };
    }

    /**
     * Get workflow by ID
     */
    async findOne(id: string, tenantId: string) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, tenantId },
            include: {
                executions: {
                    orderBy: { startedAt: 'desc' },
                    take: 20,
                },
            },
        });

        if (!workflow) {
            throw new NotFoundException('سير العمل غير موجود');
        }

        return { data: workflow };
    }

    /**
     * Create new workflow
     */
    async create(dto: CreateWorkflowDto, tenantId: string) {
        const workflow = await this.prisma.workflow.create({
            data: {
                name: dto.name,
                description: dto.description,
                triggerType: dto.triggerType,
                triggerConfig: (dto.triggerConfig || {}) as Prisma.InputJsonValue,
                actions: dto.actions as unknown as Prisma.InputJsonValue,
                isActive: dto.isActive ?? true,
                tenant: { connect: { id: tenantId } },
            },
        });

        return {
            data: workflow,
            message: 'تم إنشاء سير العمل بنجاح',
        };
    }

    /**
     * Update workflow
     */
    async update(id: string, dto: UpdateWorkflowDto, tenantId: string) {
        const existing = await this.prisma.workflow.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new NotFoundException('سير العمل غير موجود');
        }

        const workflow = await this.prisma.workflow.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                triggerType: dto.triggerType,
                triggerConfig: dto.triggerConfig as Prisma.InputJsonValue,
                actions: dto.actions as unknown as Prisma.InputJsonValue,
                isActive: dto.isActive,
            },
        });

        return {
            data: workflow,
            message: 'تم تحديث سير العمل بنجاح',
        };
    }

    /**
     * Delete workflow
     */
    async remove(id: string, tenantId: string) {
        const existing = await this.prisma.workflow.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new NotFoundException('سير العمل غير موجود');
        }

        await this.prisma.workflow.delete({ where: { id } });

        return { message: 'تم حذف سير العمل بنجاح' };
    }

    /**
     * Toggle workflow active state
     */
    async toggleActive(id: string, tenantId: string) {
        const existing = await this.prisma.workflow.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new NotFoundException('سير العمل غير موجود');
        }

        const workflow = await this.prisma.workflow.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });

        return {
            data: workflow,
            message: workflow.isActive ? 'تم تفعيل سير العمل' : 'تم إيقاف سير العمل',
        };
    }

    /**
     * Trigger workflows by event type
     */
    async triggerWorkflows(
        triggerType: WorkflowTrigger,
        tenantId: string,
        triggerData: Record<string, any>,
    ) {
        // Find all active workflows for this trigger
        const workflows = await this.prisma.workflow.findMany({
            where: {
                tenantId,
                triggerType,
                isActive: true,
            },
        });

        for (const workflow of workflows) {
            await this.executeWorkflow(workflow.id, triggerData);
        }

        return { count: workflows.length };
    }

    /**
     * Execute a specific workflow
     */
    async executeWorkflow(workflowId: string, triggerData: Record<string, any>) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
        });

        if (!workflow) {
            this.logger.error(`Workflow ${workflowId} not found`);
            return;
        }

        // Create execution record
        const execution = await this.prisma.workflowExecution.create({
            data: {
                workflow: { connect: { id: workflowId } },
                status: ExecutionStatus.RUNNING,
                triggerData: triggerData as Prisma.InputJsonValue,
            },
        });

        try {
            const actions = workflow.actions as unknown as WorkflowAction[];
            const results: any[] = [];

            for (const action of actions) {
                const result = await this.executeAction(action, triggerData, workflow.tenantId);
                results.push(result);
            }

            // Mark as completed
            await this.prisma.workflowExecution.update({
                where: { id: execution.id },
                data: {
                    status: ExecutionStatus.COMPLETED,
                    result: results as unknown as Prisma.InputJsonValue,
                    completedAt: new Date(),
                },
            });

            this.logger.log(`Workflow ${workflowId} executed successfully`);
        } catch (error) {
            // Mark as failed
            await this.prisma.workflowExecution.update({
                where: { id: execution.id },
                data: {
                    status: ExecutionStatus.FAILED,
                    error: error.message,
                    completedAt: new Date(),
                },
            });

            this.logger.error(`Workflow ${workflowId} failed: ${error.message}`);
        }
    }

    /**
     * Execute a single action
     */
    private async executeAction(
        action: WorkflowAction,
        triggerData: Record<string, any>,
        tenantId: string,
    ): Promise<any> {
        switch (action.type) {
            case 'CREATE_TASK':
                return this.executeCreateTask(action.config, triggerData, tenantId);
            case 'SEND_NOTIFICATION':
                return this.executeSendNotification(action.config, triggerData, tenantId);
            case 'SEND_EMAIL':
                return this.executeSendEmail(action.config, triggerData, tenantId);
            case 'SEND_WHATSAPP':
                return this.executeSendWhatsApp(action.config, triggerData, tenantId);
            case 'UPDATE_STATUS':
                return this.executeUpdateStatus(action.config, triggerData, tenantId);
            default:
                this.logger.warn(`Unknown action type: ${action.type}`);
                return { success: false, message: 'Unknown action type' };
        }
    }

    private async executeCreateTask(
        config: Record<string, any>,
        triggerData: Record<string, any>,
        tenantId: string,
    ) {
        const task = await this.prisma.task.create({
            data: {
                title: this.interpolate(config.title, triggerData),
                description: this.interpolate(config.description, triggerData),
                priority: config.priority || 'MEDIUM',
                dueDate: config.dueDays ? new Date(Date.now() + config.dueDays * 24 * 60 * 60 * 1000) : undefined,
                tenant: { connect: { id: tenantId } },
                assignedTo: { connect: { id: config.assignedToId || triggerData.userId } },
                createdBy: { connect: { id: triggerData.userId || config.assignedToId } },
                case: triggerData.caseId ? { connect: { id: triggerData.caseId } } : undefined,
                hearing: triggerData.hearingId ? { connect: { id: triggerData.hearingId } } : undefined,
            },
        });

        return { success: true, taskId: task.id };
    }

    private async executeSendNotification(
        config: Record<string, any>,
        triggerData: Record<string, any>,
        tenantId: string,
    ) {
        const notification = await this.prisma.notification.create({
            data: {
                title: this.interpolate(config.title, triggerData),
                message: this.interpolate(config.message, triggerData),
                type: config.type || 'INFO',
                link: config.link,
                user: { connect: { id: config.userId || triggerData.userId } },
                tenant: { connect: { id: tenantId } },
            },
        });

        return { success: true, notificationId: notification.id };
    }

    private async executeSendEmail(
        config: Record<string, any>,
        triggerData: Record<string, any>,
        tenantId: string,
    ) {
        // Email sending would be implemented here using the email service
        this.logger.log(`Would send email to ${config.to} with subject: ${config.subject}`);
        return { success: true, message: 'Email queued' };
    }

    private async executeSendWhatsApp(
        config: Record<string, any>,
        triggerData: Record<string, any>,
        tenantId: string,
    ) {
        // WhatsApp sending would be implemented here using the WhatsApp service
        this.logger.log(`Would send WhatsApp to ${config.to} with message: ${config.message}`);
        return { success: true, message: 'WhatsApp message queued' };
    }

    private async executeUpdateStatus(
        config: Record<string, any>,
        triggerData: Record<string, any>,
        tenantId: string,
    ) {
        const { entityType, entityId, newStatus } = config;

        switch (entityType) {
            case 'Case':
                await this.prisma.case.update({
                    where: { id: entityId || triggerData.caseId },
                    data: { status: newStatus },
                });
                break;
            case 'Task':
                await this.prisma.task.update({
                    where: { id: entityId || triggerData.taskId },
                    data: { status: newStatus },
                });
                break;
        }

        return { success: true, message: 'Status updated' };
    }

    /**
     * Simple template interpolation
     */
    private interpolate(template: string, data: Record<string, any>): string {
        if (!template) return '';
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
    }

    /**
     * Get execution history for a workflow
     */
    async getExecutionHistory(workflowId: string, tenantId: string) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id: workflowId, tenantId },
        });

        if (!workflow) {
            throw new NotFoundException('سير العمل غير موجود');
        }

        const executions = await this.prisma.workflowExecution.findMany({
            where: { workflowId },
            orderBy: { startedAt: 'desc' },
            take: 50,
        });

        return { data: executions };
    }

    /**
     * Get available triggers
     */
    getAvailableTriggers() {
        return {
            data: [
                { type: 'CASE_CREATED', label: 'عند إنشاء قضية جديدة', icon: 'briefcase' },
                { type: 'CASE_STATUS_CHANGED', label: 'عند تغيير حالة القضية', icon: 'refresh' },
                { type: 'HEARING_SCHEDULED', label: 'عند جدولة جلسة', icon: 'calendar' },
                { type: 'HEARING_REMINDER', label: 'تذكير بموعد الجلسة', icon: 'bell' },
                { type: 'TASK_OVERDUE', label: 'عند تأخر المهمة', icon: 'clock' },
                { type: 'DOCUMENT_UPLOADED', label: 'عند رفع مستند', icon: 'file' },
                { type: 'INVOICE_CREATED', label: 'عند إنشاء فاتورة', icon: 'receipt' },
                { type: 'INVOICE_OVERDUE', label: 'عند تأخر الفاتورة', icon: 'alert' },
                { type: 'CLIENT_CREATED', label: 'عند إضافة عميل جديد', icon: 'user' },
                { type: 'MANUAL', label: 'تشغيل يدوي', icon: 'play' },
            ],
        };
    }

    /**
     * Get available actions
     */
    getAvailableActions() {
        return {
            data: [
                {
                    type: 'CREATE_TASK',
                    label: 'إنشاء مهمة',
                    icon: 'check-square',
                    config: ['title', 'description', 'priority', 'assignedToId', 'dueDays'],
                },
                {
                    type: 'SEND_NOTIFICATION',
                    label: 'إرسال إشعار',
                    icon: 'bell',
                    config: ['title', 'message', 'type', 'userId'],
                },
                {
                    type: 'SEND_EMAIL',
                    label: 'إرسال بريد إلكتروني',
                    icon: 'mail',
                    config: ['to', 'subject', 'body', 'templateId'],
                },
                {
                    type: 'SEND_WHATSAPP',
                    label: 'إرسال واتساب',
                    icon: 'message-circle',
                    config: ['to', 'message', 'templateId'],
                },
                {
                    type: 'UPDATE_STATUS',
                    label: 'تحديث الحالة',
                    icon: 'refresh',
                    config: ['entityType', 'newStatus'],
                },
            ],
        };
    }

    /**
     * Manually trigger a workflow
     */
    async manualTrigger(workflowId: string, tenantId: string, triggerData: Record<string, any>) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id: workflowId, tenantId },
        });

        if (!workflow) {
            throw new NotFoundException('سير العمل غير موجود');
        }

        await this.executeWorkflow(workflowId, triggerData);

        return { message: 'تم تشغيل سير العمل بنجاح' };
    }
}
