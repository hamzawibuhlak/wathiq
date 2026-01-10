import type { User } from '@/types';

export const ROLES = {
  ADMIN: 'Admin',
  LAWYER: 'Lawyer',
  CLIENT: 'Client',
  MARKETER: 'Marketer',
  ACCOUNTANT: 'Accountant',
} as const;

export const isAdmin = (user: User | null): boolean => {
  return user?.role?.name === ROLES.ADMIN;
};

export const isLawyer = (user: User | null): boolean => {
  return user?.role?.name === ROLES.LAWYER;
};

export const isClient = (user: User | null): boolean => {
  return user?.role?.name === ROLES.CLIENT;
};

export const isMarketer = (user: User | null): boolean => {
  return user?.role?.name === ROLES.MARKETER;
};

export const isAccountant = (user: User | null): boolean => {
  return user?.role?.name === ROLES.ACCOUNTANT;
};

export const isStaff = (user: User | null): boolean => {
  return (
    isAdmin(user) ||
    isLawyer(user) ||
    isMarketer(user) ||
    isAccountant(user)
  );
};

export const canManageCases = (user: User | null): boolean => {
  return isAdmin(user) || isLawyer(user);
};

export const canManageClients = (user: User | null): boolean => {
  return isAdmin(user) || isLawyer(user) || isMarketer(user);
};

export const canManageUsers = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canViewAuditLog = (user: User | null): boolean => {
  return isAdmin(user);
};
