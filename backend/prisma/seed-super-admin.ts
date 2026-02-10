import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Creating Super Admin user...');

    const hashedPassword = await bcrypt.hash('SuperAdmin@2026!', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@watheeq.sa' },
        update: { role: UserRole.SUPER_ADMIN },
        create: {
            email: 'admin@watheeq.sa',
            password: hashedPassword,
            name: 'مدير النظام',
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            isVerified: true,
        },
    });

    console.log(`✅ Super Admin created: ${superAdmin.email} (ID: ${superAdmin.id})`);

    // Create default subscription plans
    console.log('📋 Creating subscription plans...');

    const plans = [
        {
            name: 'Basic', nameAr: 'الأساسية', slug: 'basic',
            description: 'For small law offices', descriptionAr: 'للمكاتب الصغيرة',
            monthlyPrice: 299, annualPrice: 2990, maxUsers: 5, maxCases: 100, maxStorageGB: 10, maxClients: 50,
            features: { documents: true, cases: true, clients: true, reports: false, analytics: false, hr: false, accounting: false },
        },
        {
            name: 'Professional', nameAr: 'الاحترافية', slug: 'professional',
            description: 'For growing firms', descriptionAr: 'للمكاتب المتنامية',
            monthlyPrice: 599, annualPrice: 5990, maxUsers: 15, maxCases: 500, maxStorageGB: 50, maxClients: 200,
            features: { documents: true, cases: true, clients: true, reports: true, analytics: true, hr: false, accounting: false },
            isPopular: true,
        },
        {
            name: 'Enterprise', nameAr: 'المؤسسات', slug: 'enterprise',
            description: 'For large firms', descriptionAr: 'للمكاتب الكبيرة',
            monthlyPrice: 999, annualPrice: 9990, maxUsers: 50, maxCases: -1, maxStorageGB: 200, maxClients: -1,
            features: { documents: true, cases: true, clients: true, reports: true, analytics: true, hr: true, accounting: true },
        },
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { slug: plan.slug },
            update: plan,
            create: plan,
        });
    }
    console.log(`✅ ${plans.length} plans created`);

    // Create default feature flags
    console.log('🚩 Creating feature flags...');
    const flags = [
        { key: 'hr_module', name: 'HR Module', description: 'Enable HR management features' },
        { key: 'accounting_module', name: 'Accounting Module', description: 'Enable accounting features' },
        { key: 'whatsapp_integration', name: 'WhatsApp Integration', description: 'Enable WhatsApp messaging' },
        { key: 'ai_assistant', name: 'AI Assistant', description: 'Enable AI-powered features' },
        { key: 'client_portal', name: 'Client Portal', description: 'Enable client self-service portal' },
    ];

    for (const flag of flags) {
        await prisma.featureFlag.upsert({
            where: { key: flag.key },
            update: flag,
            create: { ...flag, isEnabled: true },
        });
    }
    console.log(`✅ ${flags.length} feature flags created`);

    console.log('\n🎉 Super Admin seeding complete!');
    console.log('   Email: admin@watheeq.sa');
    console.log('   Password: SuperAdmin@2026!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
