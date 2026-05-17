import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className={cn(
        'w-20 h-20 rounded-2xl flex items-center justify-center mb-6',
        'bg-white/[0.04] border border-white/[0.07]',
        'shadow-[0_0_30px_rgba(var(--primary-rgb),0.06)]'
      )}>
        <Icon className="w-9 h-9 text-white/20" />
      </div>
      <h3 className="text-lg font-semibold text-white/80 mb-2 text-center">{title}</h3>
      {description && (
        <p className="text-[13px] text-white/35 text-center mb-6 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-l from-primary/90 to-[hsl(var(--gold))]/80 text-white border-0 shadow-[0_0_16px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_22px_rgba(var(--primary-rgb),0.45)]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
