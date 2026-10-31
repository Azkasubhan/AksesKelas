"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatJoinCode } from "@/shared/schemas/auth-classes";

interface JoinCodePanelProps {
  classId: string;
  joinCode: string;
  csrfToken: string;
}

export function JoinCodePanel({ classId, joinCode, csrfToken }: JoinCodePanelProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [rotateOpen, setRotateOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success("Kode akses kelas berhasil disalin ke papan klip!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin kode ke papan klip.");
    }
  }

  async function handleRotate() {
    setLoading(true);
    try {
      await apiFetch(`/classes/${classId}/rotate-code`, {
        method: "POST",
        csrfToken,
      });
      setRotateOpen(false);
      toast.success("Kode akses bergabung berhasil diperbarui!");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Gagal memperbarui kode bergabung.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:px-6 sm:py-5.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Kode Akses Bergabung Kelas
        </span>
        <div className="mt-1 flex items-center gap-2.5">
          <span className="font-mono text-2xl font-bold tracking-wider text-ink sm:text-3xl">
            {formatJoinCode(joinCode)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Bagikan kode ini kepada murid agar dapat mengakses materi pembelajaran di kelas ini.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          aria-label="Salin kode bergabung"
          className="font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-primary" aria-hidden="true" />
              <span className="text-primary font-semibold">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden="true" />
              <span>Salin Kode</span>
            </>
          )}
        </Button>

        <Dialog open={rotateOpen} onOpenChange={setRotateOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted hover:text-ink font-medium cursor-pointer"
              aria-label="Ganti kode bergabung kelas"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Ganti Kode</span>
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Perbarui Kode Bergabung?"
            description="Kode saat ini akan dinonaktifkan. Murid baru harus menggunakan kode baru untuk bergabung ke kelas ini. Murid yang sudah terdaftar tidak akan terpengaruh."
          >
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setRotateOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleRotate}
                disabled={loading}
                className="gap-2 font-semibold"
              >
                {loading ? "Memperbarui…" : "Ya, Ganti Kode"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

