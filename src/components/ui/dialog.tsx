"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Dialog Radix: fokus terkunci, background inert, Escape menutup, fokus kembali ke trigger.
 * Dirender lewat portal ke body, sehingga kelas `workspace` dipasang di sini agar palet
 * ruang kerja ikut berlaku di dalam dialog.
 */
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
      <DialogPrimitive.Overlay className="dialog-overlay workspace fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        className={cn(
          "workspace fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] border border-line bg-surface p-6 text-ink shadow-[0_2px_6px_rgba(19,23,21,0.06),0_30px_60px_-18px_rgba(19,23,21,0.18)] sm:p-8",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="pr-10 font-heading text-[22px] font-bold leading-tight tracking-tight">
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
          className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
