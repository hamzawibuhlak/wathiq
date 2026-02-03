import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        // Create reusable transporter
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    /**
     * Send hearing reminder email to client
     */
    async sendHearingReminder(data: {
        to: string;
        clientName: string;
        hearingDate: Date;
        courtName: string;
        caseTitle: string;
        caseNumber: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const formattedDate = new Intl.DateTimeFormat('ar-SA', {
                dateStyle: 'full',
                timeStyle: 'short',
            }).format(new Date(data.hearingDate));

            const mailOptions = {
                from: this.configService.get('SMTP_FROM', 'noreply@watheeq.sa'),
                to: data.to,
                subject: `تذكير بجلسة قضائية - ${data.caseTitle}`,
                html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
                line-height: 1.8; 
                color: #1f2937;
                background: #f3f4f6;
                margin: 0;
                padding: 20px;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                color: white; 
                padding: 30px; 
                text-align: center;
              }
              .header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content { 
                padding: 30px;
              }
              .greeting {
                font-size: 18px;
                margin-bottom: 20px;
              }
              .info-card { 
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .info-row { 
                display: flex;
                align-items: flex-start;
                margin: 12px 0;
                padding-bottom: 12px;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
                padding-bottom: 0;
                margin-bottom: 0;
              }
              .icon {
                font-size: 20px;
                margin-left: 12px;
                min-width: 24px;
              }
              .info-content {
                flex: 1;
              }
              .label { 
                font-weight: 600; 
                color: #6b7280;
                font-size: 13px;
                margin-bottom: 4px;
              }
              .value { 
                color: #111827;
                font-size: 15px;
                font-weight: 500;
              }
              .cta {
                text-align: center;
                margin: 30px 0;
              }
              .cta-text {
                color: #4b5563;
                font-size: 15px;
              }
              .footer { 
                background: #f9fafb;
                text-align: center; 
                padding: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .footer p {
                margin: 0;
                color: #6b7280; 
                font-size: 13px;
              }
              .logo {
                font-size: 20px;
                font-weight: 700;
                color: #2563eb;
                margin-bottom: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔔 تذكير بجلسة قضائية</h2>
              </div>
              <div class="content">
                <p class="greeting">عزيزي/عزيزتي <strong>${data.clientName}</strong>،</p>
                <p>نود تذكيركم بموعد جلستكم القضائية القادمة:</p>
                
                <div class="info-card">
                  <div class="info-row">
                    <span class="icon">📋</span>
                    <div class="info-content">
                      <div class="label">القضية</div>
                      <div class="value">${data.caseTitle}</div>
                      <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">رقم: ${data.caseNumber}</div>
                    </div>
                  </div>
                  
                  <div class="info-row">
                    <span class="icon">📅</span>
                    <div class="info-content">
                      <div class="label">التاريخ والوقت</div>
                      <div class="value">${formattedDate}</div>
                    </div>
                  </div>
                  
                  <div class="info-row">
                    <span class="icon">🏛️</span>
                    <div class="info-content">
                      <div class="label">المحكمة</div>
                      <div class="value">${data.courtName || 'سيتم تحديدها'}</div>
                    </div>
                  </div>
                </div>

                <div class="cta">
                  <p class="cta-text">يرجى الحضور في الموعد المحدد وإحضار جميع المستندات المطلوبة.</p>
                </div>

                <p style="margin-top: 30px;">مع تحيات فريق المكتب</p>
              </div>
              <div class="footer">
                <div class="logo">⚖️ وثيق</div>
                <p>هذا إشعار تلقائي من نظام وثيق لإدارة مكاتب المحاماة</p>
              </div>
            </div>
          </body>
          </html>
        `,
            };

            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Hearing reminder sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send hearing reminder:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send invoice email to client
     */
    async sendInvoiceEmail(data: {
        to: string;
        clientName: string;
        invoiceNumber: string;
        amount: number;
        dueDate: Date;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const formattedDueDate = new Intl.DateTimeFormat('ar-SA', {
                dateStyle: 'long',
            }).format(new Date(data.dueDate));

            const mailOptions = {
                from: this.configService.get('SMTP_FROM', 'noreply@watheeq.sa'),
                to: data.to,
                subject: `فاتورة جديدة - ${data.invoiceNumber}`,
                html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .amount { font-size: 28px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>💰 فاتورة جديدة</h2>
              </div>
              <div class="content">
                <p>عزيزي/عزيزتي ${data.clientName}،</p>
                <p>تم إصدار فاتورة جديدة باسمكم:</p>
                
                <p><strong>رقم الفاتورة:</strong> ${data.invoiceNumber}</p>
                <div class="amount">${data.amount.toLocaleString('ar-SA')} ر.س</div>
                <p><strong>تاريخ الاستحقاق:</strong> ${formattedDueDate}</p>
                
                <p style="margin-top: 20px;">يرجى سداد المبلغ قبل تاريخ الاستحقاق.</p>
              </div>
              <div class="footer">
                <p>نظام وثيق لإدارة مكاتب المحاماة</p>
              </div>
            </div>
          </body>
          </html>
        `,
            };

            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Invoice email sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send invoice email:', error);
            return { success: false, error: error.message };
        }
    }
}
