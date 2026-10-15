"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "danger" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  duration?: number; // ms, default 3500
}

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title?: string;
  message: React.ReactNode;
  duration: number;
  createdAt: number;
}

const TOAST_EVENT = "akseskelas:toast:emit";
const TOAST_DISMISS_EVENT = "akseskelas:toast:dismiss";

let toastCounter = 0;

function emitToast(tone: ToastTone, message: React.ReactNode, options?: ToastOptions): string {
  const id = `toast-${++toastCounter}-${Date.now()}`;
  const duration = options?.duration ?? (tone === "danger" ? 4500 : 3500);

  const item: ToastItem = {
    id,
    tone,
    title: options?.title,
    message,
    duration,
    createdAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: item }));
  }

  return id;
}

export const toast = {
  success: (message: React.ReactNode, options?: ToastOptions) =>
    emitToast("success", message, options),
  error: (message: React.ReactNode, options?: ToastOptions) =>
    emitToast("danger", message, options),
  danger: (message: React.ReactNode, options?: ToastOptions) =>
    emitToast("danger", message, options),
  warning: (message: React.ReactNode, options?: ToastOptions) =>
    emitToast("warning", message, options),
  info: (message: React.ReactNode, options?: ToastOptions) =>
    emitToast("info", message, options),
  dismiss: (id?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(TOAST_DISMISS_EVENT, { detail: { id } }));
    }
  },
};

const toneConfigs = {
  success: {
    icon: CheckCircle2,
    iconWrapper: "bg-emerald-500/10 text-emerald-600",
    barClass: "bg-emerald-500",
  },
  danger: {
    icon: AlertCircle,
    iconWrapper: "bg-rose-500/10 text-rose-600",
    barClass: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    iconWrapper: "bg-amber-500/10 text-amber-600",
    barClass: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconWrapper: "bg-surface-subtle text-ink",
    barClass: "bg-ink",
  },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [isClosing, setIsClosing] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const remainingRef = React.useRef(item.duration);
  const startTimeRef = React.useRef(Date.now());
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const config = toneConfigs[item.tone];
  const Icon = config.icon;

  const closeToast = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(item.id);
    }, 200);
  }, [item.id, onDismiss]);

  React.useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      closeToast();
    }, remainingRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, closeToast]);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(remainingRef.current - elapsed, 300);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      role={item.tone === "danger" ? "alert" : "status"}
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        animation: isClosing
          ? "toastSlideOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-xl border border-line bg-surface/98 px-3.5 py-2.5 shadow-[0_8px_24px_-6px_rgba(19,23,21,0.12),0_2px_6px_rgba(19,23,21,0.06)] backdrop-blur-md transition-all max-w-[340px] sm:max-w-[360px] w-full",
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Compact Icon */}
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full",
            config.iconWrapper,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          {item.title ? (
            <>
              <p className="text-[13px] font-semibold text-ink leading-tight">
                {item.title}
              </p>
              <div className="text-xs leading-snug text-muted mt-0.5 break-words">
                {item.message}
              </div>
            </>
          ) : (
            <div className="text-[13px] font-medium text-ink leading-snug break-words">
              {item.message}
            </div>
          )}
        </div>

        {/* Discreet Close Button */}
        <button
          type="button"
          onClick={closeToast}
          aria-label="Tutup notifikasi"
          className="shrink-0 p-1 text-muted/60 hover:text-ink rounded-md transition-colors hover:bg-surface-subtle cursor-pointer focus:outline-hidden"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Sleek Hairline Auto-Dismiss Progress Bar */}
      {item.duration > 0 ? (
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-line/30 overflow-hidden">
          <div
            style={{
              animation: `toastProgress ${item.duration}ms linear forwards`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
            className={cn("h-full w-full", config.barClass)}
          />
        </div>
      ) : null}
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    const handleToastEmit = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;
      setToasts((prev) => {
        // Limit max 3 compact toasts
        const next = [...prev, customEvent.detail];
        return next.slice(-3);
      });
    };

    const handleToastDismiss = (e: Event) => {
      const customEvent = e as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;
      if (id) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      } else {
        setToasts([]);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToastEmit);
    window.addEventListener(TOAST_DISMISS_EVENT, handleToastDismiss);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToastEmit);
      window.removeEventListener(TOAST_DISMISS_EVENT, handleToastDismiss);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-label="Pemberitahuan Sistem"
      tabIndex={-1}
      className="fixed top-5 right-4 sm:right-6 z-[99999] pointer-events-none flex flex-col gap-2 items-end max-w-full"
    >
      {toasts.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
      ))}
    </div>
  );
}
