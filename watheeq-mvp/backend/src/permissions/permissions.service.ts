import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default permissions
    await this.seedPermissions();
  }

  private async seedPermissions() {
    const modules = [
      'cases',
      'hearings',
      'clients',
      'documents',
      'invoices',
      'users',
      'reports',
      'settings',
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    for (const module of modules) {
      for (const action of actions) {
        await this.prisma.permission.upsert({
          where: {
            module_action: {
              module,
              action,
            },
          },
          create: {
            name: `${module}.${action}`,
            description: `${action} ${module}`,
            module,
            action,
          },
          update: {},
        });
      }
    }

    console.log('✅ Permissions seeded');
  }

  async hasPermission(
    userId: string,
    tenantId: string,
    permissionName: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { role: true },
    });

    if (!user) return false;

    // OWNER has all permissions
    if (user.role === 'OWNER') return true;

    const [module, action] = permissionName.split('.');

    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });

    if (!permission) return false;

    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        role_permissionId_tenantId: {
          role: user.role,
          permissionId: permission.id,
          tenantId,
        },
      },
    });

    return !!rolePermission;
  }

  async getUserPermissions(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { role: true },
    });

    if (!user) return [];

    // OWNER has all permissions
    if (user.role === 'OWNER') {
      const allPermissions = await this.prisma.permission.findMany();
      return allPermissions.map(p => p.name);
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role, tenantId },
      include: { permission: true },
    });

    return rolePermissions.map(rp => rp.permission.name);
  }

  async assignPermission(
    role: string,
    permissionName: string,
    tenantId: string,
  ) {
    const [module, action] = permissionName.split('.');

    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return this.prisma.rolePermission.upsert({
      where: {
        role_permissionId_tenantId: {
          role,
          permissionId: permission.id,
          tenantId,
        },
      },
      create: {
        role,
        permissionId: permission.id,
        tenantId,
      },
      update: {},
    });
  }

  async revokePermission(
    role: string,
    permissionName: string,
    tenantId: string,
  ) {
    const [module, action] = permissionName.split('.');

    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });

    if (!permission) return;

    await this.prisma.rolePermission.deleteMany({
      where: {
        role,
        permissionId: permission.id,
        tenantId,
      },
    });
  }

  async getDefaultPermissionsForRole(role: string) {
    const defaults: Record<string, string[]> = {
      OWNER: ['*.*'], // All permissions
      ADMIN: [
        'cases.*',
        'hearings.*',
        'clients.*',
        'documents.*',
        'invoices.*',
        'users.read',
        'users.create',
        'reports.*',
      ],
      LAWYER: [
        'cases.read',
        'cases.update',
        'hearings.*',
        'clients.read',
        'documents.*',
        'invoices.read',
      ],
      SECRETARY: [
        'cases.read',
        'hearings.read',
        'clients.read',
        'documents.read',
        'invoices.read',
      ],
    };

    return defaults[role] || [];
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async getRolePermissions(role: string, tenantId: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role, tenantId },
      include: { permission: true },
    });

    return rolePermissions.map(rp => rp.permission);
  }
}
