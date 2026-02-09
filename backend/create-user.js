const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('123123123', 10);

    // First get or create tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: 'مكتب وثيق', email: 'demo@watheeq.com' }
        });
        console.log('Created tenant:', tenant.name);
    }

    // Create user
    const user = await prisma.user.create({
        data: {
            email: 'hamza2hb@gmail.com',
            password: hashedPassword,
            name: 'حمزة',
            role: 'OWNER',
            tenantId: tenant.id
        }
    });

    console.log('User created:', user.email);
    console.log('Password: 123123123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
