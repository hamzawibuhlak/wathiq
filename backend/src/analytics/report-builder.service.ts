import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface ReportField {
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'enum';
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

interface ReportFilter {
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
    value: any;
}

interface ReportConfig {
    name: string;
    entity: 'case' | 'client' | 'invoice' | 'hearing' | 'task';
    fields: ReportField[];
    filters: ReportFilter[];
    groupBy?: string[];
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
    limit?: number;
}

interface GroupItem {
    [key: string]: any;
}

@Injectable()
export class ReportBuilderService {
    constructor(private prisma: PrismaService) { }

    async buildReport(tenantId: string, config: ReportConfig) {
        // Build where clause
        const where: Record<string, any> = { tenantId };

        config.filters.forEach(filter => {
            const { field, operator, value } = filter;

            switch (operator) {
                case 'equals':
                    where[field] = value;
                    break;
                case 'contains':
                    where[field] = { contains: value, mode: 'insensitive' };
                    break;
                case 'gt':
                    where[field] = { gt: value };
                    break;
                case 'lt':
                    where[field] = { lt: value };
                    break;
                case 'gte':
                    where[field] = { gte: value };
                    break;
                case 'lte':
                    where[field] = { lte: value };
                    break;
                case 'in':
                    where[field] = { in: value };
                    break;
            }
        });

        // Build select clause
        const select: Record<string, boolean> = {};
        config.fields.forEach(field => {
            select[field.field] = true;
        });

        // Build orderBy clause
        const orderBy: Record<string, string>[] = [];
        if (config.orderBy) {
            config.orderBy.forEach(order => {
                orderBy.push({ [order.field]: order.direction });
            });
        }

        // Execute query based on entity
        let data: any[] = [];
        const queryOptions = {
            where,
            select,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take: config.limit,
        };

        switch (config.entity) {
            case 'case':
                data = await this.prisma.case.findMany(queryOptions);
                break;
            case 'client':
                data = await this.prisma.client.findMany(queryOptions);
                break;
            case 'invoice':
                data = await this.prisma.invoice.findMany(queryOptions);
                break;
            case 'hearing':
                data = await this.prisma.hearing.findMany(queryOptions);
                break;
            case 'task':
                data = await this.prisma.task.findMany(queryOptions);
                break;
        }

        // Group by if specified
        if (config.groupBy && config.groupBy.length > 0) {
            data = this.groupData(data, config.groupBy, config.fields);
        }

        return {
            config,
            data,
            count: data.length,
            generatedAt: new Date(),
        };
    }

    private groupData(data: any[], groupBy: string[], fields: ReportField[]): GroupItem[] {
        const grouped = new Map<string, GroupItem>();

        data.forEach(item => {
            const key = groupBy.map(field => String(item[field])).join('_');

            if (!grouped.has(key)) {
                const groupItem: GroupItem = {};
                groupBy.forEach(field => {
                    groupItem[field] = item[field];
                });

                // Initialize aggregations
                fields.forEach(field => {
                    if (field.aggregation) {
                        groupItem[field.field] = field.aggregation === 'count' ? 0 : [];
                    }
                });

                grouped.set(key, groupItem);
            }

            const groupItem = grouped.get(key)!;

            // Apply aggregations
            fields.forEach(field => {
                if (field.aggregation) {
                    if (field.aggregation === 'count') {
                        groupItem[field.field]++;
                    } else {
                        groupItem[field.field].push(item[field.field]);
                    }
                }
            });
        });

        // Calculate aggregations
        const result = Array.from(grouped.values()).map(item => {
            fields.forEach(field => {
                if (field.aggregation && field.aggregation !== 'count') {
                    const values = item[field.field] as number[];
                    switch (field.aggregation) {
                        case 'sum':
                            item[field.field] = values.reduce((a, b) => a + b, 0);
                            break;
                        case 'avg':
                            item[field.field] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                            break;
                        case 'min':
                            item[field.field] = values.length > 0 ? Math.min(...values) : 0;
                            break;
                        case 'max':
                            item[field.field] = values.length > 0 ? Math.max(...values) : 0;
                            break;
                    }
                }
            });
            return item;
        });

        return result;
    }

    // Predefined report templates
    async getReportTemplates() {
        return [
            {
                id: 'cases-by-status',
                name: 'القضايا حسب الحالة',
                entity: 'case',
                fields: [
                    { field: 'status', label: 'الحالة', type: 'enum', aggregation: 'count' },
                ],
                groupBy: ['status'],
            },
            {
                id: 'cases-by-type',
                name: 'القضايا حسب النوع',
                entity: 'case',
                fields: [
                    { field: 'caseType', label: 'النوع', type: 'enum', aggregation: 'count' },
                ],
                groupBy: ['caseType'],
            },
            {
                id: 'revenue-by-month',
                name: 'الإيرادات الشهرية',
                entity: 'invoice',
                fields: [
                    { field: 'totalAmount', label: 'المبلغ', type: 'number', aggregation: 'sum' },
                ],
                filters: [{ field: 'status', operator: 'equals', value: 'PAID' }],
            },
            {
                id: 'clients-overview',
                name: 'نظرة عامة على العملاء',
                entity: 'client',
                fields: [
                    { field: 'name', label: 'الاسم', type: 'string' },
                    { field: 'email', label: 'البريد', type: 'string' },
                    { field: 'phone', label: 'الهاتف', type: 'string' },
                ],
                limit: 50,
            },
            {
                id: 'pending-invoices',
                name: 'الفواتير المعلقة',
                entity: 'invoice',
                fields: [
                    { field: 'invoiceNumber', label: 'رقم الفاتورة', type: 'string' },
                    { field: 'totalAmount', label: 'المبلغ', type: 'number' },
                    { field: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date' },
                ],
                filters: [{ field: 'status', operator: 'equals', value: 'PENDING' }],
                orderBy: [{ field: 'dueDate', direction: 'asc' }],
            },
            {
                id: 'upcoming-hearings',
                name: 'الجلسات القادمة',
                entity: 'hearing',
                fields: [
                    { field: 'title', label: 'العنوان', type: 'string' },
                    { field: 'date', label: 'التاريخ', type: 'date' },
                    { field: 'location', label: 'المكان', type: 'string' },
                ],
                filters: [{ field: 'date', operator: 'gte', value: new Date() }],
                orderBy: [{ field: 'date', direction: 'asc' }],
                limit: 20,
            },
        ];
    }
}
