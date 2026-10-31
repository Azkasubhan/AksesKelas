"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

interface DeleteMaterialModalProps {
  materialId: string;
  materialTitle: string;
  csrfToken: string;
  redirectUrl?: string;
  trigger?: React.ReactNode;
}

export function DeleteMaterialModal({
  materialId,
  materialTitle,
  csrfToken,
  redirectUrl,
  trigger,
}: DeleteMaterialModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setIsDeleting(false);
    }
  }, [open]);

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await apiFetch(`/materials/${materialId}`, {
        method: "DELETE",
        csrfToken,
      });

      toast.success(`Materi "${materialTitle}" berhasil dihapus.`);
      setOpen(false);

      if (redirectUrl) {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err) {
      setIsDeleting(false);
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Gagal menghapus materi. Silakan coba lagi.");
      } else {
        setErrorMsg("Terjadi gangguan jaringan saat menghapus materi.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="secondary"
            size="sm"
            className="h-8.5 px-3 gap-1.5 border-danger/30 text-danger hover:bg-danger/10 hover:border-danger hover:text-danger active:bg-danger/20 text-xs font-semibold cursor-pointer"
            title="Hapus materi"
            aria-label={`Hapus materi ${materialTitle}`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Hapus</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        title="Hapus Materi?"
        description="Konfirmasi penghapusan materi."
        className="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-ink leading-relaxed">
            Apakah Anda yakin ingin menghapus materi <strong className="font-semibold text-ink">"{materialTitle}"</strong>? Seluruh draf dan versi materi akan dihapus permanen.
          </p>

          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              variant="secondary"
              size="md"
              disabled={isDeleting}
              onClick={() => setOpen(false)}
              className="cursor-pointer font-medium"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={isDeleting}
              onClick={handleDelete}
              className="gap-2 cursor-pointer font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  <span>Hapus Materi</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
