import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ClientPortalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Enable portal access for client
   */
  async enablePortalAccess(clientId: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) throw new NotFoundException('العميل غير موجود');

    if (!client.email) {
      throw new Error('لا يمكن تفعيل البوابة بدون بريد إلكتروني');
    }

    // Generate random password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update client
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        portalAccessEnabled: true,
        portalPassword: hashedPassword,
      },
    });

    // Send email with credentials
    try {
      await this.emailService.sendEmail({
        to: client.email,
        subject: 'تفعيل حسابك في بوابة العملاء',
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>مرحباً ${client.name}</h2>
            <p>تم تفعيل حسابك في بوابة العملاء.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>رقم الهاتف:</strong> ${client.phone}</p>
              <p><strong>كلمة المرور المؤقتة:</strong> ${temporaryPassword}</p>
            </div>
            
            <p>يرجى تغيير كلمة المرور بعد أول تسجيل دخول.</p>
            
            <a href="${process.env.CLIENT_PORTAL_URL || 'https://bewathiq.com/portal/login'}"
               style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; margin-top: 15px;">
              تسجيل الدخول إلى البوابة
            </a>
          </div>
        `,
        tenantId,
      });
    } catch (e) {
      // Email failed but portal is enabled
    }

    return { 
      message: 'تم تفعيل البوابة',
      temporaryPassword, // Return for display in admin panel
    };
  }

  /**
   * Disable portal access for client
   */
  async disablePortalAccess(clientId: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) throw new NotFoundException('العميل غير موجود');

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        portalAccessEnabled: false,
        portalPassword: null,
        portalLoginToken: null,
      },
    });

    return { message: 'تم تعطيل البوابة' };
  }

  /**
   * Client login
   */
  async login(phone: string, password: string) {
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '').replace(/^966/, '0');

    const client = await this.prisma.client.findFirst({
      where: {
        phone: { contains: cleanPhone.slice(-9) },
        portalAccessEnabled: true,
      },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    if (!client || !client.portalPassword) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      client.portalPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    // Update last login
    await this.prisma.client.update({
      where: { id: client.id },
      data: { lastPortalLogin: new Date() },
    });

    // Generate JWT
    const token = this.jwtService.sign({
      clientId: client.id,
      tenantId: client.tenantId,
      type: 'client-portal',
    });

    return {
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
      },
      tenant: client.tenant,
    };
  }

  /**
   * Change password
   */
  async changePassword(
    clientId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || !client.portalPassword) {
      throw new NotFoundException('العميل غير موجود');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      client.portalPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.client.update({
      where: { id: clientId },
      data: { portalPassword: hashedNewPassword },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * Get client's cases
   */
  async getMyCases(clientId: string, tenantId: string) {
    const cases = await this.prisma.case.findMany({
      where: { clientId, tenantId },
      include: {
        assignedTo: {
          select: { name: true, email: true, phone: true },
        },
        _count: {
          select: { hearings: true, documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cases;
  }

  /**
   * Get case details
   */
  async getCaseDetails(caseId: string, clientId: string, tenantId: string) {
    const caseData = await this.prisma.case.findFirst({
      where: { id: caseId, clientId, tenantId },
      include: {
        assignedTo: {
          select: { name: true, email: true, phone: true },
        },
        hearings: {
          orderBy: { hearingDate: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseData) throw new NotFoundException('القضية غير موجودة');

    return caseData;
  }

  /**
   * Get client's invoices
   */
  async getMyInvoices(clientId: string, tenantId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { clientId, tenantId },
      include: {
        case: {
          select: { caseNumber: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices;
  }

  /**
   * Get invoice details
   */
  async getInvoiceDetails(
    invoiceId: string,
    clientId: string,
    tenantId: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, clientId, tenantId },
      include: {
        case: {
          select: { caseNumber: true, title: true },
        },
        items: true,
      },
    });

    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');

    return invoice;
  }

  /**
   * Get client's documents
   */
  async getMyDocuments(clientId: string, tenantId: string, caseId?: string) {
    const where: any = {
      case: { clientId },
      tenantId,
    };

    if (caseId) where.caseId = caseId;

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        case: {
          select: { caseNumber: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  /**
   * Get client profile
   */
  async getProfile(clientId: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        nationalId: true,
        companyName: true,
        address: true,
        city: true,
        createdAt: true,
        lastPortalLogin: true,
        _count: {
          select: {
            cases: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) throw new NotFoundException('العميل غير موجود');

    return client;
  }

  /**
   * Get client dashboard stats
   */
  async getDashboardStats(clientId: string, tenantId: string) {
    const [
      totalCases,
      activeCases,
      totalInvoices,
      pendingInvoices,
      upcomingHearings,
    ] = await Promise.all([
      this.prisma.case.count({ where: { clientId, tenantId } }),
      this.prisma.case.count({
        where: { clientId, tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.invoice.count({ where: { clientId, tenantId } }),
      this.prisma.invoice.count({
        where: { clientId, tenantId, status: { in: ['PENDING', 'SENT', 'OVERDUE'] } },
      }),
      this.prisma.hearing.count({
        where: {
          case: { clientId },
          tenantId,
          hearingDate: { gte: new Date() },
          status: { in: ['SCHEDULED', 'POSTPONED'] },
        },
      }),
    ]);

    // Get pending amount
    const pendingAmount = await this.prisma.invoice.aggregate({
      where: { clientId, tenantId, status: { in: ['PENDING', 'SENT', 'OVERDUE'] } },
      _sum: { totalAmount: true },
    });

    return {
      totalCases,
      activeCases,
      totalInvoices,
      pendingInvoices,
      upcomingHearings,
      pendingAmount: Number(pendingAmount._sum.totalAmount) || 0,
    };
  }

  /**
   * Get upcoming hearings
   */
  async getUpcomingHearings(clientId: string, tenantId: string) {
    const hearings = await this.prisma.hearing.findMany({
      where: {
        OR: [
          { clientId },
          { case: { clientId } },
        ],
        tenantId,
        hearingDate: { gte: new Date() },
        status: { in: ['SCHEDULED', 'POSTPONED'] },
      },
      include: {
        case: {
          select: { caseNumber: true, title: true },
        },
      },
      orderBy: { hearingDate: 'asc' },
      take: 10,
    });

    return hearings;
  }
}
