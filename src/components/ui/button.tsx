import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-btn font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-focus",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-hover active:scale-[0.98] shadow-md shadow-primary/20 font-semibold",
        coral:
          "bg-coral text-white hover:bg-coral-hover active:scale-[0.98] shadow-md shadow-coral/25 font-semibold",
        accent:
          "bg-violet text-white hover:bg-violet-hover active:scale-[0.98] shadow-md shadow-violet/20 font-semibold",
        secondary:
          "border border-line bg-surface text-ink hover:bg-surface-subtle hover:border-control active:scale-[0.98]",
        subtle:
          "bg-surface-subtle text-ink hover:bg-surface-inset active:scale-[0.98]",
        ghost:
          "text-muted hover:text-ink hover:bg-surface-subtle active:scale-[0.98]",
        danger:
          "bg-danger text-white hover:bg-[#b91c1c] active:scale-[0.98]",
        link:
          "h-auto min-h-0 px-0 text-primary underline underline-offset-4 hover:text-primary-hover",
      },
      size: {
        sm: "h-9 px-3 text-[13.5px]",
        md: "h-10.5 px-4 text-[14.5px]",
        lg: "h-12 px-5 text-[15.5px]",
        icon: "size-10.5",
        "icon-sm": "size-8.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
