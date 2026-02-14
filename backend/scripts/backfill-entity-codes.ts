/**
 * Phase 37: Backfill Entity Codes
 * 
 * This script populates code and codeNumber for all existing records
 * that don't have codes yet.
 * 
 * Usage: npx ts-node scripts/backfill-entity-codes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillTenants() {
    const tenants = await prisma.tenant.findMany({
        where: { code: null },
        select: { id: true, slug: true },
    });

    for (const t of tenants) {
        await prisma.tenant.update({
            where: { id: t.id },
            data: {
                code: `${t.slug}_law`,
                codePrefix: t.slug,
            },
        });
    }
    console.log(`✅ Backfilled ${tenants.length} tenants`);
}

async function backfillUsers() {
    const tenants = await prisma.tenant.findMany({
        select: { id: true, codePrefix: true, slug: true },
    });

    for (const tenant of tenants) {
        const prefix = tenant.codePrefix || tenant.slug;
        const users = await prisma.user.findMany({
            where: { tenantId: tenant.id, code: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        for (let i = 0; i < users.length; i++) {
            const num = i + 1;
            await prisma.user.update({
                where: { id: users[i].id },
                data: {
                    code: `${prefix}_US${num.toString().padStart(4, '0')}`,
                    codeNumber: num,
                },
            });
        }
        console.log(`  Users for tenant ${prefix}: ${users.length}`);
    }
    console.log(`✅ Backfilled users`);
}

async function backfillClients() {
    const tenants = await prisma.tenant.findMany({
        select: { id: true, codePrefix: true, slug: true },
    });

    for (const tenant of tenants) {
        const prefix = tenant.codePrefix || tenant.slug;
        const clients = await prisma.client.findMany({
            where: { tenantId: tenant.id, code: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        for (let i = 0; i < clients.length; i++) {
            const num = i + 1;
            await prisma.client.update({
                where: { id: clients[i].id },
                data: {
                    code: `${prefix}_CL${num.toString().padStart(4, '0')}`,
                    codeNumber: num,
                },
            });
        }
        console.log(`  Clients for tenant ${prefix}: ${clients.length}`);
    }
    console.log(`✅ Backfilled clients`);
}

async function backfillCases() {
    // Cases use hierarchical codes from their client
    const clients = await prisma.client.findMany({
        where: { code: { not: null } },
        select: { id: true, code: true },
    });

    for (const client of clients) {
        const cases = await prisma.case.findMany({
            where: { clientId: client.id, code: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        for (let i = 0; i < cases.length; i++) {
            const num = i + 1;
            await prisma.case.update({
                where: { id: cases[i].id },
                data: {
                    code: `${client.code}_CA${num.toString().padStart(5, '0')}`,
                    codeNumber: num,
                },
            });
        }
        if (cases.length > 0) console.log(`  Cases for client ${client.code}: ${cases.length}`);
    }

    // Handle orphan cases (no clientId) — use flat code
    const tenants = await prisma.tenant.findMany({
        select: { id: true, codePrefix: true, slug: true },
    });
    for (const tenant of tenants) {
        const prefix = tenant.codePrefix || tenant.slug;
        const orphanCases = await prisma.case.findMany({
            where: { tenantId: tenant.id, clientId: null, code: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        const lastCodedCase = await prisma.case.findFirst({
            where: { tenantId: tenant.id, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });
        let startNum = (lastCodedCase?.codeNumber || 0) + 1;

        for (let i = 0; i < orphanCases.length; i++) {
            const num = startNum + i;
            await prisma.case.update({
                where: { id: orphanCases[i].id },
                data: {
                    code: `${prefix}_CA${num.toString().padStart(5, '0')}`,
                    codeNumber: num,
                },
            });
        }
        if (orphanCases.length > 0) console.log(`  Orphan cases for ${prefix}: ${orphanCases.length}`);
    }
    console.log(`✅ Backfilled cases`);
}

async function backfillHearings() {
    // Hearings use hierarchical codes from their case
    const cases = await prisma.case.findMany({
        where: { code: { not: null } },
        select: { id: true, code: true, tenantId: true },
    });

    for (const c of cases) {
        const hearings = await prisma.hearing.findMany({
            where: { caseId: c.id, code: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        for (let i = 0; i < hearings.length; i++) {
            const num = i + 1;
            await prisma.hearing.update({
                where: { id: hearings[i].id },
                data: {
                    code: `${c.code}_CS${num.toString().padStart(5, '0')}`,
                    codeNumber: num,
                },
            });
        }
        if (hearings.length > 0) console.log(`  Hearings for case ${c.code}: ${hearings.length}`);
    }

    // Orphan hearings
    const tenants = await prisma.tenant.findMany({
        select: { id: true, codePrefix: true, slug: true },
    });
    for (const tenant of tenants) {
        const prefix = tenant.codePrefix || tenant.slug;
        const orphans = await prisma.hearing.findMany({
            where: { tenantId: tenant.id, caseId: null, code: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        const lastCoded = await prisma.hearing.findFirst({
            where: { tenantId: tenant.id, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });
        let startNum = (lastCoded?.codeNumber || 0) + 1;

        for (let i = 0; i < orphans.length; i++) {
            const num = startNum + i;
            await prisma.hearing.update({
                where: { id: orphans[i].id },
                data: {
                    code: `${prefix}_CS${num.toString().padStart(5, '0')}`,
                    codeNumber: num,
                },
            });
        }
        if (orphans.length > 0) console.log(`  Orphan hearings for ${prefix}: ${orphans.length}`);
    }
    console.log(`✅ Backfilled hearings`);
}

async function backfillFlatEntity(
    modelName: string,
    typePrefix: string,
    findMany: (tenantId: string) => Promise<{ id: string }[]>,
    update: (id: string, data: { code: string; codeNumber: number }) => Promise<any>,
    getLastNumber: (tenantId: string) => Promise<number>,
) {
    const tenants = await prisma.tenant.findMany({
        select: { id: true, codePrefix: true, slug: true },
    });

    let total = 0;
    for (const tenant of tenants) {
        const prefix = tenant.codePrefix || tenant.slug;
        const records = await findMany(tenant.id);
        const lastNum = await getLastNumber(tenant.id);

        for (let i = 0; i < records.length; i++) {
            const num = lastNum + i + 1;
            await update(records[i].id, {
                code: `${prefix}_${typePrefix}${num.toString().padStart(5, '0')}`,
                codeNumber: num,
            });
        }
        total += records.length;
    }
    console.log(`✅ Backfilled ${total} ${modelName}`);
}

async function main() {
    console.log('🚀 Starting entity code backfill...\n');

    await backfillTenants();
    await backfillUsers();
    await backfillClients();
    await backfillCases();
    await backfillHearings();

    // Documents
    await backfillFlatEntity(
        'documents', 'DOC',
        (tenantId) => prisma.document.findMany({ where: { tenantId, code: null }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
        (id, data) => prisma.document.update({ where: { id }, data }),
        async (tenantId) => {
            const last = await prisma.document.findFirst({ where: { tenantId, codeNumber: { not: null } }, orderBy: { codeNumber: 'desc' }, select: { codeNumber: true } });
            return last?.codeNumber || 0;
        },
    );

    // Invoices
    await backfillFlatEntity(
        'invoices', 'INV',
        (tenantId) => prisma.invoice.findMany({ where: { tenantId, code: null }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
        (id, data) => prisma.invoice.update({ where: { id }, data }),
        async (tenantId) => {
            const last = await prisma.invoice.findFirst({ where: { tenantId, codeNumber: { not: null } }, orderBy: { codeNumber: 'desc' }, select: { codeNumber: true } });
            return last?.codeNumber || 0;
        },
    );

    // Tasks
    await backfillFlatEntity(
        'tasks', 'TK',
        (tenantId) => prisma.task.findMany({ where: { tenantId, code: null }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
        (id, data) => prisma.task.update({ where: { id }, data }),
        async (tenantId) => {
            const last = await prisma.task.findFirst({ where: { tenantId, codeNumber: { not: null } }, orderBy: { codeNumber: 'desc' }, select: { codeNumber: true } });
            return last?.codeNumber || 0;
        },
    );

    // Expenses
    await backfillFlatEntity(
        'expenses', 'EX',
        (tenantId) => prisma.expense.findMany({ where: { tenantId, code: null }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
        (id, data) => prisma.expense.update({ where: { id }, data }),
        async (tenantId) => {
            const last = await prisma.expense.findFirst({ where: { tenantId, codeNumber: { not: null } }, orderBy: { codeNumber: 'desc' }, select: { codeNumber: true } });
            return last?.codeNumber || 0;
        },
    );

    console.log('\n🎉 Backfill complete!');
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('❌ Backfill failed:', e);
    prisma.$disconnect();
    process.exit(1);
});
