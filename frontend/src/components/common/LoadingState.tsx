import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  message = 'جاري التحميل...',
  className,
  size = 'md',
}: LoadingStateProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12',
        className,
      )}
    >
      <Loader2 className={cn('animate-spin text-primary mb-3', sizes[size])} />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
