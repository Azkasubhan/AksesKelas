import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge AksesKelas: minimalis, fungsional, dan selalu didampingi teks bermakna.
 * Warna difokuskan sebagai identitas mode atau status yang terbaca jelas.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium tracking-tight",
  {
    variants: {
      tone: {
        neutral: "border border-line bg-surface-subtle text-muted",
        ink: "bg-ink text-canvas font-semibold",
        primary: "border border-primary-border bg-primary-subtle text-primary font-semibold",
        success: "border border-easy-line bg-easy text-easy-ink font-semibold",
        warning: "border border-[#e5d4b8] bg-warning-bg text-warning font-semibold",
        outline: "border border-line text-muted bg-transparent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Alert({
  tone = "primary",
  title,
  children,
  className,
  role,
}: {
  tone?: "primary" | "danger" | "warning" | "success";
  title?: string;
  children: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  const tones = {
    primary: "border-primary-border bg-primary-subtle text-ink",
    danger: "border-[#eec2c2] bg-danger-bg text-danger",
    warning: "border-[#eddcc4] bg-warning-bg text-warning",
    success: "border-easy-line bg-easy text-easy-ink",
  } as const;

  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn("rounded-card border p-3.5 text-sm leading-relaxed", tones[tone], className)}
    >
      {title ? <p className="font-semibold text-ink">{title}</p> : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-sm bg-surface-inset animate-pulse", className)}
    />
  );
}
