import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UserRole, InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

export interface CreateInvitationDto {
    email: string;
    role?: UserRole;
}

export interface AcceptInvitationDto {
    token: string;
    name: string;
    password: string;
    phone?: string;
}

@Injectable()
export class UserInvitationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Create and send invitation
     */
    async create(dto: CreateInvitationDto, tenantId: string, inviterId: string) {
        const { email, role = UserRole.LAWYER } = dto;

        // Prevent inviting as OWNER
        if (role === UserRole.OWNER) {
            throw new ForbiddenException('لا يمكن دعوة مستخدم بدور مالك');
        }

        // Check if email already exists as a user
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('البريد الإلكتروني مسجل بالفعل كمستخدم');
        }

        // Check if there's already a pending invitation for this email in this tenant
        const existingInvitation = await this.prisma.userInvitation.findFirst({
            where: {
                email,
                tenantId,
                status: InvitationStatus.PENDING,
            },
        });

        if (existingInvitation) {
            throw new ConflictException('توجد دعوة معلقة لهذا البريد الإلكتروني');
        }

        // Generate unique token
        const token = randomBytes(32).toString('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const invitation = await this.prisma.userInvitation.create({
            data: {
                email,
                role,
                token,
                expiresAt,
                inviterId,
                tenantId,
            },
            include: {
                inviter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Send invitation email
        try {
            await this.emailService.sendInvitation({
                to: email,
                inviterName: invitation.inviter.name,
                tenantName: invitation.tenant.name,
                role: invitation.role,
                token,
                tenantId,
            });
        } catch (error) {
            // Log but don't fail the invitation creation
            console.error('Failed to send invitation email:', error);
        }

        return {
            data: invitation,
            message: 'تم إرسال الدعوة بنجاح',
        };
    }

    /**
     * Get all invitations for tenant
     */
    async findAll(tenantId: string, status?: InvitationStatus) {
        const where: any = { tenantId };

        if (status) {
            where.status = status;
        }

        const invitations = await this.prisma.userInvitation.findMany({
            where,
            include: {
                inviter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                acceptedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { data: invitations };
    }

    /**
     * Get invitation by token (public)
     */
    async findByToken(token: string) {
        const invitation = await this.prisma.userInvitation.findUnique({
            where: { token },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new NotFoundException('الدعوة غير موجودة');
        }

        // Check if expired
        if (invitation.status === InvitationStatus.PENDING && new Date() > invitation.expiresAt) {
            // Update status to expired
            await this.prisma.userInvitation.update({
                where: { id: invitation.id },
                data: { status: InvitationStatus.EXPIRED },
            });
            invitation.status = InvitationStatus.EXPIRED;
        }

        return { data: invitation };
    }

    /**
     * Accept invitation and create user (public)
     */
    async accept(dto: AcceptInvitationDto) {
        const { token, name, password, phone } = dto;

        // Find invitation
        const invitation = await this.prisma.userInvitation.findUnique({
            where: { token },
            include: {
                tenant: true,
            },
        });

        if (!invitation) {
            throw new NotFoundException('الدعوة غير موجودة');
        }

        // Check status
        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException(
                invitation.status === InvitationStatus.ACCEPTED
                    ? 'تم قبول هذه الدعوة مسبقاً'
                    : invitation.status === InvitationStatus.EXPIRED
                        ? 'انتهت صلاحية هذه الدعوة'
                        : 'تم إلغاء هذه الدعوة'
            );
        }

        // Check if expired
        if (new Date() > invitation.expiresAt) {
            await this.prisma.userInvitation.update({
                where: { id: invitation.id },
                data: { status: InvitationStatus.EXPIRED },
            });
            throw new BadRequestException('انتهت صلاحية هذه الدعوة');
        }

        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: invitation.email },
        });

        if (existingUser) {
            throw new ConflictException('البريد الإلكتروني مسجل بالفعل');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and update invitation in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: invitation.email,
                    name,
                    password: hashedPassword,
                    phone,
                    role: invitation.role,
                    tenantId: invitation.tenantId,
                    isActive: true,
                    isVerified: true,
                    createdById: invitation.inviterId,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    tenantId: true,
                },
            });

            // Update invitation
            await tx.userInvitation.update({
                where: { id: invitation.id },
                data: {
                    status: InvitationStatus.ACCEPTED,
                    acceptedAt: new Date(),
                    acceptedUserId: user.id,
                },
            });

            return user;
        });

        return {
            data: result,
            message: 'تم قبول الدعوة وإنشاء الحساب بنجاح',
        };
    }

    /**
     * Cancel invitation
     */
    async cancel(id: string, tenantId: string) {
        const invitation = await this.prisma.userInvitation.findFirst({
            where: { id, tenantId },
        });

        if (!invitation) {
            throw new NotFoundException('الدعوة غير موجودة');
        }

        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException('لا يمكن إلغاء هذه الدعوة');
        }

        await this.prisma.userInvitation.update({
            where: { id },
            data: { status: InvitationStatus.CANCELLED },
        });

        return { message: 'تم إلغاء الدعوة بنجاح' };
    }

    /**
     * Resend invitation (generates new token and extends expiry)
     */
    async resend(id: string, tenantId: string) {
        const invitation = await this.prisma.userInvitation.findFirst({
            where: { id, tenantId },
        });

        if (!invitation) {
            throw new NotFoundException('الدعوة غير موجودة');
        }

        if (invitation.status === InvitationStatus.ACCEPTED) {
            throw new BadRequestException('تم قبول هذه الدعوة مسبقاً');
        }

        // Generate new token
        const token = randomBytes(32).toString('hex');

        // Set new expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const updated = await this.prisma.userInvitation.update({
            where: { id },
            data: {
                token,
                expiresAt,
                status: InvitationStatus.PENDING,
            },
            include: {
                inviter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Resend invitation email
        try {
            await this.emailService.sendInvitation({
                to: updated.email,
                inviterName: updated.inviter.name,
                tenantName: updated.tenant.name,
                role: updated.role,
                token,
                tenantId,
            });
        } catch (error) {
            console.error('Failed to resend invitation email:', error);
        }

        return {
            data: updated,
            message: 'تم إعادة إرسال الدعوة بنجاح',
        };
    }

    /**
     * Get invitation stats for dashboard
     */
    async getStats(tenantId: string) {
        const [pending, accepted, expired, cancelled] = await Promise.all([
            this.prisma.userInvitation.count({
                where: { tenantId, status: InvitationStatus.PENDING },
            }),
            this.prisma.userInvitation.count({
                where: { tenantId, status: InvitationStatus.ACCEPTED },
            }),
            this.prisma.userInvitation.count({
                where: { tenantId, status: InvitationStatus.EXPIRED },
            }),
            this.prisma.userInvitation.count({
                where: { tenantId, status: InvitationStatus.CANCELLED },
            }),
        ]);

        return {
            data: {
                pending,
                accepted,
                expired,
                cancelled,
                total: pending + accepted + expired + cancelled,
            },
        };
    }
}
