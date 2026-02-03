import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, indeterminate, checked, ...props }, ref) => {
        const innerRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(ref, () => innerRef.current!);

        React.useEffect(() => {
            if (innerRef.current) {
                innerRef.current.indeterminate = indeterminate ?? false;
            }
        }, [indeterminate]);

        return (
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    ref={innerRef}
                    checked={checked}
                    className="sr-only peer"
                    {...props}
                />
                <div
                    className={cn(
                        "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                        "border-muted-foreground/30 bg-background",
                        "peer-checked:bg-primary peer-checked:border-primary",
                        "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20",
                        "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                        indeterminate && "bg-primary border-primary",
                        className
                    )}
                >
                    {indeterminate ? (
                        <Minus className="w-3 h-3 text-primary-foreground" />
                    ) : checked ? (
                        <Check className="w-3 h-3 text-primary-foreground" />
                    ) : null}
                </div>
            </label>
        );
    }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
