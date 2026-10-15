import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-11 w-full rounded-input border border-control bg-surface px-3.5 text-base text-ink placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-control-hover focus-visible:border-focus focus-visible:shadow-[0_0_0_4px_rgba(33,41,34,0.12)] aria-[invalid=true]:border-danger disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full rounded-input border border-control bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-control-hover focus-visible:border-focus focus-visible:shadow-[0_0_0_4px_rgba(33,41,34,0.12)] aria-[invalid=true]:border-danger",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
