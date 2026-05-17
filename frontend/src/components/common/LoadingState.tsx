import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'جاري التحميل...', className, size = 'md' }: LoadingStateProps) {
  const sizes = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-10 h-10' };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className={cn('animate-spin text-primary/60 mb-3', sizes[size])} />
      <p className="text-[13px] text-white/30">{message}</p>
    </div>
  );
}
