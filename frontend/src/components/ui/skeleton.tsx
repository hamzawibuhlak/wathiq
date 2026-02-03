import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
    className,
    variant = 'text',
    width,
    height,
    animation = 'pulse',
}: SkeletonProps) {
    return (
        <div
            className={cn(
                'bg-muted',
                animation === 'pulse' && 'animate-pulse',
                animation === 'wave' && 'animate-shimmer',
                variant === 'circular' && 'rounded-full',
                variant === 'rectangular' && 'rounded-md',
                variant === 'text' && 'rounded h-4',
                className
            )}
            style={{
                width: width,
                height: height,
            }}
        />
    );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('bg-card rounded-xl border p-5 space-y-4', className)}>
            <div className="flex items-start gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-2/3 h-3" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="w-1/3 h-4" />
                        <Skeleton className="w-1/4 h-3" />
                    </div>
                    <Skeleton className="w-20 h-8 rounded-md" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export default Skeleton;
