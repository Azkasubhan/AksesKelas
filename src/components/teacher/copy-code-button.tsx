"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { formatJoinCode } from "@/shared/schemas/auth-classes";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Kode kelas ${formatJoinCode(code)} berhasil disalin ke papan klip!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin kode kelas.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Klik untuk menyalin kode bergabung kelas"
      className="group/code inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-subtle/80 hover:bg-surface-subtle hover:border-primary-border px-2.5 py-1 text-xs font-medium text-ink transition-all active:scale-95 cursor-pointer focus-visible:outline-focus"
    >
      <span className="text-[11px] font-normal text-muted">Kode:</span>
      <span className="font-mono font-bold tracking-wider text-ink">
        {formatJoinCode(code)}
      </span>
      {copied ? (
        <Check className="size-3 text-emerald-600 ml-0.5" aria-hidden="true" />
      ) : (
        <Copy
          className="size-3 text-muted group-hover/code:text-primary ml-0.5 transition-colors"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
