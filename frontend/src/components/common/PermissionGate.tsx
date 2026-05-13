/**
 * Phase 35: PermissionGate Component
 * Conditionally renders children based on user permissions.
 */
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
    /** Module/resource key (e.g. "cases", "invoices") */
    resource: string;
    /** Action key (e.g. "create", "edit", "delete") */
    action: string;
    /** Content to show if access is denied */
    fallback?: React.ReactNode;
    /** Children to render if user has permission */
    children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    resource,
    action,
    fallback = null,
    children,
}) => {
    const { can } = usePermissions();

    if (!can(resource, action)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
