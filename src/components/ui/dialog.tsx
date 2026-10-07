"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Dialog Radix: fokus terkunci, background inert, Escape menutup, fokus kembali ke trigger. */
export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#18211e]/45" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-dialog border border-line bg-surface p-6 shadow-[0_12px_40px_rgba(24,33,30,0.18)] sm:p-8",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="pr-10 text-[22px] font-semibold leading-tight tracking-tight">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-2 text-[15px] text-muted">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        <div className="mt-6">{children}</div>
        <DialogPrimitive.Close
          aria-label="Tutup"
          className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-btn text-muted hover:bg-[#ebeee9] hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
