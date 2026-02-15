import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'hamzabuhlak@gmail.com';
    const password = '1485591650hH123@#';

    console.log('🔐 Checking SuperAdminUser table...');

    const existing = await prisma.superAdminUser.findUnique({ where: { email } });
    console.log('Existing record:', existing ? `YES (id: ${existing.id})` : 'NO');

    const hashed = await bcrypt.hash(password, 12);

    if (!existing) {
        const admin = await prisma.superAdminUser.create({
            data: {
                name: 'مدير النظام',
                email,
                password: hashed,
                role: 'OWNER',
                permissions: ['*'],
                isActive: true,
            }
        });
        console.log(`✅ Super Admin created in superAdminUser table: ${admin.id}`);
    } else {
        await prisma.superAdminUser.update({
            where: { email },
            data: { password: hashed, isActive: true }
        });
        console.log('✅ Password updated for existing super admin');
    }

    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
