import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary-base)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] hover:scale-[1.02] active:scale-[0.98] shadow-sm",
        destructive:
          "bg-[var(--color-critical-base)] text-[var(--color-on-primary)] hover:bg-[var(--color-critical-base)]/90 active:scale-[0.98]",
        outline:
          "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-base)] hover:bg-[var(--color-bg-surface-hover)]",
        secondary:
          "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-base)] hover:bg-[var(--color-bg-surface-hover)]",
        ghost:
          "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-base)]",
        link: "text-[var(--color-primary-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[var(--btn-md-height)] px-[var(--space-4)] text-[length:var(--text-base-fs)] rounded-[var(--radius-md)]",
        sm: "h-[var(--btn-sm-height)] px-[var(--space-3)] text-[length:var(--text-sm-fs)] rounded-[var(--radius-md)]",
        lg: "h-[var(--btn-lg-height)] px-[var(--space-6)] text-[length:var(--text-lg-fs)] rounded-[var(--radius-md)]",
        icon: "h-[var(--btn-md-height)] w-[var(--btn-md-height)] rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
