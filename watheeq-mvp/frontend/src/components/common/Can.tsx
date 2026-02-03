import { ReactNode } from 'react';
import { useAuthStore, Resource, Action } from '@/stores/auth.store';

interface CanProps {
    /**
     * The action to check permission for
     */
    perform: Action;
    /**
     * The resource to check permission on
     */
    on: Resource;
    /**
     * Content to render if permission is granted
     */
    children: ReactNode;
    /**
     * Optional fallback content if permission is denied
     */
    fallback?: ReactNode;
}

/**
 * Component for conditional rendering based on user permissions
 * 
 * @example
 * ```tsx
 * <Can perform="create" on="users">
 *   <Button>إضافة مستخدم</Button>
 * </Can>
 * ```
 */
export function Can({ perform, on, children, fallback = null }: CanProps) {
    const can = useAuthStore((state) => state.can);

    if (can(perform, on)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

/**
 * Hook for checking permissions in components
 */
export function usePermission(action: Action, resource: Resource): boolean {
    return useAuthStore((state) => state.can(action, resource));
}

/**
 * Component that only renders for OWNER role
 */
export function OwnerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
    const isOwner = useAuthStore((state) => state.isOwner());
    return isOwner ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders for OWNER or ADMIN roles
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
    const isAdminOrOwner = useAuthStore((state) => state.isAdminOrOwner());
    return isAdminOrOwner ? <>{children}</> : <>{fallback}</>;
}

export default Can;
