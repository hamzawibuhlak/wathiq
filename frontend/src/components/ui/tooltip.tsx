import * as React from 'react';
import { cn } from '@/lib/utils';

/* ── Tooltip Context ── */
interface TooltipContextValue {
    open: boolean;
    setOpen: (v: boolean) => void;
}
const TooltipContext = React.createContext<TooltipContextValue>({ open: false, setOpen: () => {} });

/* ── TooltipProvider ── */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

/* ── Tooltip ── */
export function Tooltip({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <TooltipContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-flex">{children}</div>
        </TooltipContext.Provider>
    );
}

/* ── TooltipTrigger ── */
export function TooltipTrigger({
    children,
    asChild,
}: {
    children: React.ReactNode;
    asChild?: boolean;
}) {
    const { setOpen } = React.useContext(TooltipContext);
    const child = React.Children.only(children) as React.ReactElement;
    if (asChild) {
        return React.cloneElement(child, {
            onMouseEnter: () => setOpen(true),
            onMouseLeave: () => setOpen(false),
        } as any);
    }
    return (
        <span onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            {children}
        </span>
    );
}

/* ── TooltipContent ── */
export function TooltipContent({
    children,
    className,
    side = 'top',
}: {
    children: React.ReactNode;
    className?: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
}) {
    const { open } = React.useContext(TooltipContext);
    if (!open) return null;

    const posClass = {
        top: 'bottom-full mb-1.5 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
        left: 'right-full mr-1.5 top-1/2 -translate-y-1/2',
        right: 'left-full ml-1.5 top-1/2 -translate-y-1/2',
    }[side];

    return (
        <div
            className={cn(
                'absolute z-50 whitespace-nowrap px-2 py-1 text-xs text-white bg-slate-800 dark:bg-slate-700 rounded-md shadow-md pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100',
                posClass,
                className
            )}
        >
            {children}
        </div>
    );
}
