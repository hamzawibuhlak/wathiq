import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const OWNER_EMAIL = 'marketing.wasm@gmail.com';
const OWNER_PASSWORD = 'Wasm123Wasm@#';
const OWNER_NAME = 'مالك المكتب';
const COMPANY_NAME = 'شركة وسم الثقة للمحاماة';

async function main() {
    console.log('🌱 Seeding single-tenant baseline...');

    const existingCompany = await prisma.companySettings.findFirst();
    const company = existingCompany
        ? await prisma.companySettings.update({ where: { id: existingCompany.id }, data: { name: COMPANY_NAME } })
        : await prisma.companySettings.create({ data: { name: COMPANY_NAME } });
    console.log('✅ CompanySettings:', company.name);

    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);
    const owner = await prisma.user.upsert({
        where: { email: OWNER_EMAIL },
        update: { password: hashedPassword, role: UserRole.OWNER, isActive: true, isVerified: true },
        create: {
            email: OWNER_EMAIL,
            password: hashedPassword,
            name: OWNER_NAME,
            role: UserRole.OWNER,
            isActive: true,
            isVerified: true,
        },
    });
    console.log('✅ Owner:', owner.email);

    console.log('\n🎉 Done.');
    console.log(`   Email:    ${OWNER_EMAIL}`);
    console.log(`   Password: ${OWNER_PASSWORD}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
