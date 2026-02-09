import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-001' },
        update: {},
        create: {
            id: 'tenant-001',
            name: 'مكتب المحاماة التجريبي',
            nameEn: 'Demo Law Firm',
            email: 'demo@watheeq.sa',
            phone: '0500000000',
            licenseNumber: 'LIC-12345',
            isActive: true,
        },
    });
    console.log('✅ Tenant created:', tenant.name);

    // Create Owner User
    const hashedPassword = await bcrypt.hash('password123', 10);

    const owner = await prisma.user.upsert({
        where: { email: 'owner@watheeq.sa' },
        update: {},
        create: {
            email: 'owner@watheeq.sa',
            password: hashedPassword,
            name: 'المحامي صاحب المكتب',
            phone: '0500000001',
            role: UserRole.OWNER,
            tenantId: tenant.id,
            isActive: true,
        },
    });
    console.log('✅ Owner created:', owner.email);

    // Create Lawyer User
    const lawyer = await prisma.user.upsert({
        where: { email: 'lawyer@watheeq.sa' },
        update: {},
        create: {
            email: 'lawyer@watheeq.sa',
            password: hashedPassword,
            name: 'المحامي أحمد',
            phone: '0500000002',
            role: UserRole.LAWYER,
            tenantId: tenant.id,
            isActive: true,
        },
    });
    console.log('✅ Lawyer created:', lawyer.email);

    // Create Client
    const client = await prisma.client.create({
        data: {
            name: 'العميل محمد السعود',
            phone: '0550000001',
            email: 'client@example.com',
            tenantId: tenant.id,
            isActive: true,
        },
    });
    console.log('✅ Client created:', client.name);

    // Create Case
    const legalCase = await prisma.case.create({
        data: {
            caseNumber: '2026-0001',
            title: 'قضية تجارية - مطالبة مالية',
            caseType: 'COMMERCIAL',
            status: 'OPEN',
            priority: 'HIGH',
            clientId: client.id,
            tenantId: tenant.id,
            assignedToId: lawyer.id,
            createdById: owner.id,
        },
    });
    console.log('✅ Case created:', legalCase.caseNumber);

    // Create Hearing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.hearing.create({
        data: {
            hearingDate: tomorrow,
            courtName: 'المحكمة التجارية بالرياض',
            courtroom: 'قاعة 5',
            caseId: legalCase.id,
            clientId: client.id,
            tenantId: tenant.id,
            assignedToId: lawyer.id,
            createdById: owner.id,
            status: 'SCHEDULED',
        },
    });
    console.log('✅ Hearing created for tomorrow');

    console.log('\n🎉 Seeding completed!');
    console.log('\n📧 Login credentials:');
    console.log('   Owner: owner@watheeq.sa / password123');
    console.log('   Lawyer: lawyer@watheeq.sa / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
